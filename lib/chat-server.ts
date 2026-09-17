import {z} from 'zod';
import {type Context,getCase,HttpError,rate,result} from './server';
import {safeName,validateFile} from './shared';
const uuid=z.string().uuid();
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function chatThread(ctx:Context,caseId:string,lawyerId:string){
 uuid.parse(caseId);uuid.parse(lawyerId);const c=result(await ctx.client.from('cases').select('*').eq('id',caseId).maybeSingle());if(!c)throw new HttpError(404,'Caso no disponible.');
 if(ctx.user.id!==c.owner_id&&ctx.user.id!==lawyerId)throw new HttpError(403,'Esta conversación es privada.');
 const [access,professional]=await Promise.all([ctx.client.from('access_requests').select('state').eq('case_id',caseId).eq('lawyer_id',lawyerId).maybeSingle(),ctx.client.from('profiles').select('id,name,avatar_url,verification,role').eq('id',lawyerId).maybeSingle()]);
 const a=result(access),p=result(professional);
 if(!['requested','granted'].includes(a?.state)||p?.verification!=='verified'||p?.role!=='lawyer')throw new HttpError(403,'El acceso a esta conversación no está activo.');
 return {...c,access_state:a!.state};
}
export async function chatApi(req:Request,path:string[],ctx:Context,readBody:(r:Request)=>Promise<any>,readLimited:(r:Request,n:number)=>Promise<Uint8Array>){
 const {client,user,profile}=ctx,method=req.method;
 if(path[0]==='chat-files'&&method==='GET'){
  const d=result(await client.from('chat_attachments').select('*').eq('id',uuid.parse(path[1])).maybeSingle());
  if(!d)throw new HttpError(404,'Archivo no disponible.');await chatThread(ctx,d.case_id,d.lawyer_id);
  const file=result(await client.storage.from('case-files').download(d.path));
  return new Response(file,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(d.name),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }
 if(path[0]!=='chats')return null;
 if(!path[1]&&method==='GET'){
  let requests:any[]=[];
  if(profile.role==='lawyer')requests=result(await client.from('access_requests').select('case_id,lawyer_id,state,created_at').eq('lawyer_id',user.id).in('state',['requested','granted']).limit(100))||[];
  else {const cases=result(await client.from('cases').select('id').eq('owner_id',user.id).limit(100))||[];if(cases.length)requests=result(await client.from('access_requests').select('case_id,lawyer_id,state,created_at').in('case_id',cases.map(c=>c.id)).in('state',['requested','granted']).limit(100))||[];}
  const items=await Promise.all(requests.map(async a=>{
   const c=result(await client.from('cases').select('id,title,owner_id,status').eq('id',a.case_id).single());
   const lawyer=result(await client.from('profiles').select('id,name,avatar_url,verification').eq('id',a.lawyer_id).single());
   if(!c||!lawyer||lawyer.verification!=='verified')return null;
   const peer=profile.role==='lawyer'&&a.state!=='granted'?{name:'Cliente',avatar_url:null}:profile.role==='lawyer'?result(await client.from('profiles').select('id,name,avatar_url').eq('id',c.owner_id).single()):lawyer;
   const [last,unread]=await Promise.all([client.from('messages').select('body,created_at,sender_id').eq('case_id',c.id).eq('lawyer_id',a.lawyer_id).order('created_at',{ascending:false}).limit(1),client.from('messages').select('id',{count:'exact',head:true}).eq('case_id',c.id).eq('lawyer_id',a.lawyer_id).neq('sender_id',user.id).is('read_at',null)]);
   result(unread);return {...a,title:c.title,status:c.status,peer,last:result(last)?.[0]||null,unread:unread.count||0};
  }));return json({items:items.filter(Boolean).sort((a,b)=>(b?.last?.created_at||b?.created_at||'').localeCompare(a?.last?.created_at||a?.created_at||''))});
 }
 const caseId=uuid.parse(path[1]),lawyerId=uuid.parse(path[2]),action=path[3],c=await chatThread(ctx,caseId,lawyerId);
 const filter={case_id:caseId,lawyer_id:lawyerId};
 if(method==='GET'&&!action){
  const before=new URL(req.url).searchParams.get('before');if(before)z.string().datetime({offset:true}).parse(before);
  let query=client.from('messages').select('*').match(filter).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(60);if(before)query=query.lt('created_at',before);
  const messages=result(await query)||[];
  const incoming=messages.filter(m=>m.sender_id!==user.id&&!m.delivered_at).map(m=>m.id);
  const delivery=incoming.length?client.from('messages').update({delivered_at:new Date().toISOString()}).in('id',incoming).is('delivered_at',null):Promise.resolve({data:null,error:null});
  const ids=messages.map(m=>m.attachment_id).filter(Boolean),peerId=user.id===c.owner_id?lawyerId:c.owner_id;
  const [files,activity,proposals,peer,delivered]=await Promise.all([ids.length?client.from('chat_attachments').select('id,name,size,mime').in('id',ids):Promise.resolve({data:[],error:null}),client.from('chat_activity').select('*').match(filter),client.from('proposals').select('*').match(filter).order('created_at'),client.from('profiles').select('id,name,avatar_url').eq('id',peerId).single(),delivery]);
  result(delivered);
  return json({messages:messages.reverse(),files:result(files),activity:result(activity),proposals:result(proposals),peer:user.id!==c.owner_id&&c.access_state!=='granted'?{name:'Cliente',avatar_url:null}:result(peer),access_state:c.access_state,case:{id:c.id,title:c.title,status:c.status,summary:c.public_summary},owner:user.id===c.owner_id,hasMore:messages.length===60});
 }
 if(action==='activity'&&method==='POST'){
  const p=z.object({typing:z.boolean().default(false),read_ids:z.array(uuid).max(60).default([])}).parse(await readBody(req));
  const now=new Date().toISOString();result(await client.from('chat_activity').upsert({...filter,user_id:user.id,last_seen_at:now,typing_until:p.typing?new Date(Date.now()+7000).toISOString():null}));
  if(p.read_ids.length)result(await client.from('messages').update({read_at:now,delivered_at:now}).match(filter).in('id',p.read_ids).neq('sender_id',user.id).is('read_at',null));
  return json({ok:true});
 }
 if(action==='messages'&&method==='POST'){
  await rate(ctx,'message',30);const p=z.object({id:uuid,body:z.string().trim().min(1).max(4000)}).parse(await readBody(req));
  const old=result(await client.from('messages').select('id,case_id,lawyer_id,sender_id').eq('id',p.id).maybeSingle());
  if(old){if(old.case_id!==caseId||old.lawyer_id!==lawyerId||old.sender_id!==user.id)throw new HttpError(409,'No se pudo recuperar el mensaje.');return json({id:old.id});}
  result(await client.from('messages').insert({...filter,...p,sender_id:user.id}));return json({id:p.id},201);
 }
 if(action==='files'&&method==='POST'){
  await rate(ctx,'chat-upload',50,86400);
  const bytes=await readLimited(req,11*1024*1024);const form=await new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('Content-Type')||''},body:bytes as any}).formData();
  const file=form.get('file');if(!(file instanceof File))throw new HttpError(400,'Selecciona un archivo.');
  const id=uuid.parse(form.get('id')),data=Buffer.from(await file.arrayBuffer());let mime:string;
  try{mime=validateFile(file.name,data);}catch(e){throw new HttpError(400,(e as Error).message);}
  const old=result(await client.from('messages').select('id,case_id,lawyer_id,sender_id').eq('id',id).maybeSingle());
  if(old){if(old.case_id!==caseId||old.lawyer_id!==lawyerId||old.sender_id!==user.id)throw new HttpError(409,'Archivo no disponible.');return json({id});}
  const storagePath='chat/'+caseId+'/'+lawyerId+'/'+id;
  result(await client.storage.from('case-files').upload(storagePath,data,{contentType:mime,upsert:false}));
  try{
   result(await client.from('chat_attachments').insert({id,...filter,sender_id:user.id,name:safeName(file.name),path:storagePath,mime,size:data.length}));
   result(await client.from('messages').insert({id,...filter,sender_id:user.id,body:'Documento: '+safeName(file.name),attachment_id:id}));
  }catch(e){await client.from('chat_attachments').delete().eq('id',id);await client.storage.from('case-files').remove([storagePath]);throw e;}
  return json({id},201);
 }
 throw new HttpError(404,'Acción de conversación no disponible.');
}
