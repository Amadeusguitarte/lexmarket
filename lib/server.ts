import { createClient, type User } from '@supabase/supabase-js';
import { canReadPrivate } from './shared';
export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export function db() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) throw new HttpError(503,'Estamos preparando la apertura. Vuelve pronto.');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export function result<T>(r:{data:T;error:unknown}):T {if(r.error) throw new HttpError(409,'No se pudo guardar el cambio. Actualiza e inténtalo de nuevo.');return r.data;}
export function isAdmin(user:User) {return !!user.email_confirmed_at && (process.env.ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean).includes(user.email?.toLowerCase()||'');}
export async function auth(req:Request) {
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token) throw new HttpError(401,'Inicia sesión para continuar.');
 const client=db(); const {data,error}=await client.auth.getUser(token);
 if(error||!data.user) throw new HttpError(401,'Tu sesión venció. Inicia sesión de nuevo.');
 if(!data.user.email_confirmed_at) throw new HttpError(403,'Confirma tu correo para continuar.');
 const profile=result(await client.from('profiles').select('*').eq('id',data.user.id).maybeSingle());
 return {client,user:data.user,profile};
}
export type Context=Awaited<ReturnType<typeof auth>>;
export async function rate(ctx:Context,key:string,limit=60,seconds=60) {const ok=result(await ctx.client.rpc('take_rate',{p_key:ctx.user.id+':'+key,p_limit:limit,p_seconds:seconds}));if(!ok) throw new HttpError(429,'Has hecho varias solicitudes. Espera un momento antes de continuar.');}
export function lawyer(ctx:Context) {if(ctx.profile?.role!=='lawyer'||ctx.profile.verification!=='verified') throw new HttpError(403,'Tu perfil profesional debe estar verificado.');}
export async function getCase(ctx:Context,id:string,ownerOnly=false) {
 const c=result(await ctx.client.from('cases').select('*').eq('id',id).maybeSingle());
 if(!c) throw new HttpError(404,'No encontramos ese caso.');
 const access=c.owner_id===ctx.user.id?null:result(await ctx.client.from('access_requests').select('state').eq('case_id',id).eq('lawyer_id',ctx.user.id).maybeSingle());
 if(ownerOnly?c.owner_id!==ctx.user.id:!canReadPrivate(c.owner_id,ctx.user.id,ctx.profile?.role==='lawyer'&&ctx.profile?.verification==='verified',access?.state)) throw new HttpError(403,'Necesitas autorización para abrir este expediente.');
 return c;
}
export async function event(ctx:Context,id:string,title:string,detail='') {result(await ctx.client.from('events').insert({case_id:id,actor_id:ctx.user.id,title,detail}));}
