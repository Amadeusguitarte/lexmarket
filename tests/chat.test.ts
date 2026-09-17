import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {safeAvatar} from '../lib/avatar';
test('chat reads stay between the two participants; revocation closes realtime and browser writes remain forbidden',async()=>{
 const pg=new PGlite();try{
 await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 for(const n of ['001_initial.sql','002_proposals.sql','003_file_limit.sql','20260917181319_chat_and_welcome.sql']){let s=await readFile(new URL('../supabase/migrations/'+n,import.meta.url),'utf8');s=s.replace('create extension if not exists pgcrypto;','').replace('alter publication supabase_realtime add table public.messages,public.chat_activity,public.proposals;','');await pg.exec(s);}
 const owner='00000000-0000-4000-8000-000000000001',lawyer='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003',cid='00000000-0000-4000-8000-000000000004';
 await pg.query('insert into auth.users values ($1),($2),($3)',[owner,lawyer,other]);
 await pg.query(`insert into profiles(id,name,role,verification) values($1,'Client','client','pending'),($2,'Lawyer','lawyer','verified'),($3,'Other','lawyer','verified')`,[owner,lawyer,other]);
 await pg.query(`insert into cases(id,owner_id,title,category,city,service,description,public_summary,status) values($1,$2,'A case','Civil','Bogotá','Review','Private facts','Public summary without identities','published')`,[cid,owner]);
 await pg.query(`insert into access_requests(case_id,lawyer_id,state,note) values($1,$2,'granted','Allowed'),($1,$3,'granted','Allowed other thread')`,[cid,lawyer,other]);
 await pg.query(`insert into messages(case_id,lawyer_id,sender_id,body) values($1,$2,$3,'Only one lawyer sees this')`,[cid,lawyer,owner]);
 const offer={scope:'Complete review of the documents provided',exclusions:'No litigation',amount:200000,days:5,payment_terms:'At start'};
 await pg.query('select submit_proposal($1,$2,$3)',[cid,lawyer,JSON.stringify(offer)]);const first=(await pg.query<{id:string}>('select id from proposals')).rows[0].id;
 await pg.query('select submit_proposal($1,$2,$3)',[cid,lawyer,JSON.stringify({...offer,amount:180000})]);
 assert.equal((await pg.query("select id from proposals where status='pending'")).rows.length,1);
 await assert.rejects(pg.query('select accept_proposal($1,$2)',[first,owner]));
 for(const [id,count] of [[owner,1],[lawyer,1],[other,0]] as const){await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await pg.exec('set role authenticated');assert.equal((await pg.query('select * from messages')).rows.length,count);await assert.rejects(pg.exec("update messages set read_at=now()"));await assert.rejects(pg.query('select * from chat_attachments'));await pg.exec('reset role');}
 await pg.query(`update access_requests set state='revoked' where lawyer_id=$1`,[lawyer]);await pg.query("select set_config('request.jwt.claim.sub',$1,false)",[lawyer]);await pg.exec('set role authenticated');assert.equal((await pg.query('select * from messages')).rows.length,0);await pg.exec('reset role');
 await pg.query(`update access_requests set state='granted' where lawyer_id=$1`,[lawyer]);await pg.query(`update profiles set verification='rejected' where id=$1`,[lawyer]);await pg.exec('set role authenticated');assert.equal((await pg.query('select * from messages')).rows.length,0);
 }finally{await pg.close();}
});
test('profile images only accept secure Google image URLs',()=>{assert.equal(safeAvatar('javascript:alert(1)'),null);assert.equal(safeAvatar('https://evil.test/picture'),null);assert.equal(safeAvatar('https://lh3.googleusercontent.com/a/photo'),'https://lh3.googleusercontent.com/a/photo');});
