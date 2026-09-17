import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {isAdmin} from '../lib/server';
test('moderation queues publication, rejects stale decisions, and keeps browser approval forbidden',async()=>{
 const pg=new PGlite();try{
 await pg.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
 for(const n of ['001_initial.sql','20260917183921_moderation.sql'])await pg.exec((await readFile(new URL('../supabase/migrations/'+n,import.meta.url),'utf8')).replace('create extension if not exists pgcrypto;',''));
 const u='00000000-0000-4000-8000-000000000001',c='00000000-0000-4000-8000-000000000002';await pg.query('insert into auth.users values ($1)',[u]);await pg.query("insert into profiles(id,name,role) values($1,'Tester','client')",[u]);await pg.query("insert into cases(id,owner_id,title,category,city,service,description,public_summary) values($1,$2,'Title','Civil','Bogotá','Review','Private facts','Public summary of at least thirty characters')",[c,u]);
 await pg.query('select publish_case($1,$2,true)',[c,u]);assert.equal((await pg.query('select * from listings')).rows.length,0);assert.equal((await pg.query<{status:string}>('select status from cases')).rows[0].status,'review');
 const version=(await pg.query<{updated_at:Date}>('select updated_at from cases')).rows[0].updated_at;
 await pg.exec('set role authenticated');await assert.rejects(pg.query('select review_case($1,$2,$3,$4,$5)',[c,u,'approved','Checked all publication criteria',version]));await pg.exec('reset role');
 // Preserve PostgreSQL microseconds when passing the optimistic version.
 const v=(await pg.query<{v:string}>('select updated_at::text v from cases')).rows[0].v;
 await pg.query('select review_case($1,$2,$3,$4,$5)',[c,u,'approved','Checked all publication criteria',v]);assert.equal((await pg.query('select * from listings')).rows.length,1);
 await assert.rejects(pg.query('select review_case($1,$2,$3,$4,$5)',[c,u,'removed','Remove outdated publication from feed',v]));
 await pg.query('select publish_case($1,$2,false)',[c,u]);assert.equal((await pg.query('select * from listings')).rows.length,0);assert.equal((await pg.query('select * from audit_log')).rows.length,1);
 }finally{await pg.close();}
});
test('admin privileges use server-owned app metadata, not user metadata',()=>{
 const base={email:'test@example.com',email_confirmed_at:'2026-01-01',app_metadata:{},user_metadata:{lexmarket_admin:true}};
 assert.equal(isAdmin(base as any),false);assert.equal(isAdmin({...base,app_metadata:{lexmarket_admin:true}} as any),true);assert.equal(isAdmin({...base,email_confirmed_at:null,app_metadata:{lexmarket_admin:true}} as any),false);
});
