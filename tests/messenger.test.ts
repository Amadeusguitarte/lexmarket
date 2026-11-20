import test from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
(globalThis as any).React = React;
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import Messenger from '../components/Messenger';
import {browserDB} from '../lib/browser';
test('chat opens its thread, renders a private document and offer, marks visible incoming messages read, and cleans subscriptions',async t=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='not-a-real-key';const db=browserDB()!;
 const dom=new JSDOM('<div id="root"></div>',{url:'https://lexmarket.test',pretendToBeVisual:true});
 const saved=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Event:dom.window.Event,sessionStorage:dom.window.sessionStorage,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
 t.after(()=>{for(const [key,d] of saved){if(d)Object.defineProperty(globalThis,key,d);else delete (globalThis as any)[key];}dom.window.close();});
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='not-a-real-key';
 const channel={on(){return this;},subscribe(callback?:Function){callback?.('SUBSCRIBED');return this;}};let cleaned=0;
 t.mock.method(db,'channel',()=>channel);t.mock.method(db,'removeChannel',async()=>{cleaned++;return 'ok';});t.mock.method(db.auth,'getSession',async()=>({data:{session:{access_token:'fake'}},error:null}));
 t.mock.method(dom.window.document,'hasFocus',()=>true);
 const calls:{path:string;body:any}[]=[];let read=false;let releaseSend:(()=>void)|undefined;
 const message={id:'m1',created_at:'2026-09-17T12:00:00Z',sender_id:'lawyer',body:'Te comparto las observaciones',read_at:null};
 t.mock.method(globalThis,'fetch',async(input:any,init:any)=>{const path=String(input);const body=init?.body?JSON.parse(init.body):null;calls.push({path,body});let d:any;
 if(path.endsWith('/messages')){await new Promise<void>(resolve=>{releaseSend=resolve;});d={id:body.id};}
 else if(path==='/api/chats')d={items:[]};
 else if(path.endsWith('/activity')){read=!!body.read_ids?.length;d={ok:true};}
 else d={messages:[{...message,read_at:read?'2026-09-17T12:01:00Z':null},{id:'m2',sender_id:'client',body:'Archivo',attachment_id:'f1',created_at:'2026-09-17T12:00:01Z',read_at:'2026-09-17T12:01:00Z'}],files:[{id:'f1',name:'observaciones.txt',size:120}],activity:[],proposals:[{id:'p1',created_at:'2026-09-17T12:00:02Z',scope:'Revisar todos los documentos preparados',amount:100000,exclusions:'No incluye radicación',days:2,payment_terms:'Al inicio',status:'pending'}],peer:{id:'lawyer',name:'Abogada de prueba'},case:{id:'c1',title:'Caso ficticio',status:'published'},owner:true,hasMore:false};
 return new Response(JSON.stringify(d),{status:200,headers:{'Content-Type':'application/json'}});});
 const root=createRoot(dom.window.document.getElementById('root')!);t.after(async()=>{await act(async()=>root.unmount());});
 await act(async()=>{root.render(React.createElement(Messenger,{userId:'client',open:true,target:{case_id:'c1',lawyer_id:'l1'},onOpen:()=>{},onClose:()=>{},onSelect:()=>{},onCase:()=>{}}));await new Promise(r=>setTimeout(r,30));});
 assert.match(dom.window.document.body.textContent!,/Abogada de prueba/);assert.match(dom.window.document.body.textContent!,/observaciones.txt/);assert.match(dom.window.document.body.textContent!,/Revisar y elegir/);assert.match(dom.window.document.body.textContent!,/Leído/);
 assert.ok(calls.some(c=>c.body?.read_ids?.includes('m1')));
 assert.ok(!calls.some(c=>c.body?.read_ids?.includes('m2')));
 // Invoke the rendered textarea's React handler to control component input in jsdom.
 const input=dom.window.document.querySelector('textarea')!;
 const propsKey=Object.keys(input).find(k=>k.startsWith('__reactProps$'))!;
 await act(async()=>{(input as any)[propsKey].onChange({target:{value:'Mensaje inmediato de prueba'}});});
 const form=dom.window.document.querySelector('.chat-composer')!;
 await act(async()=>{form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});
 assert.match(dom.window.document.body.textContent!,/Mensaje inmediato de prueba/);
 assert.match(dom.window.document.body.textContent!,/Enviando…/);
 assert.equal((input as HTMLTextAreaElement).value,'');
 assert.ok(releaseSend,'network request is still pending while bubble is visible');
 await act(async()=>{releaseSend!();await new Promise(r=>setTimeout(r,20));});
 assert.match(dom.window.document.body.textContent!,/Enviado/);
 await act(async()=>{(dom.window.document.querySelector('.dock-title') as HTMLButtonElement).click();});
 assert.ok(dom.window.document.querySelector('.dock-window.is-minimized'));
 await act(async()=>{(dom.window.document.querySelector('.dock-title') as HTMLButtonElement).click();});
 assert.equal(dom.window.document.querySelector('.dock-window.is-minimized'),null);
 assert.match(dom.window.document.body.textContent!,/observaciones.txt/);
 await act(async()=>{root.render(React.createElement(Messenger,{mode:'page',userId:'client',open:true,target:null,onOpen:()=>{},onClose:()=>{},onSelect:()=>{},onCase:()=>{}}));});
 assert.ok(dom.window.document.querySelector('.messages-page'));assert.equal(dom.window.document.querySelector('.chat-launcher'),null);
 await act(async()=>root.unmount());await db.auth.stopAutoRefresh();assert.equal(cleaned,3);
});

test('clicking an inbox message seeded without last.id does not crash or duplicate when server messages load',async t=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='not-a-real-key';const db=browserDB()!;
 const dom=new JSDOM('<div id="root"></div>',{url:'https://lexmarket.test',pretendToBeVisual:true});
 const saved=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Event:dom.window.Event,sessionStorage:dom.window.sessionStorage,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
 t.after(()=>{for(const [key,d] of saved){if(d)Object.defineProperty(globalThis,key,d);else delete (globalThis as any)[key];}dom.window.close();});
 const channel={on(){return this;},subscribe(callback?:Function){callback?.('SUBSCRIBED');return this;}};
 t.mock.method(db,'channel',()=>channel);t.mock.method(db,'removeChannel',async()=>'ok');t.mock.method(db.auth,'getSession',async()=>({data:{session:{access_token:'fake'}},error:null}));
 t.mock.method(dom.window.document,'hasFocus',()=>true);
 const activityBodies:any[]=[];
 const sharedTs='2026-09-17T12:00:00Z';
 t.mock.method(globalThis,'fetch',async(input:any,init:any)=>{
  const path=String(input);const body=init?.body?JSON.parse(init.body):null;
  if(path==='/api/chats'){
   return new Response(JSON.stringify({items:[{case_id:'c2',lawyer_id:'l2',title:'Caso laboral',status:'published',peer:{id:'l2',name:'Dra. Elena',avatar_url:null},last:{body:'Hola, revisé tu caso',created_at:sharedTs,sender_id:'l2'},unread:1}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(path.endsWith('/activity')){activityBodies.push(body);return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});}
  return new Response(JSON.stringify({messages:[{id:'00000000-0000-4000-8000-000000000099',body:'Hola, revisé tu caso',created_at:sharedTs,sender_id:'l2',read_at:null}],files:[],activity:[],proposals:[],peer:{id:'l2',name:'Dra. Elena',avatar_url:null},case:{id:'c2',title:'Caso laboral',status:'published'},owner:true,hasMore:false,access_state:'granted'}),{status:200,headers:{'Content-Type':'application/json'}});
 });
 const root=createRoot(dom.window.document.getElementById('root')!);t.after(async()=>{await act(async()=>root.unmount());});
 await act(async()=>{root.render(React.createElement(Messenger,{userId:'client-seed',open:true,target:null,onOpen:()=>{},onClose:()=>{},onSelect:()=>{},onCase:()=>{}}));await new Promise(r=>setTimeout(r,30));});
 const row=dom.window.document.querySelector('.inbox-row') as HTMLButtonElement;
 assert.ok(row,'inbox row renders');
 await act(async()=>{row.click();await new Promise(r=>setTimeout(r,40));});
 const bubbles=dom.window.document.querySelectorAll('.chat-bubble');
 assert.equal(bubbles.length,1,'seed message is replaced rather than duplicated');
 assert.match(bubbles[0].textContent!,/Hola, revisé tu caso/);
 assert.ok(!activityBodies.some(b=>b?.read_ids?.includes('last-seed')),'never sends synthetic seed id to /activity');
 assert.ok(activityBodies.some(b=>b?.read_ids?.includes('00000000-0000-4000-8000-000000000099')),'marks real message id read');
 await act(async()=>root.unmount());await db.auth.stopAutoRefresh();
});

test('PDF attachment previews in composer before sending and supports voice/video call triggers',async t=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='not-a-real-key';const db=browserDB()!;
 const dom=new JSDOM('<div id="root"></div>',{url:'https://lexmarket.test',pretendToBeVisual:true});
 const saved=new Map<string,PropertyDescriptor|undefined>();
 for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Event:dom.window.Event,sessionStorage:dom.window.sessionStorage,IS_REACT_ACT_ENVIRONMENT:true})){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
 const origCreateUrl=URL.createObjectURL,origRevokeUrl=URL.revokeObjectURL;
 (URL as any).createObjectURL=()=>'blob:https://lexmarket.test/pdf-preview-1';
 (URL as any).revokeObjectURL=()=>{};
 t.after(()=>{
  (URL as any).createObjectURL=origCreateUrl;(URL as any).revokeObjectURL=origRevokeUrl;
  for(const [key,d] of saved){if(d)Object.defineProperty(globalThis,key,d);else delete (globalThis as any)[key];}
  dom.window.close();
 });
 const broadcastHandlers=new Map<string,Function>();
 const makeChannel=(name:string)=>({
  on(_type:string,filter:any,cb:Function){if(filter?.event)broadcastHandlers.set(name+':'+filter.event,cb);return this;},
  subscribe(callback?:Function){callback?.('SUBSCRIBED');return this;},
  send:async()=>'ok',
  unsubscribe:async()=>'ok',
 });
 t.mock.method(db,'channel',(name:string)=>makeChannel(name));
 t.mock.method(db,'removeChannel',async()=>'ok');
 t.mock.method(db.auth,'getSession',async()=>({data:{session:{access_token:'fake'}},error:null}));
 t.mock.method(dom.window.document,'hasFocus',()=>true);
 let uploadedFiles=0;
 t.mock.method(globalThis,'fetch',async(input:any)=>{
  const path=String(input);
  if(path==='/api/chats'){
   return new Response(JSON.stringify({self_call_channel:'call-u-self',items:[{case_id:'c3',lawyer_id:'l3',title:'Contrato laboral',status:'published',peer:{id:'l3',name:'Dr. Mateo',avatar_url:null},peer_call_channel:'call-u-peer',last:null,unread:0}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(path.endsWith('/files')){uploadedFiles++;return new Response(JSON.stringify({id:'f-pdf'}),{status:201,headers:{'Content-Type':'application/json'}});}
  if(path.endsWith('/activity'))return new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}});
  return new Response(JSON.stringify({messages:[],files:[],activity:[],proposals:[],peer:{id:'l3',name:'Dr. Mateo',avatar_url:null},peer_call_channel:'call-u-peer',self_call_channel:'call-u-self',case:{id:'c3',title:'Contrato laboral',status:'published'},owner:true,hasMore:false,access_state:'granted'}),{status:200,headers:{'Content-Type':'application/json'}});
 });
 const root=createRoot(dom.window.document.getElementById('root')!);t.after(async()=>{await act(async()=>root.unmount());});
 await act(async()=>{root.render(React.createElement(Messenger,{userId:'client-pdf',userName:'Ana',open:true,target:{case_id:'c3',lawyer_id:'l3'},onOpen:()=>{},onClose:()=>{},onSelect:()=>{},onCase:()=>{}}));await new Promise(r=>setTimeout(r,30));});
 const fileInput=dom.window.document.querySelector('input[type="file"]') as HTMLInputElement;
 const filePropsKey=Object.keys(fileInput).find(k=>k.startsWith('__reactProps$'))!;
 const pdfFile=new dom.window.File(['%PDF-1.7 test'],'demanda.pdf',{type:'application/pdf'});
 await act(async()=>{(fileInput as any)[filePropsKey].onChange({target:{files:[pdfFile]}});});
 assert.equal(uploadedFiles,0,'PDF is staged for preview before uploading');
 assert.ok(dom.window.document.querySelector('.chat-staged-file'),'staging tray renders');
 const iframe=dom.window.document.querySelector('.chat-staged-pdf-frame') as HTMLIFrameElement;
 assert.ok(iframe&&iframe.src.startsWith('blob:https://lexmarket.test/pdf-preview-1'),'inline PDF iframe renders');
 await act(async()=>{(dom.window.document.querySelector('.chat-staged-action') as HTMLButtonElement).click();});
 assert.ok(dom.window.document.querySelector('.pdf-preview-modal'),'fullscreen PDF preview modal opens');
 await act(async()=>{(dom.window.document.querySelector('[aria-label="Cerrar vista previa"]') as HTMLButtonElement).click();});
 assert.equal(dom.window.document.querySelector('.pdf-preview-modal'),null);
 const form=dom.window.document.querySelector('.chat-composer')!;
 await act(async()=>{form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,30));});
 assert.equal(uploadedFiles,1,'PDF uploads when user clicks send');
 assert.equal(dom.window.document.querySelector('.chat-staged-file'),null,'staging tray clears after send');
 // Incoming call banner via broadcast
 const inviteHandler=broadcastHandlers.get('call-u-self:call-invite');
 assert.ok(inviteHandler,'subscribed to self call channel');
 await act(async()=>{inviteHandler!({payload:{type:'call-invite',callId:'call-1',caseId:'c3',lawyerId:'l3',kind:'video',from:'l3',fromName:'Dr. Mateo',caseTitle:'Contrato laboral'}});});
 assert.ok(dom.window.document.querySelector('.incoming-call-banner'),'incoming call banner renders');
 await act(async()=>{(dom.window.document.querySelector('.call-btn.reject') as HTMLButtonElement).click();});
 assert.equal(dom.window.document.querySelector('.incoming-call-banner'),null,'incoming banner closes on reject');
 // Outgoing video call button
 await act(async()=>{(dom.window.document.querySelector('[aria-label="Iniciar videollamada"]') as HTMLButtonElement).click();});
 assert.ok(dom.window.document.querySelector('.call-overlay'),'call overlay opens on video call click');
 await act(async()=>{(dom.window.document.querySelector('[aria-label="Colgar llamada"]') as HTMLButtonElement).click();});
 assert.equal(dom.window.document.querySelector('.call-overlay'),null,'call overlay closes on hangup');
 await act(async()=>root.unmount());await db.auth.stopAutoRefresh();
});
