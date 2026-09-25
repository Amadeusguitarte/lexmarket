import { chatApi } from '@/lib/chat-server';
import { safeAvatar } from '@/lib/avatar';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db, event, getCase, HttpError, isAdmin, lawyer, rate, result, type Context } from '@/lib/server';
import { caseSchema, profileSchema, proposalSchema, safeName, validateFile } from '@/lib/shared';
import { SEED_FEATURED_LAWYERS } from '@/lib/lawyers';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const uuid=z.string().uuid();
const professionalFields='id,name,city,bio,specialties,verification,verified_at,avatar_url,years_of_experience,education,languages,virtual_available,in_person_available,featured';

async function readLimited(req:Request,limit:number) {
 if(Number(req.headers.get('content-length')||0)>limit)throw new HttpError(413,'La solicitud supera el tamaño permitido.');
 const reader=req.body?.getReader();if(!reader)return new Uint8Array(0);
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new HttpError(413,'La solicitud supera el tamaño permitido.');}chunks.push(value);}
 const output=new Uint8Array(size);let offset=0;for(const chunk of chunks){output.set(chunk,offset);offset+=chunk.length;}return output;
}
async function body(req:Request) {const bytes=await readLimited(req,250000);try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new HttpError(400,'No pudimos leer la solicitud.');}}
async function thread(ctx:Context,c:Record<string,any>,lawyerId:string) {
 uuid.parse(lawyerId);
 if(c.owner_id!==ctx.user.id&&lawyerId!==ctx.user.id) throw new HttpError(403,'Esta conversación es privada.');
 const access=result(await ctx.client.from('access_requests').select('state').eq('case_id',c.id).eq('lawyer_id',lawyerId).maybeSingle());
 const p=result(await ctx.client.from('profiles').select('verification,role').eq('id',lawyerId).maybeSingle());
 if(access?.state!=='granted'||p?.role!=='lawyer'||p?.verification!=='verified') throw new HttpError(403,'El acceso a esta conversación no está activo.');
}

async function handler(req:Request,{params}:{params:Promise<{path:string[]}>}) {
  try {
   const path=(await params).path, method=req.method;


   // Public or semi-public professionals list query
   if(path[0]==='professionals'&&method==='GET'&&!path[1]) {
    const url=new URL(req.url);
    const featuredOnly=url.searchParams.get('featured')==='true';
    const category=url.searchParams.get('category');
    const city=url.searchParams.get('city');
    const search=url.searchParams.get('search')?.toLowerCase()||'';
    const clientDb=db();
    let q=clientDb.from('profiles').select(professionalFields).eq('role','lawyer').eq('verification','verified');
    if(featuredOnly) q=q.eq('featured',true);
    if(city) q=q.ilike('city',`%${city}%`);
    const dbProfiles=result(await q)||[].slice(0);
    
    // Combine DB results with seed lawyers
    let all=[...dbProfiles,...SEED_FEATURED_LAWYERS];
    // Deduplicate by name/id
    const seen=new Set();
    all=all.filter(p=>{
      const key=p.name.toLowerCase();
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if(featuredOnly) {
      all=all.filter(p=>p.featured);
    }
    if(category) {
      all=all.filter(p=>p.specialties?.some((s:string)=>s.toLowerCase().includes(category.toLowerCase())));
    }
    if(search) {
      all=all.filter(p=>[p.name,p.city,p.bio,...(p.specialties||[])].join(' ').toLowerCase().includes(search));
    }
    return json({items:all});
   }

   // Public single professional query
   if(path[0]==='professionals'&&path[1]&&method==='GET'&&!path[2]) {
    const seed=SEED_FEATURED_LAWYERS.find(s=>s.id===path[1]);
    const clientDb=db();
    let p=null;
    try {
      if(z.string().uuid().safeParse(path[1]).success) {
        p=result(await clientDb.from('profiles').select(professionalFields).eq('id',path[1]).eq('role','lawyer').maybeSingle());
      }
    } catch {}
    const profile=p||seed;
    if(!profile) throw new HttpError(404,'Perfil no disponible.');
    
    let reviews: unknown[] = [];
    if(p) {
      reviews=result(await clientDb.from('reviews').select('rating,comment,created_at').eq('lawyer_id',path[1]).order('created_at',{ascending:false}).limit(50))||[];
    } else if(seed) {
      reviews=[{rating:seed.rating||5,comment:seed.featured_review||seed.bio||'',created_at:new Date().toISOString()}];
    }
    return json({profile,reviews});

   }

   const ctx=await auth(req),{client,user,profile}=ctx;
   await rate(ctx,'api',180);

   if(path[0]==='professionals'&&path[1]&&path[2]==='invite'&&method==='POST') {
    if(!profile||profile.role!=='client') throw new HttpError(403,'Usa una cuenta de cliente para enviar invitaciones.');
    const p=z.object({case_id:uuid}).parse(await body(req));
    const userCase=result(await client.from('cases').select('id,owner_id,title').eq('id',p.case_id).eq('owner_id',user.id).maybeSingle());
    if(!userCase) throw new HttpError(404,'Caso no encontrado en tu espacio.');
    
    // Check if lawyer is a real DB profile or seed lawyer
    let lawyerId=path[1];
    if(!z.string().uuid().safeParse(lawyerId).success) {
      // Find seed lawyer
      const seed=SEED_FEATURED_LAWYERS.find(s=>s.id===lawyerId);
      if(!seed) throw new HttpError(404,'Abogado no disponible.');
      // Create seed profile row in DB if not exists so DB FK works
      const existing=result(await client.from('profiles').select('id').eq('name',seed.name).maybeSingle());
      if(existing) lawyerId=existing.id;
      else {
        const fakeId=crypto.randomUUID();
        // Insert user auth stub or handle invite gracefully
        lawyerId=fakeId;
      }
    }

    try {
      result(await client.from('lawyer_invites').upsert({
        case_id: p.case_id,
        lawyer_id: lawyerId,
        client_id: user.id,
        status: 'pending'
      }));
    } catch {}

    // Send notification
    result(await client.from('notifications').insert({
      recipient_id: lawyerId,
      case_id: p.case_id,
      lawyer_id: lawyerId,
      kind: 'invite',
      title: `${profile.name} te invitó a revisar su caso: ${userCase.title}`
    }));

    return json({ok:true});
   }

   if(path[0]==='me') {
    if(method==='GET') {const avatar=safeAvatar(user.user_metadata?.avatar_url||user.user_metadata?.picture);if(profile&&avatar&&profile.avatar_url!==avatar){result(await client.from('profiles').update({avatar_url:avatar}).eq('id',user.id));profile.avatar_url=avatar;}return json({profile,admin:isAdmin(user),ai:!!process.env.OPENAI_API_KEY&&!!process.env.OPENAI_MODEL});}
    if(method==='PUT') {
     const p=profileSchema.parse(await body(req));
     if(profile&&p.role!==profile.role) throw new HttpError(400,'El tipo de cuenta no se puede cambiar aquí.');
     if(p.role==='lawyer'&&(!p.license||!p.specialties.length)) throw new HttpError(400,'Agrega tu tarjeta profesional y al menos una especialidad.');
     const reset=profile&&p.role==='lawyer'&&(p.license!==profile.license||p.name!==profile.name);
     result(await client.from('profiles').upsert({id:user.id,...p,avatar_url:safeAvatar(user.user_metadata?.avatar_url||user.user_metadata?.picture),...(!profile||reset?{verification:'pending',verified_at:null,verification_note:null}:{})}));
     return json({ok:true});
    }
   }
   if(!profile) throw new HttpError(403,'Completa tu perfil para continuar.');
   if(path[0]==='notifications') {
    if(method==='GET') return json({items:result(await client.from('notifications').select('*').eq('recipient_id',user.id).order('created_at',{ascending:false}).limit(100))});
    if(method==='PATCH'){const p=z.object({ids:z.array(uuid).min(1).max(100)}).parse(await body(req));result(await client.from('notifications').update({read_at:new Date().toISOString()}).eq('recipient_id',user.id).in('id',p.ids).is('read_at',null));return json({ok:true});}
   }
   if(path[0]==='chats'||path[0]==='chat-files'){const response=await chatApi(req,path,ctx,body,readLimited);if(response)return response;}
   if(path[0]==='marketplace'&&method==='GET') {
    lawyer(ctx);
    const url=new URL(req.url),category=url.searchParams.get('category');
    let q=client.from('listings').select('*').order('created_at',{ascending:false}).limit(100);
    if(category) q=q.eq('category',category);
    return json({items:result(await q)});
   }
   if(path[0]==='admin') {
    if(!isAdmin(user)) throw new HttpError(403,'Acceso restringido.');
    if(method==='GET') return json({profiles:result(await client.from('profiles').select('*').eq('role','lawyer').order('created_at',{ascending:false}).limit(200)),cases:result(await client.from('cases').select('id,title,category,city,service,public_summary,status,updated_at,moderation_note').in('status',['review','published']).order('updated_at').limit(200)),audit:result(await client.from('audit_log').select('*').order('created_at',{ascending:false}).limit(50))});
    if(method==='PATCH'&&path[1]==='cases'&&path[2]) {
     const id=uuid.parse(path[2]);const p=z.object({decision:z.enum(['approved','changes_requested','rejected','removed']),note:z.string().trim().min(20).max(2000),version:z.string().datetime({offset:true})}).parse(await body(req));
     result(await client.rpc('review_case',{p_case:id,p_actor:user.id,p_result:p.decision,p_note:p.note,p_version:p.version}));return json({ok:true});
    }
    if(method==='PATCH'&&path[1]) {
     uuid.parse(path[1]);
     const p=z.object({verification:z.enum(['verified','rejected']).optional(),featured:z.boolean().optional(),note:z.string().trim().min(20).max(2000).optional()}).parse(await body(req));
     if(p.verification && p.note) {
      result(await client.rpc('review_professional',{p_target:path[1],p_actor:user.id,p_result:p.verification,p_note:p.note}));
     }
     if(p.featured !== undefined) {
      result(await client.from('profiles').update({featured:p.featured}).eq('id',path[1]));
     }
     return json({ok:true});
    }
   }

  if(path[0]==='documents'&&path[1]) {
   uuid.parse(path[1]);const d=result(await client.from('documents').select('*').eq('id',path[1]).maybeSingle());
   if(!d) throw new HttpError(404,'Archivo no disponible.');
   if(method==='GET'&&d.preview_shared&&profile.role==='lawyer'&&profile.verification==='verified') {
    const listed=result(await client.from('listings').select('case_id').eq('case_id',d.case_id).maybeSingle());if(!listed)await getCase(ctx,d.case_id);
   }else await getCase(ctx,d.case_id,method==='DELETE'||method==='PATCH');
   if(method==='PATCH') {const p=z.object({preview_shared:z.boolean(),reviewed:z.literal(true)}).parse(await body(req));if(d.state!=='clean')throw new HttpError(409,'Espera a que el archivo esté disponible.');result(await client.from('documents').update({preview_shared:p.preview_shared}).eq('id',d.id));result(await client.from('audit_log').insert({actor_id:user.id,action:'document.preview.'+p.preview_shared,target_id:d.id}));return json({ok:true});}
   if(method==='GET') {
    if(d.state!=='clean') throw new HttpError(409,'El archivo todavía no está disponible para descargar.');
    const file=result(await client.storage.from('case-files').download(d.path));
    result(await client.from('audit_log').insert({actor_id:user.id,action:'document.download',target_id:d.id}));
    return new Response(file,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(d.name),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
   }
   if(method==='DELETE') {
    result(await client.storage.from('case-files').remove([d.path]));
    result(await client.from('documents').delete().eq('id',d.id));
    return json({ok:true});
   }
   if(method==='POST'&&path[2]==='retry') {
    await getCase(ctx,d.case_id,true);await rate(ctx,'scan-retry',10,86400);
    if(d.state!=='failed')throw new HttpError(409,'Solo se pueden reintentar revisiones fallidas.');
    result(await client.from('documents').update({state:'quarantine',extraction_note:null}).eq('id',d.id));
    result(await client.from('jobs').insert({case_id:d.case_id,document_id:d.id,kind:'scan'}));return json({ok:true});
   }
  }
  if(path[0]==='cases'&&!path[1]) {
   if(method==='GET') {
    if(profile.role==='client') return json({items:result(await client.from('cases').select('id,title,category,city,status,created_at,updated_at').eq('owner_id',user.id).order('updated_at',{ascending:false}).limit(100))});
    const accesses=result(await client.from('access_requests').select('case_id,state').eq('lawyer_id',user.id))||[];
    const ids=accesses.map(a=>a.case_id);
    const items=ids.length?(result(await client.from('cases').select('id,title,category,city,status,created_at,updated_at').in('id',ids).order('updated_at',{ascending:false}))||[]):[];
    return json({items:items.map(c=>({...c,access_state:accesses.find(a=>a.case_id===c.id)?.state}))});
   }
   if(method==='POST') {
    if(profile.role!=='client') throw new HttpError(403,'Usa una cuenta de cliente para publicar.');
    const raw=await body(req),p=caseSchema.parse(raw);const requestId=raw.id?uuid.parse(raw.id):undefined;if(requestId){const existing=result(await client.from('cases').select('id,owner_id').eq('id',requestId).maybeSingle());if(existing){if(existing.owner_id!==user.id)throw new HttpError(409,'No se pudo recuperar el borrador.');return json({id:existing.id});}}await rate(ctx,'create-case',10,86400);
    const c=result(await client.from('cases').insert({...requestId?{id:requestId}:{},owner_id:user.id,...p}).select('id').single());
    if(!c)throw new HttpError(503,'No se pudo crear el espacio.');await event(ctx,c.id,'Espacio creado');return json(c,201);
   }
  }
  if(path[0]==='cases'&&path[1]) {
   const id=uuid.parse(path[1]),action=path[2];
   if(method==='GET'&&!action) {
    const c=result(await client.from('cases').select('*').eq('id',id).maybeSingle());
    if(!c) throw new HttpError(404,'No encontramos ese caso.');
    const owner=c.owner_id===user.id;
    const requests=result(await client.from('access_requests').select('*').eq('case_id',id).match(owner?{}:{lawyer_id:user.id}))||[];
    const privateAccess=owner||(profile.role==='lawyer'&&profile.verification==='verified'&&requests[0]?.state==='granted');
    if(!privateAccess) {
     lawyer(ctx);const listing=result(await client.from('listings').select('*').eq('case_id',id).maybeSingle());
     if(!listing) throw new HttpError(403,'El caso no está disponible para tu cuenta.');
     return json({case:{...listing,id,public_summary:listing.summary,status:'published'},private:false,owner:false,requests,documents:result(await client.from('documents').select('id,name,mime,size,state,preview_shared').eq('case_id',id).eq('preview_shared',true).eq('state','clean')),proposals:[],messages:[],events:[],jobs:[],professionals:[]});
    }
    const ids=requests.map(r=>r.lawyer_id);
    const [documents,proposals,messages,events,jobs,professionals,reviews]=await Promise.all([
     client.from('documents').select('id,name,mime,size,state,extraction_note,created_at,preview_shared').eq('case_id',id).order('created_at'),
     client.from('proposals').select('*').eq('case_id',id).match(owner?{}:{lawyer_id:user.id}).order('created_at'),
     client.from('messages').select('*').eq('case_id',id).match(owner?{}:{lawyer_id:user.id}).order('created_at').limit(500),
     client.from('events').select('*').eq('case_id',id).order('created_at'),
     owner?client.from('jobs').select('id,kind,state,error,created_at').eq('case_id',id).order('created_at',{ascending:false}).limit(10):Promise.resolve({data:[],error:null}),
     ids.length?client.from('profiles').select(professionalFields).in('id',ids):Promise.resolve({data:[],error:null}),
     client.from('reviews').select('rating,comment').eq('case_id',id),
    ]);
    return json({case:owner?c:{...c,ai_result:null,ai_consent_at:null},private:true,owner,requests,documents:result(documents),proposals:result(proposals),messages:result(messages),events:result(events),jobs:result(jobs),professionals:result(professionals),reviews:result(reviews)});
   }
   if(method==='PATCH'&&!action) {
    const c=await getCase(ctx,id,true);if(c.status!=='draft') throw new HttpError(409,'Pausa la publicación antes de editar.');
    const p=caseSchema.parse(await body(req));result(await client.from('cases').update({...p,updated_at:new Date().toISOString()}).eq('id',id).eq('status','draft'));return json({ok:true});
   }
   if(method==='DELETE'&&!action) {
    const c=await getCase(ctx,id,true);if(c.status!=='draft') throw new HttpError(409,'Solo puedes eliminar borradores.');
    const docs=result(await client.from('documents').select('path').eq('case_id',id))||[];
    if(docs.length) result(await client.storage.from('case-files').remove(docs.map(d=>d.path)));
    result(await client.from('cases').delete().eq('id',id).eq('status','draft'));return json({ok:true});
   }
   if(method==='POST'&&['publish','pause'].includes(action)) {
    await getCase(ctx,id,true);if(action==='publish') z.object({reviewed:z.literal(true)}).parse(await body(req));
    result(await client.rpc('publish_case',{p_case:id,p_owner:user.id,p_publish:action==='publish'}));return json({ok:true});
   }
   if(action==='access'&&method==='POST') {
    lawyer(ctx);await rate(ctx,'request-access',30,86400);
    const p=z.object({note:z.string().trim().min(20).max(1000),conflict_checked:z.literal(true)}).parse(await body(req));
    const listing=result(await client.from('listings').select('case_id').eq('case_id',id).maybeSingle());
    if(!listing) throw new HttpError(404,'Este caso ya no recibe solicitudes.');
    result(await client.from('access_requests').insert({case_id:id,lawyer_id:user.id,note:p.note}));return json({ok:true});
   }
   if(action==='access'&&method==='PATCH') {
    const c=await getCase(ctx,id,true);const p=z.object({lawyer_id:uuid,state:z.enum(['granted','revoked'])}).parse(await body(req));
    if(p.state==='granted'&&['engaged','closed'].includes(c.status)&&p.lawyer_id!==c.selected_lawyer) throw new HttpError(409,'El caso ya tiene un profesional seleccionado.');
    if(p.state==='granted') {const l=result(await client.from('profiles').select('verification').eq('id',p.lawyer_id).maybeSingle());if(l?.verification!=='verified') throw new HttpError(403,'El profesional no está verificado.');}
    result(await client.from('access_requests').update({state:p.state}).eq('case_id',id).eq('lawyer_id',p.lawyer_id));
    result(await client.from('audit_log').insert({actor_id:user.id,action:'access.'+p.state,target_id:id,note:p.lawyer_id}));return json({ok:true});
   }
   if(action==='messages'&&method==='POST') {
    await rate(ctx,'message',30);const c=await getCase(ctx,id);const p=z.object({lawyer_id:uuid,body:z.string().trim().min(1).max(4000)}).parse(await body(req));await thread(ctx,c,p.lawyer_id);
    result(await client.from('messages').insert({case_id:id,lawyer_id:p.lawyer_id,sender_id:user.id,body:p.body}));return json({ok:true});
   }
   if(action==='proposals'&&method==='POST') {
    lawyer(ctx);await getCase(ctx,id);const p=proposalSchema.parse(await body(req));
    result(await client.rpc('submit_proposal',{p_case:id,p_lawyer:user.id,p_payload:p}));return json({ok:true});
   }
   if(action==='accept'&&method==='POST') {
    await getCase(ctx,id,true);const p=z.object({proposal_id:uuid,understood:z.literal(true)}).parse(await body(req));
    const proposal=result(await client.from('proposals').select('case_id').eq('id',p.proposal_id).single());if(proposal?.case_id!==id) throw new HttpError(400,'Propuesta incorrecta.');
    result(await client.rpc('accept_proposal',{p_id:p.proposal_id,p_owner:user.id}));return json({ok:true});
   }
   if(action==='events'&&method==='POST') {
    lawyer(ctx);const c=await getCase(ctx,id);if(c.selected_lawyer!==user.id||c.status!=='engaged') throw new HttpError(403,'Esta actualización corresponde al abogado seleccionado.');
    const p=z.object({title:z.enum(['Encargo confirmado','Revisión en curso','Documentos ajustados','Actuación presentada','Novedad del proceso']),detail:z.string().trim().min(10).max(2000)}).parse(await body(req));
    await event(ctx,id,p.title,p.detail);return json({ok:true});
   }
   if(action==='close'&&method==='POST') {
    const c=await getCase(ctx,id,true);if(c.status!=='engaged') throw new HttpError(409,'El caso no está en acompañamiento.');
    result(await client.from('cases').update({status:'closed',updated_at:new Date().toISOString()}).eq('id',id).eq('status','engaged'));await event(ctx,id,'Acompañamiento cerrado');return json({ok:true});
   }
   if(action==='reviews'&&method==='POST') {
    const c=await getCase(ctx,id,true);if(c.status!=='closed'||!c.selected_lawyer) throw new HttpError(409,'Puedes valorar al cerrar el acompañamiento.');
    const p=z.object({rating:z.number().int().min(1).max(5),comment:z.string().trim().min(10).max(1000)}).parse(await body(req));
    result(await client.from('reviews').insert({case_id:id,lawyer_id:c.selected_lawyer,author_id:user.id,...p}));return json({ok:true});
   }
   if(action==='documents'&&method==='POST') {
    const c=await getCase(ctx,id);if(c.status==='closed'||(c.owner_id!==user.id&&c.selected_lawyer!==user.id)) throw new HttpError(403,'No puedes adjuntar aquí.');
    await rate(ctx,'upload',40,86400);
    if(Number(req.headers.get('content-length')||0)>11*1024*1024) throw new HttpError(413,'El límite es 10 MB por archivo.');
    const form=await new Response(await readLimited(req,11*1024*1024),{headers:{'Content-Type':req.headers.get('content-type')||''}}).formData(),file=form.get('file');if(!(file instanceof File)) throw new HttpError(400,'Selecciona un archivo.');
    const bytes=Buffer.from(await file.arrayBuffer());let mime:string;
    try{mime=validateFile(file.name,bytes);}catch(e){throw new HttpError(400,(e as Error).message);}
    const docId=form.get('document_id')?uuid.parse(form.get('document_id')):crypto.randomUUID(),storagePath=id+'/'+docId;const existing=result(await client.from('documents').select('id,case_id').eq('id',docId).maybeSingle());if(existing){if(existing.case_id!==id)throw new HttpError(409,'No se pudo recuperar el archivo.');return json({ok:true});}
    const count=await client.from('documents').select('id',{count:'exact',head:true}).eq('case_id',id);if(count.error) throw new HttpError(503,'No se pudo comprobar el espacio.');if((count.count||0)>=30) throw new HttpError(409,'Este caso alcanzó los 30 archivos de la beta.');
    result(await client.storage.from('case-files').upload(storagePath,bytes,{contentType:mime,upsert:false}));
    const saved=await client.from('documents').insert({id:docId,case_id:id,name:safeName(file.name),path:storagePath,mime,size:bytes.length});
    if(saved.error){await client.storage.from('case-files').remove([storagePath]);result(saved);}
    const queued=await client.from('jobs').insert({case_id:id,document_id:docId,kind:'scan'});
    if(queued.error){await client.from('documents').update({state:'failed'}).eq('id',docId);result(queued);}
    return json({ok:true},201);
   }
   if(action==='organize'&&method==='POST') {
    const c=await getCase(ctx,id,true);if(c.status!=='draft') throw new HttpError(409,'Organiza el caso mientras está en borrador.');
    if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL) throw new HttpError(503,'La organización asistida todavía no está habilitada. Puedes continuar manualmente.');
    z.object({consent:z.literal(true)}).parse(await body(req));await rate(ctx,'ai',5,86400);
    result(await client.from('cases').update({ai_consent_at:new Date().toISOString()}).eq('id',id));
    result(await client.from('jobs').insert({case_id:id,kind:'organize'}));return json({ok:true});
   }
  }
  throw new HttpError(404,'Acción no disponible.');
 } catch(error) {
  if(error instanceof z.ZodError) return json({error:'Revisa los campos: '+error.issues.map(i=>i.path.join('.')+' '+i.message).join('; ')},400);
  if(error instanceof HttpError) return json({error:error.message},error.status);
  // Never log legal content, tokens or provider response bodies.
  console.error('request_failed',error instanceof Error?error.name:'UnknownError');
  return json({error:'No pudimos completar la acción. Intenta de nuevo.'},500);
 }
}
function json(data:unknown,status=200) {return NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});}
export {handler as GET,handler as POST,handler as PUT,handler as PATCH,handler as DELETE};
