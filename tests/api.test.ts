import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../app/api/[...path]/route';
const uid='00000000-0000-4000-8000-000000000001',owner='00000000-0000-4000-8000-000000000002',cid='00000000-0000-4000-8000-000000000003',docid='00000000-0000-4000-8000-000000000004';
test('API rejects anonymous calls before opening database resources',async()=>{
 const response=await GET(new Request('https://lexmarket.test/api/cases'),{params:Promise.resolve({path:['cases']})});
 assert.equal(response.status,401);
});
test('API denies guessed private document IDs and does not contact Storage',async t=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-key-not-a-secret';
 t.after(()=>{if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;});
 const calls:string[]=[];
 t.mock.method(globalThis,'fetch',async (input:RequestInfo|URL)=>{
  const url=new URL(input instanceof Request?input.url:input.toString());calls.push(url.pathname);
  let data:unknown;
  if(url.pathname==='/auth/v1/user')data={id:uid,email:'lawyer@example.test',email_confirmed_at:'2026-01-01T00:00:00Z'};
  else if(url.pathname==='/rest/v1/profiles')data=[{id:uid,name:'Lawyer',role:'lawyer',verification:'verified'}];
  else if(url.pathname==='/rest/v1/rpc/take_rate')data=true;
  else if(url.pathname==='/rest/v1/documents')data=[{id:docid,case_id:cid,path:'private-file',state:'clean'}];
  else if(url.pathname==='/rest/v1/cases')data=[{id:cid,owner_id:owner,description:'PRIVATE LEGAL FACTS'}];
  else if(url.pathname==='/rest/v1/access_requests')data=[];
  else throw new Error('Unexpected backend request '+url.pathname);
  return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
 });
 const response=await GET(new Request('https://lexmarket.test/api/documents/'+docid,{headers:{Authorization:'Bearer fake-user-token'}}),{params:Promise.resolve({path:['documents',docid]})});
 assert.equal(response.status,403);assert.equal(calls.some(p=>p.startsWith('/storage')),false);assert.doesNotMatch(await response.text(),/PRIVATE LEGAL FACTS|private-file/);
});
test('retrying a case creation returns the same case and cannot claim another owner',async t=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-key-not-a-secret';
 t.after(()=>{if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;});
 let otherOwner=false;
 t.mock.method(globalThis,'fetch',async(input:RequestInfo|URL,options?:RequestInit)=>{
  const url=new URL(input instanceof Request?input.url:input.toString());
  if(url.pathname!=='/rest/v1/rpc/take_rate')assert.notEqual(options?.method,'POST','a retry must not insert');
  let data:unknown;
  if(url.pathname==='/auth/v1/user')data={id:uid,email:'client@example.test',email_confirmed_at:'2026-01-01T00:00:00Z'};
  else if(url.pathname==='/rest/v1/profiles')data=[{id:uid,name:'Client',role:'client'}];
  else if(url.pathname==='/rest/v1/rpc/take_rate'){assert.ok(String(options?.body).includes(':api'));data=true;}
  else if(url.pathname==='/rest/v1/cases')data=[{id:cid,owner_id:otherOwner?owner:uid}];
  else throw new Error('Unexpected request '+url.pathname);
  return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
 });
 const request=()=>new Request('https://lexmarket.test/api/cases',{method:'POST',headers:{Authorization:'Bearer test-token','Content-Type':'application/json'},body:JSON.stringify({id:cid,title:'Mi reclamación laboral',category:'Laboral',city:'Bogotá',service:'Revisar y orientar',description:'Este relato es de prueba y contiene los hechos de un caso ficticio.'})});
 const response=await POST(request(),{params:Promise.resolve({path:['cases']})});assert.equal(response.status,200);assert.deepEqual(await response.json(),{id:cid});
 otherOwner=true;const rejected=await POST(request(),{params:Promise.resolve({path:['cases']})});assert.equal(rejected.status,409);
});
