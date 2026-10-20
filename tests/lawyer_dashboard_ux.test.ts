import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
(globalThis as any).React = React;
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';
import {
  calculateProfileProgress,
  getFirstIncompleteStep,
  getPendingSteps,
  getLawyerProfileState,
} from '../lib/lawyer-profile';
import LawyerHomeDashboard from '../components/LawyerHomeDashboard';

test('lawyer profile progress and step calculation functions', () => {
  // Empty profile
  const p0 = { name: '', city: '' };
  assert.equal(calculateProfileProgress(p0), 0);
  assert.equal(getFirstIncompleteStep(p0), 1);
  assert.equal(getLawyerProfileState(p0), 'PROFILE_NOT_STARTED');
  const pending0 = getPendingSteps(p0);
  assert.equal(pending0.length, 6);

  // Profile with step 1 and step 2 complete
  const p2 = {
    name: 'Louis Arteaga',
    city: 'Bogotá',
    bio: 'Abogado especialista en derecho comercial y laboral.',
    experience_years: 6,
  };
  const prog2 = calculateProfileProgress(p2);
  assert.equal(prog2, 30);
  assert.equal(getFirstIncompleteStep(p2), 3);
  assert.equal(getLawyerProfileState(p2), 'PROFILE_IN_PROGRESS');
  const pending2 = getPendingSteps(p2);
  assert.equal(pending2.length, 4);
  assert.deepEqual(pending2.map(s => s.num), [3, 4, 5, 6]);

  // Profile with all 6 steps complete but verification pending
  const p6 = {
    name: 'Louis Arteaga',
    city: 'Bogotá',
    bio: 'Abogado especialista en derecho comercial y laboral con más de 10 años.',
    experience_years: 10,
    specialties: ['Derecho Civil', 'Derecho Comercial'],
    consultation_fee: 150000,
    hourly_rate: 200000,
    modality: 'both',
    lawyer_card_number: '123456',
    lawyer_card_csj: 'CSJ-123456-COL',
    verification: 'pending',
  };
  assert.equal(calculateProfileProgress(p6), 100);
  assert.equal(getLawyerProfileState(p6), 'PROFILE_SUBMITTED');

  // Verified profile
  const pVerified = {
    ...p6,
    verification: 'verified',
  };
  assert.equal(getLawyerProfileState(pVerified), 'PROFILE_VERIFIED');
});

test('LawyerHomeDashboard renders compact profile banner without full wizard in Inicio', () => {
  const html = renderToStaticMarkup(
    React.createElement(LawyerHomeDashboard, {
      lawyerName: 'Louis Arteaga',
      avatarUrl: '',
      profile: {
        name: 'Louis Arteaga',
        city: 'Bogotá',
        bio: 'Especialista en derecho civil y comercial',
      },
      cases: [
        {
          id: 'case-101',
          title: 'Incumplimiento de contrato de arrendamiento',
          category: 'civil',
          subcategory: 'Arrendamientos',
          city: 'Bogotá',
          modality: 'Remoto',
          budget: '$800.000 – $1.200.000 COP',
          urgency: 'high',
          proposalsCount: 2,
          created_at: new Date().toISOString(),
        },
      ],
      unreadMessages: 2,
    })
  );
  const doc = new JSDOM(html).window.document;

  // Header should greet lawyer warmly
  assert.match(doc.querySelector('.dashboard-greeting-title')!.textContent!, /Louis/);
  assert.match(html, /Hay oportunidades esperando por profesionales como tú/);

  // Compact banner should be present
  assert.ok(doc.querySelector('.lawyer-profile-compact-banner'));
  assert.match(html, /Completa tu perfil profesional/);
  assert.match(html, /Continuar perfil/);

  // Wizard 6-step form MUST NOT be rendered in Inicio
  assert.equal(doc.querySelector('#lawyer-wizard-card'), null);
  assert.equal(doc.querySelector('.wizard-progress-track'), null);

  // Editorial cases list should be rendered
  assert.ok(doc.querySelector('.editorial-cases-list'));
  assert.match(html, /Incumplimiento de contrato de arrendamiento/);
  assert.match(html, /Bogotá · Remoto/);

  // Proposals section & Activity timeline & MatchAsistente
  assert.ok(doc.querySelector('.proposals-section'));
  assert.ok(doc.querySelector('.lawyer-dash-aside'));
  assert.ok(doc.querySelector('.match-assistant-card'));
});

test('LawyerHomeDashboard renders verified badge when lawyer is verified', () => {
  const html = renderToStaticMarkup(
    React.createElement(LawyerHomeDashboard, {
      lawyerName: 'Dra. María Casas',
      avatarUrl: 'https://example.com/maria.jpg',
      profile: {
        name: 'Dra. María Casas',
        city: 'Medellín',
        bio: 'Especialista en derecho laboral y seguridad social',
        specialties: ['Derecho Laboral'],
        consultation_fee: 200000,
        lawyer_card_number: '987654',
        verification: 'verified',
      },
      cases: [],
    })
  );

  // Verified badge should replace the completion banner
  assert.match(html, /Perfil verificado/);
  assert.match(html, /Disponible para recibir nuevos casos/);
  assert.doesNotMatch(html, /Completa tu perfil profesional/);
});
