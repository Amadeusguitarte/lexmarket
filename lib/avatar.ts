export function safeAvatar(value:unknown):string|null {
 if(typeof value!=='string')return null;
 const trimmed = value.trim();
 if(!trimmed) return null;
 if(trimmed.startsWith('data:image/')){
   if(trimmed.length<=2000000 && /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(trimmed)){
     return trimmed;
   }
   return null;
 }
 try{
   const u=new URL(trimmed);
   const h=u.hostname;
   const allowed=h==='lh3.googleusercontent.com'||
     h.endsWith('.googleusercontent.com')||
     h.endsWith('.supabase.co')||
     h==='media.licdn.com'||
     h.endsWith('.licdn.com')||
     h.endsWith('.linkedin.com');
   return u.protocol==='https:'&&allowed?u.href:null;
 }catch{return null;}
}
