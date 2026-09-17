import { createClient } from '@supabase/supabase-js';
let client:ReturnType<typeof createClient>|null=null;
export function browserDB() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return client ||= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
export async function api(path:string, method='GET', body?:unknown) {
  const {data}=await browserDB()!.auth.getSession();
  const multipart=body instanceof FormData;
  const response=await fetch('/api/'+path,{method,cache:'no-store',headers:{Authorization:'Bearer '+data.session?.access_token,...(multipart?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:multipart?body:JSON.stringify(body)});
  const result=await response.json();
  if (!response.ok) throw new Error(result.error||'No pudimos completar la acción.');
  return result;
}
