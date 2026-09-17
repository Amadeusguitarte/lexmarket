import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import Messenger from '../components/Messenger';
import {browserDB} from '../lib/browser';
test('chat opens its thread, renders a private document and offer, marks visible incoming messages read, and cleans subscriptions',async t=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='not-a-real-key';const db=browserDB()!;
 const dom=new JSDOM('<div id="root"></div>',{url:'https://lexmarket.test',pretendToBeVisual:true});
 const saved=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
 t.after(()=>{for(const [key,d] of saved){if(d)Object.defineProperty(globalThis,key,d);else delete (globalThis as any)[key];}dom.window.close();});
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='not-a-real-key';
 const channel={on(){return this;},subscribe(callback?:Function){callback?.('SUBSCRIBED');return this;}};let cleaned=0;
 t.mock.method(db,'channel',()=>channel);t.mock.method(db,'removeChannel',async()=>{cleaned++;return 'ok';});t.mock.method(db.auth,'getSession',async()=>({data:{session:{access_token:'fake'}},error:null}));
 t.mock.method(dom.window.document,'hasFocus',()=>true);
 const calls:{path:string;body:any}[]=[];let read=false;
 const message={id:'m1',created_at:'2026-09-17T12:00:00Z',sender_id:'lawyer',body:'Te comparto las observaciones',read_at:null};
 t.mock.method(globalThis,'fetch',async(input:any,init:any)=>{const path=String(input);const body=init?.body?JSON.parse(init.body):null;calls.push({path,body});let d:any;
 if(path==='/api/chats')d={items:[]};
 else if(path.endsWith('/activity')){read=!!body.read_ids?.length;d={ok:true};}
 else d={messages:[{...message,read_at:read?'2026-09-17T12:01:00Z':null},{id:'m2',sender_id:'client',body:'Archivo',attachment_id:'f1',created_at:'2026-09-17T12:00:01Z',read_at:'2026-09-17T12:01:00Z'}],files:[{id:'f1',name:'observaciones.txt',size:120}],activity:[],proposals:[{id:'p1',created_at:'2026-09-17T12:00:02Z',scope:'Revisar todos los documentos preparados',amount:100000,exclusions:'No incluye radicación',days:2,payment_terms:'Al inicio',status:'pending'}],peer:{id:'lawyer',name:'Abogada de prueba'},case:{id:'c1',title:'Caso ficticio',status:'published'},owner:true,hasMore:false};
 return new Response(JSON.stringify(d),{status:200,headers:{'Content-Type':'application/json'}});});
 const root=createRoot(dom.window.document.getElementById('root')!);t.after(async()=>{await act(async()=>root.unmount());});
 await act(async()=>{root.render(React.createElement(Messenger,{userId:'client',open:true,target:{case_id:'c1',lawyer_id:'l1'},onOpen:()=>{},onClose:()=>{},onSelect:()=>{},onCase:()=>{}}));await new Promise(r=>setTimeout(r,30));});
 assert.match(dom.window.document.body.textContent!,/Abogada de prueba/);assert.match(dom.window.document.body.textContent!,/observaciones.txt/);assert.match(dom.window.document.body.textContent!,/Revisar y elegir/);assert.match(dom.window.document.body.textContent!,/Leído/);
 assert.ok(calls.some(c=>c.body?.read_ids?.includes('m1')));
 assert.ok(!calls.some(c=>c.body?.read_ids?.includes('m2')));
 await act(async()=>root.unmount());await db.auth.stopAutoRefresh();assert.equal(cleaned,2);
});
