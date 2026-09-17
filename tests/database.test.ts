import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('real PostgreSQL migrations, access boundaries, publication and atomic selection',async()=>{
 const pg=new PGlite();
 try {
 await pg.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 for(const name of ['001_initial.sql','002_proposals.sql','003_file_limit.sql']){
  let sql=await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8');
  // PGlite has gen_random_uuid built in; Supabase installs pgcrypto separately.
  sql=sql.replace('create extension if not exists pgcrypto;','');await pg.exec(sql);
 }
 const owner='00000000-0000-4000-8000-000000000001',lawyer='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003',cid='00000000-0000-4000-8000-000000000004';
 await pg.query('insert into auth.users values ($1),($2),($3)',[owner,lawyer,other]);
 await pg.query(`insert into profiles(id,name,role,verification) values ($1,'Client','client','pending'),($2,'Lawyer','lawyer','verified'),($3,'Other','lawyer','verified')`,[owner,lawyer,other]);
 await pg.query(`insert into cases(id,owner_id,title,category,city,service,description,public_summary) values ($1,$2,'Revisión laboral','Laboral','Bogotá','Revisar y orientar','PRIVATE IDENTITY AND FACTS','Resumen aprobado sin identidades ni datos privados.')`,[cid,owner]);
 await pg.exec('set role authenticated');
 await assert.rejects(pg.query('select * from cases'));
 await assert.rejects(pg.query(`update profiles set verification='verified'`));
 await assert.rejects(pg.query('select public.publish_case($1,$2,true)',[cid,owner]));
 await pg.exec('reset role');
 await assert.rejects(pg.query('select publish_case($1,$2,true)',[cid,other]));
 await pg.query('select publish_case($1,$2,true)',[cid,owner]);
 const listing=(await pg.query<Record<string,unknown>>('select * from listings')).rows[0];assert.equal('description' in listing,false);assert.equal('owner_id' in listing,false);assert.equal(JSON.stringify(listing).includes('PRIVATE'),false);
 const payload={scope:'Revisión y entrega de observaciones al escrito',exclusions:'No incluye presentación',amount:250000,days:5,payment_terms:'Al confirmar el encargo'};
 await assert.rejects(pg.query('select submit_proposal($1,$2,$3)',[cid,lawyer,JSON.stringify(payload)]));
 await pg.query(`insert into access_requests(case_id,lawyer_id,state,note) values ($1,$2,'granted','Experiencia relevante'),($1,$3,'granted','Experiencia relevante')`,[cid,lawyer,other]);
 await pg.query('select submit_proposal($1,$2,$3)',[cid,lawyer,JSON.stringify(payload)]);
 await pg.query('select submit_proposal($1,$2,$3)',[cid,other,JSON.stringify(payload)]);
 const offers=(await pg.query<{id:string;lawyer_id:string}>('select id,lawyer_id from proposals order by lawyer_id')).rows;
 await assert.rejects(pg.query('select accept_proposal($1,$2)',[offers[0].id,other]));
 await pg.query('select accept_proposal($1,$2)',[offers[0].id,owner]);
 await assert.rejects(pg.query('select accept_proposal($1,$2)',[offers[1].id,owner]));
 assert.equal((await pg.query(`select * from proposals where status='accepted'`)).rows.length,1);
 assert.equal((await pg.query('select * from listings')).rows.length,0);
 assert.equal((await pg.query(`select * from access_requests where state='granted'`)).rows.length,1);
 await assert.rejects(pg.query('select submit_proposal($1,$2,$3)',[cid,other,JSON.stringify(payload)]));
 await assert.rejects(pg.query('select publish_case($1,$2,true)',[cid,owner]));
 const allowed=(await pg.query<{take_rate:boolean}>("select take_rate('test',1,60)")).rows[0];assert.equal(allowed.take_rate,true);
 assert.equal((await pg.query<{take_rate:boolean}>("select take_rate('test',1,60)")).rows[0].take_rate,false);
 await pg.query(`insert into jobs(case_id,kind) values($1,'organize')`,[cid]);
 await assert.rejects(pg.query(`insert into jobs(case_id,kind) values($1,'organize')`,[cid]));
 assert.equal((await pg.query('select * from claim_job()')).rows.length,1);
 assert.equal((await pg.query('select * from claim_job()')).rows.length,0);
 for(let n=0;n<30;n++)await pg.query(`insert into documents(case_id,name,path,mime,size) values($1,'test.txt',$2,'text/plain',100)`,[cid,'path'+n]);
 await assert.rejects(pg.query(`insert into documents(case_id,name,path,mime,size) values($1,'test.txt','overflow','text/plain',100)`,[cid]));
 }finally{await pg.close();}
});
