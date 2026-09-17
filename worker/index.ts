import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { db, result } from '../lib/server';
import { organize } from './organize';
const client=db();let stopping=false;
process.on('SIGTERM',()=>{stopping=true;});process.on('SIGINT',()=>{stopping=true;});
async function extract(bytes:Buffer,mime:string):Promise<string>{return new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['--max-old-space-size=128','--import','tsx',fileURLToPath(new URL('./extract.ts',import.meta.url)),mime],{stdio:['pipe','pipe','ignore'],env:{PATH:process.env.PATH||'',NODE_ENV:'production'}});
 const chunks:Buffer[]=[];let size=0;
 const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('Extraction timeout'));},25000);
 child.stdout.on('data',chunk=>{size+=chunk.length;if(size>500000){child.kill('SIGKILL');reject(new Error('Output too large'));}else chunks.push(chunk);});
 child.on('error',error=>{clearTimeout(timer);reject(error);});
 child.stdin.on('error',()=>{});
 child.on('close',code=>{clearTimeout(timer);code===0?resolve(Buffer.concat(chunks).toString()):reject(new Error('Extraction failed'));});
 child.stdin.end(bytes);
});}
async function work(job:Record<string,any>) {
 if(job.kind==='scan') {
  const d=result(await client.from('documents').select('*').eq('id',job.document_id).maybeSingle());if(!d)return;
  const file=result(await client.storage.from('case-files').download(d.path));if(!file)throw new Error('File unavailable');const bytes=Buffer.from(await file.arrayBuffer());
  let text='',note:string|null=null;
  try{text=await extract(bytes,d.mime);if(!text.trim())note='No se encontró texto. Un PDF escaneado puede necesitar una transcripción.';else if(text.length>=100000)note='La organización asistida usará un extracto por el tamaño del archivo.';}
  catch{note='El archivo se puede descargar, pero su texto no se pudo extraer. Puedes pegar las partes relevantes en el relato.';}
  result(await client.from('documents').update({state:'clean',extracted_text:text,extraction_note:note}).eq('id',d.id));
 }else{
  const c=result(await client.from('cases').select('description,ai_consent_at,status').eq('id',job.case_id).maybeSingle());if(!c||!c.ai_consent_at||c.status!=='draft')return;
  const docs=result(await client.from('documents').select('extracted_text,state').eq('case_id',job.case_id).order('created_at').limit(30))||[];
  const clean=docs.filter(d=>d.state==='clean'&&d.extracted_text);
  const source=JSON.stringify({relato:c.description,documentos:clean.map((d,i)=>({referencia:'Documento '+(i+1),texto:d.extracted_text}))});
  const cap=80000;
  const suggestion=await organize(source.slice(0,cap));
  const sourceNote=[source.length>cap?'Se utilizó un extracto por el tamaño del material.':'Se procesó el texto disponible dentro del límite de esta solicitud.',docs.length!==clean.length?'Algunos archivos no tienen texto disponible o no han terminado la revisión.':''].filter(Boolean).join(' ');
  // A result is only a private suggestion. Never changes the listing or user's fields.
  result(await client.from('cases').update({ai_result:{...suggestion,source_note:sourceNote}}).eq('id',job.case_id).eq('status','draft'));
 }
}
async function main(){console.info('LexMarket worker started');while(!stopping){let job:Record<string,any>|undefined;try{
 const jobs=result(await client.rpc('claim_job'));job=jobs?.[0];
 if(job){await work(job);result(await client.from('jobs').update({state:'done',error:null}).eq('id',job.id));}
 }catch{
  console.error('worker_job_failed',job?.id||'queue');
  if(job){const exhausted=job.attempts>=3;await client.from('jobs').update({state:exhausted?'failed':'queued',error:exhausted?'No se pudo procesar. Revisa la conexión del servicio o contacta soporte.':null}).eq('id',job.id);if(exhausted&&job.document_id)await client.from('documents').update({state:'failed',extraction_note:'No se pudo procesar el archivo.'}).eq('id',job.document_id);}
 }
 await new Promise(r=>setTimeout(r,2500));
}console.info('LexMarket worker stopped');}
main().catch(()=>{console.error('worker_start_failed');process.exitCode=1;});
