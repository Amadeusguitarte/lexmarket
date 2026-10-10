import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
(globalThis as any).React = React;
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import Landing from '../components/Landing';
import { CaseForm, ProfileForm } from '../components/Forms';
test('landing offers natural entry points without fake testimonials or readiness gates',()=>{
 const html=renderToStaticMarkup(React.createElement(Landing,{onStart:()=>{},onLawyer:()=>{},onLogin:()=>{},onInfo:()=>{}}));
 const doc=new JSDOM(html).window.document;
 assert.ok(doc.querySelector('h1')?.textContent?.includes('siguiente paso'));
 assert.equal(doc.querySelectorAll('.example-pill').length,4);
 assert.equal(doc.querySelectorAll('.faq details').length,5);
 assert.match(html,/Compartir mi caso/);assert.doesNotMatch(html,/casos con contexto/i);
 assert.ok(doc.querySelector('a[href="#como-funciona"]'));
});
test('case form accepts notes without requiring attachments and keeps private/public fields separate',()=>{
 const html=renderToStaticMarkup(React.createElement(CaseForm,{busy:false,onSave:()=>{}}));
 const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelector('input[type=file]'),null);
 assert.ok(doc.querySelector('textarea[name=description][required]'));
 assert.equal(doc.querySelector('textarea[name=public_summary]'),null);
 assert.equal(doc.querySelectorAll('label.field').length,6);
});
test('lawyer onboarding requests license and specialties but offers no self-verification',()=>{
 const doc=new JSDOM(renderToStaticMarkup(React.createElement(ProfileForm,{role:'lawyer',busy:false,onSave:()=>{}}))).window.document;
 assert.ok(doc.querySelector('input[name=license][required]'));
 assert.ok(doc.querySelector('input[name=specialties]'));
 assert.equal(doc.querySelector('[name=verification]'),null);
});
test('signed-in welcome renders DashboardSkeleton during initial load to prevent flicker',async()=>{
 const {default:Workspace}=await import('../components/Workspace');
 const html=renderToStaticMarkup(React.createElement(Workspace,{me:{profile:{id:'test',name:'Louis Amadeus',role:'client',avatar_url:'https://lh3.googleusercontent.com/a/example'}},session:{user:{id:'test',user_metadata:{}}} as any,busy:false,run:async f=>{await f();},onNotice:()=>{},onInfo:()=>{},onRefreshMe:async()=>{},onLogout:()=>{}}));
 const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelector('.adaptive-state-bar'),null);
 assert.ok(doc.querySelector('.dashboard-skeleton-root'));
 assert.equal(doc.querySelector('.empty-welcome-hero-card'),null); // MUST NOT flash empty card while loading
 assert.ok(doc.querySelector('.account img[src="https://lh3.googleusercontent.com/a/example"]'));
 assert.ok(doc.querySelector('.chat-launcher'));
 assert.equal(doc.querySelector('.stat-grid'),null);
});

test('ClientAdaptiveDashboard renders State C when loaded and user has no cases',async()=>{
 const {default:ClientAdaptiveDashboard}=await import('../components/ClientAdaptiveDashboard');
 const html=renderToStaticMarkup(React.createElement(ClientAdaptiveDashboard,{
   loading:false,
   user:{id:'test',name:'Louis Amadeus'},
   items:[],
   draftCase:null,
   onOpenCase:()=>{},
   onContinueDraft:()=>{},
   onCreateCase:()=>{},
   onNavigate:()=>{}
 }));
 const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelector('.adaptive-state-bar'),null);
 assert.match(doc.querySelector('.empty-hero-headline')!.textContent!,/Todo empieza con tu situación/);
 assert.ok(doc.querySelector('img[src="/intake-situation-desk.webp"]'));
});

test('ClientAdaptiveDashboard automatically recognizes draft state without switcher bar',async()=>{
 const {default:ClientAdaptiveDashboard}=await import('../components/ClientAdaptiveDashboard');
 const html=renderToStaticMarkup(React.createElement(ClientAdaptiveDashboard,{
   user:{id:'test',name:'Louis Amadeus'},
   items:[],
   draftCase:{title:'Incumplimiento de contrato de arrendamiento',category:'Civil y contractual',city:'Bogotá'},
   onOpenCase:()=>{},
   onContinueDraft:()=>{},
   onCreateCase:()=>{},
   onNavigate:()=>{}
 }));
 const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelector('.adaptive-state-bar'),null);
 assert.match(doc.querySelector('.editorial-greeting')!.textContent!,/Buenos días, Louis/);
 assert.ok(doc.querySelector('.card-draft-theme'));
 assert.match(doc.querySelector('.hero-case-title')!.textContent!,/Incumplimiento de contrato/);
 assert.ok(doc.querySelector('.fill-burgundy'));
 assert.equal(doc.querySelectorAll('.metric-box-card').length,4);
});

test('ClientAdaptiveDashboard automatically recognizes published and engaged states',async()=>{
 const {default:ClientAdaptiveDashboard}=await import('../components/ClientAdaptiveDashboard');
 // Published case
 const pubHtml=renderToStaticMarkup(React.createElement(ClientAdaptiveDashboard,{
   user:{id:'test',name:'Louis Amadeus'},
   items:[{id:'pub-1',status:'published',title:'Caso laboral publicado',category:'Laboral',city:'Medellín'} as any],
   onOpenCase:()=>{},
   onContinueDraft:()=>{},
   onCreateCase:()=>{},
   onNavigate:()=>{}
 }));
 const pubDoc=new JSDOM(pubHtml).window.document;
 assert.equal(pubDoc.querySelector('.adaptive-state-bar'),null);
 assert.ok(pubDoc.querySelector('.card-published-theme'));
 assert.match(pubDoc.querySelector('.hero-case-title')!.textContent!,/Caso laboral publicado/);

 // Engaged case
 const engHtml=renderToStaticMarkup(React.createElement(ClientAdaptiveDashboard,{
   user:{id:'test',name:'Louis Amadeus'},
   items:[{id:'eng-1',status:'engaged',title:'Caso en acompañamiento',category:'Civil',city:'Bogotá'} as any],
   onOpenCase:()=>{},
   onContinueDraft:()=>{},
   onCreateCase:()=>{},
   onNavigate:()=>{}
 }));
 const engDoc=new JSDOM(engHtml).window.document;
 assert.equal(engDoc.querySelector('.adaptive-state-bar'),null);
 assert.ok(engDoc.querySelector('.card-advising-theme'));
 assert.match(engDoc.querySelector('.hero-case-title')!.textContent!,/Caso en acompañamiento/);
});

test('profile view allows changing photo or leaving anonymous without hardcoded google phrase',async()=>{
 const {default:Workspace}=await import('../components/Workspace');
 const html=renderToStaticMarkup(React.createElement(Workspace,{initialView:'profile',me:{profile:{id:'test',name:'Carlos Lopez',role:'client',avatar_url:'https://lh3.googleusercontent.com/a/example'}},session:{user:{id:'test',user_metadata:{avatar_url:'https://lh3.googleusercontent.com/a/example'}}} as any,busy:false,run:async f=>{await f();},onNotice:()=>{},onInfo:()=>{},onRefreshMe:async()=>{},onLogout:()=>{}}));
 assert.equal(html.includes('Tu foto de Google te acompaña en MatchJurídico.'),false);
 assert.ok(html.includes('Foto de perfil'));
 assert.ok(html.includes('Subir foto'));
 assert.ok(html.includes('Dejar anónimo'));
});

