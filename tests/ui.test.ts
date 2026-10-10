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

test('ClientAdaptiveDashboard renders Option 1 (Usuario nuevo sin casos)',async()=>{
 const {default:ClientAdaptiveDashboard}=await import('../components/ClientAdaptiveDashboard');
 const html=renderToStaticMarkup(React.createElement(ClientAdaptiveDashboard,{
   loading:false,
   user:{id:'test',name:'Louis Arteaga'},
   items:[],
   draftCase:null,
   onOpenCase:()=>{},
   onContinueDraft:()=>{},
   onCreateCase:()=>{},
   onNavigate:()=>{}
 }));
 const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelector('.adaptive-state-bar'),null);
 assert.match(doc.querySelector('.hero-headline')!.textContent!,/¿En qué podemos ayudarte hoy\?/);
 assert.match(doc.querySelector('.status-box-headline')!.textContent!,/Todavía no has publicado tu caso/);
 assert.match(doc.querySelector('.status-empty-box .button-burgundy')!.textContent!,/Empezar mi caso/);
 assert.ok(doc.querySelector('.empty-activity-box'));
 assert.match(doc.querySelector('.section-title')!.textContent!,/Abogados destacados/);
 assert.ok(doc.querySelector('.match-assistant-card'));
 assert.ok(doc.querySelector('.legal-resources-section'));
});

test('ClientAdaptiveDashboard renders Option 2 (Borrador en progreso) with 5-step stepper',async()=>{
 const {default:ClientAdaptiveDashboard}=await import('../components/ClientAdaptiveDashboard');
 const html=renderToStaticMarkup(React.createElement(ClientAdaptiveDashboard,{
   user:{id:'test',name:'Louis Arteaga'},
   items:[],
   draftCase:{title:'Incumplimiento de contrato de arrendamiento',category:'Arrendamientos',city:'Bogotá',summary:'Detalle de la situación'},
   onOpenCase:()=>{},
   onContinueDraft:()=>{},
   onCreateCase:()=>{},
   onNavigate:()=>{}
 }));
 const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelector('.adaptive-state-bar'),null);
 assert.ok(doc.querySelector('.status-draft-stepper-box'));
 assert.match(doc.querySelector('.status-badge-inline')!.textContent!,/Tienes un borrador en progreso/);
 assert.ok(doc.querySelector('.horizontal-stepper-track'));
 assert.equal(doc.querySelectorAll('.horizontal-stepper-track .stepper-step').length,5);
 assert.match(doc.querySelector('.button-burgundy')!.textContent!,/Continuar mi caso/);
 assert.match(doc.querySelector('.section-title')!.textContent!,/Abogados recomendados para tu caso/);
});

test('ClientAdaptiveDashboard renders Option 3 (Caso publicado recibiendo propuestas)',async()=>{
 const {default:ClientAdaptiveDashboard}=await import('../components/ClientAdaptiveDashboard');
 const html=renderToStaticMarkup(React.createElement(ClientAdaptiveDashboard,{
   user:{id:'test',name:'Louis Arteaga'},
   items:[{id:'pub-1',status:'published',title:'Incumplimiento de contrato de arrendamiento',category:'Arrendamientos',city:'Bogotá'} as any],
   onOpenCase:()=>{},
   onContinueDraft:()=>{},
   onCreateCase:()=>{},
   onNavigate:()=>{}
 }));
 const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelector('.adaptive-state-bar'),null);
 assert.ok(doc.querySelector('.status-published-stepper-box'));
 assert.match(doc.querySelector('.status-pill-green')!.textContent!,/Publicado/);
 assert.ok(doc.querySelector('.stepper-dot-badge'));
 assert.equal(doc.querySelector('.stepper-dot-badge')!.textContent!,'3');
 assert.match(doc.querySelector('.status-published-stepper-box .button-burgundy')!.textContent!,/Ver mi caso/);
 assert.ok(doc.querySelector('.lawyer-actions-btns'));
});

test('ClientAdaptiveDashboard renders Option 4 (Caso en curso con abogado elegido)',async()=>{
 const {default:ClientAdaptiveDashboard}=await import('../components/ClientAdaptiveDashboard');
 const html=renderToStaticMarkup(React.createElement(ClientAdaptiveDashboard,{
   user:{id:'test',name:'Louis Arteaga'},
   items:[{id:'eng-1',status:'engaged',title:'Incumplimiento de contrato de arrendamiento',category:'Arrendamientos',city:'Bogotá'} as any],
   onOpenCase:()=>{},
   onContinueDraft:()=>{},
   onCreateCase:()=>{},
   onNavigate:()=>{}
 }));
 const doc=new JSDOM(html).window.document;
 assert.equal(doc.querySelector('.adaptive-state-bar'),null);
 assert.ok(doc.querySelector('.in-progress-full-card'));
 assert.match(doc.querySelector('.status-case-name')!.textContent!,/Incumplimiento de contrato/);
 assert.match(doc.querySelector('.status-assigned-sub')!.textContent!,/Abogado asignado: Andrea Gómez/);
 assert.ok(doc.querySelector('.in-progress-details-grid'));
 assert.ok(doc.querySelector('.lawyer-assigned-panel'));
 assert.ok(doc.querySelector('.pill-en-curso'));
 assert.ok(doc.querySelector('.next-steps-panel'));
 assert.ok(doc.querySelector('.case-documents-panel'));
});

test('profile view allows changing photo or leaving anonymous without hardcoded google phrase',async()=>{
 const {default:Workspace}=await import('../components/Workspace');
 const html=renderToStaticMarkup(React.createElement(Workspace,{initialView:'profile',me:{profile:{id:'test',name:'Carlos Lopez',role:'client',avatar_url:'https://lh3.googleusercontent.com/a/example'}},session:{user:{id:'test',user_metadata:{avatar_url:'https://lh3.googleusercontent.com/a/example'}}} as any,busy:false,run:async f=>{await f();},onNotice:()=>{},onInfo:()=>{},onRefreshMe:async()=>{},onLogout:()=>{}}));
 assert.equal(html.includes('Tu foto de Google te acompaña en MatchJurídico.'),false);
 assert.ok(html.includes('Foto de perfil'));
 assert.ok(html.includes('Subir foto'));
 assert.ok(html.includes('Dejar anónimo'));
});

