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
