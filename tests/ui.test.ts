import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
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
