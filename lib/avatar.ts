export function safeAvatar(value:unknown):string|null {
 if(typeof value!=='string')return null;
 try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='lh3.googleusercontent.com'||u.hostname.endsWith('.googleusercontent.com'))?u.href:null;}catch{return null;}
}
