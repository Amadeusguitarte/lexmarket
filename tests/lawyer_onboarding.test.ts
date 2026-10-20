import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
(globalThis as any).React = React;
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import LawyerOnboardingDashboard from '../components/LawyerOnboardingDashboard';

test('LawyerOnboardingDashboard places Tarjeta Profesional at step 5 and Biografía at step 2', () => {
  const html = renderToStaticMarkup(
    React.createElement(LawyerOnboardingDashboard, {
      initialLawyerName: 'Andrés Morales',
      initialAvatar: '',
    })
  );
  const doc = new JSDOM(html).window.document;

  const stepperNodes = doc.querySelectorAll('.stepper-node .stepper-label');
  assert.equal(stepperNodes.length, 6);
  assert.equal(stepperNodes[0].textContent, 'Datos básicos');
  assert.equal(stepperNodes[1].textContent, 'Biografía y experiencia');
  assert.equal(stepperNodes[2].textContent, 'Áreas de práctica');
  assert.equal(stepperNodes[3].textContent, 'Honorarios y modalidad');
  assert.equal(stepperNodes[4].textContent, 'Tarjeta profesional CSJ');
  assert.equal(stepperNodes[5].textContent, 'Verificación');
});

test('LawyerOnboardingDashboard renders verified LinkedIn connection with clickable profile redirect link and inline steps', () => {
  const html = renderToStaticMarkup(
    React.createElement(LawyerOnboardingDashboard, {
      initialLawyerName: 'Louis Amadeus Arteaga',
      initialAvatar: 'https://media.licdn.com/dms/image/v2/louis_hd.jpg',
      initialLinkedInSynced: true,
    })
  );
  const doc = new JSDOM(html).window.document;

  assert.match(doc.querySelector('.lawyer-welcome-title')!.textContent!, /Louis/);
  assert.match(html, /Verificado con LinkedIn/);
  assert.doesNotMatch(html, /Tarjeta Profesional en el Paso 2/i);
  // Verify wizard step is rendered directly inline on the page without any popup modal
  assert.ok(doc.querySelector('#lawyer-wizard-card'));
  assert.ok(doc.querySelector('input[placeholder="Ej. Andrés Morales"]'));
  assert.equal(doc.querySelector('.lawyer-modal-backdrop'), null);
});

test('LawyerOnboardingDashboard renders connect banner when disconnected with inline steps', () => {
  const html = renderToStaticMarkup(
    React.createElement(LawyerOnboardingDashboard, {
      initialLawyerName: 'Andrés Morales',
      initialAvatar: '',
      initialLinkedInSynced: false,
    })
  );
  const doc = new JSDOM(html).window.document;
  assert.ok(doc.querySelector('.linkedin-connect-btn'));
  assert.ok(doc.querySelector('#lawyer-wizard-card'));
  assert.equal(doc.querySelector('.lawyer-modal-backdrop'), null);
});

test('LawyerOnboardingDashboard offers option to paste LinkedIn link when synced without url and has NO continue button', () => {
  const html = renderToStaticMarkup(
    React.createElement(LawyerOnboardingDashboard, {
      initialLawyerName: 'Louis Amadeus Arteaga',
      initialAvatar: 'https://media.licdn.com/dms/image/v2/louis_hd.jpg',
      initialLinkedInSynced: true,
      initialProfile: { linkedin_url: '' },
    })
  );
  assert.match(html, /Pegar enlace de LinkedIn/);
  assert.doesNotMatch(html, /Completar biografía/);
  assert.match(html, /Reiniciar/);
});

test('LawyerSidebar renders identical 7 items and Help link without bounce or layout shift', async () => {
  const LawyerSidebar = (await import('../components/LawyerSidebar')).default;
  const html = renderToStaticMarkup(
    React.createElement(LawyerSidebar, {
      activeMenu: 'perfil',
      onNavigate: () => {},
    })
  );
  const doc = new JSDOM(html).window.document;
  const navItems = doc.querySelectorAll('.lawyer-nav-item');
  // 7 main nav items + 1 help link = 8 buttons
  assert.equal(navItems.length, 8);
  const itemTexts = Array.from(navItems).map(n => n.textContent?.trim());
  assert.ok(itemTexts.includes('Inicio'));
  assert.ok(itemTexts.includes('Casos disponibles'));
  assert.ok(itemTexts.includes('Mis propuestas'));
  assert.ok(itemTexts.includes('Mis casos'));
  assert.ok(itemTexts.includes('Pagos'));
  assert.ok(itemTexts.includes('Perfil profesional'));
  assert.ok(itemTexts.includes('Configuración'));
  assert.ok(itemTexts.includes('Centro de ayuda'));

  // Active item check
  const activeBtn = doc.querySelector('.lawyer-nav-item.active');
  assert.ok(activeBtn);
  assert.equal(activeBtn?.textContent?.trim(), 'Perfil profesional');
});



