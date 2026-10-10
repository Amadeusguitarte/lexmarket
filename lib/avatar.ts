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
   return u.protocol==='https:'&&(u.hostname==='lh3.googleusercontent.com'||u.hostname.endsWith('.googleusercontent.com')||u.hostname.endsWith('.supabase.co'))?u.href:null;
 }catch{return null;}
}
