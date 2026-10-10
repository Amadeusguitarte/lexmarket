import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
(globalThis as any).React = React;
import { renderToStaticMarkup } from 'react-dom/server';
import { JSDOM } from 'jsdom';

import {
  analyzeNarrativeHeuristically,
  INTAKE_CATEGORIES,
  GLOBAL_QUESTIONS,
  CATEGORY_QUESTION_SETS,
  mapToSystemCategory
} from '../lib/intake-engine';

import WelcomeStep from '../components/intake/WelcomeStep';
import NarrativeStep from '../components/intake/NarrativeStep';
import SummaryReviewStep from '../components/intake/SummaryReviewStep';
import DynamicQuestionsStep from '../components/intake/DynamicQuestionsStep';
import DocumentsStep from '../components/intake/DocumentsStep';
import PrivatePartiesStep from '../components/intake/PrivatePartiesStep';
import PublishReviewStep from '../components/intake/PublishReviewStep';
import SuccessStep from '../components/intake/SuccessStep';
import CasePermissionsManager from '../components/intake/CasePermissionsManager';
import AccessRequestModal from '../components/intake/AccessRequestModal';
import IntakeProgress from '../components/intake/IntakeProgress';
import MicActivationModal from '../components/intake/MicActivationModal';
import PublishAuthModal from '../components/intake/PublishAuthModal';

// 1. Engine & NLP Heuristics Tests
test('NLP engine correctly categorizes a labor case', () => {
  const narrative = 'Mi empleador me despidió la semana pasada en Bogotá después de una incapacidad médica. No me han pagado la liquidación ni las cesantías.';
  const facts = analyzeNarrativeHeuristically(narrative);

  assert.equal(facts.suggestedCategory, 'laboral');
  assert.equal(facts.detectedCity, 'Bogotá');
  assert.ok(facts.importantDates.length > 0);
  assert.ok(facts.summary.length > 20);
  assert.equal(mapToSystemCategory('laboral'), 'Laboral');
});

test('NLP engine correctly categorizes a family law case', () => {
  const narrative = 'Quiero divorciarme de mi cónyuge y fijar la cuota de alimentos y custodia para nuestro hijo menor de edad en Medellín.';
  const facts = analyzeNarrativeHeuristically(narrative);

  assert.equal(facts.suggestedCategory, 'familia');
  assert.equal(facts.detectedCity, 'Medellín');
  assert.equal(mapToSystemCategory('familia'), 'Familia');
});

test('NLP engine correctly categorizes real estate and rental cases', () => {
  const narrative = 'El inquilino del apartamento en Cali lleva 3 meses sin pagar el canon de arrendamiento y necesito iniciar la restitución del inmueble.';
  const facts = analyzeNarrativeHeuristically(narrative);

  assert.equal(facts.suggestedCategory, 'inmobiliario');
  assert.equal(facts.detectedCity, 'Cali');
  assert.equal(mapToSystemCategory('inmobiliario'), 'Arrendamientos');
});

test('NLP engine correctly handles consumer protection, criminal, and administrative cases', () => {
  const consumer = analyzeNarrativeHeuristically('Compré un televisor defectuoso y el almacén no quiere aplicar la garantía ante la SIC.');
  assert.equal(consumer.suggestedCategory, 'consumidor');

  const penal = analyzeNarrativeHeuristically('Fui víctima de una estafa y quiero interponer una denuncia penal formal ante la Fiscalía.');
  assert.equal(penal.suggestedCategory, 'penal');

  const admin = analyzeNarrativeHeuristically('Radiqué un derecho de petición ante la Alcaldía y no me han dado respuesta, quiero interponer una acción de tutela.');
  assert.equal(admin.suggestedCategory, 'administrativo');
});

test('NLP engine detects urgency indicators', () => {
  const urgentCase = analyzeNarrativeHeuristically('Tengo una audiencia mañana en el juzgado y es un plazo urgente que vence de inmediato.');
  assert.equal(urgentCase.urgency, 'urgent');

  const normalCase = analyzeNarrativeHeuristically('Quiero consultar mis opciones con calma para ver si puedo iniciar un reclamo más adelante.');
  assert.equal(normalCase.urgency, 'normal');
});

test('NLP engine provides safe fallback for undefined categories', () => {
  const fallback = analyzeNarrativeHeuristically('Tengo una situación particular y no sé cómo clasificarla con exactitud.');
  assert.ok(['no_seguro', 'otro'].includes(fallback.suggestedCategory));
});

test('Question sets contain all mandatory branches and support generic "Otro"', () => {
  const categories = Object.keys(CATEGORY_QUESTION_SETS);
  assert.ok(categories.includes('laboral'));
  assert.ok(categories.includes('familia'));
  assert.ok(categories.includes('civil_contractual'));
  assert.ok(categories.includes('inmobiliario'));
  assert.ok(categories.includes('consumidor'));
  assert.ok(categories.includes('administrativo'));
  assert.ok(categories.includes('penal'));
  assert.ok(categories.includes('transito_responsabilidad'));
  assert.ok(categories.includes('propiedad_intelectual'));
  assert.ok(categories.includes('otro'));
  assert.ok(categories.includes('no_seguro'));

  assert.ok(GLOBAL_QUESTIONS.length >= 4);
});

// 2. UI Component Rendering Tests
test('WelcomeStep renders calm trust principles without registration barrier', () => {
  const html = renderToStaticMarkup(
    React.createElement(WelcomeStep, {
      onStart: () => {},
      hasExistingDraft: false
    })
  );
  const doc = new JSDOM(html).window.document;

  assert.ok(
    doc.querySelector('h1')?.textContent?.includes('Cuéntanos qué pasó') ||
    doc.querySelector('h1')?.textContent?.includes('Empieza por lo importante')
  );
  assert.ok(html.includes('Tú eliges cuánto compartir'));
  assert.ok(html.includes('Es simple'));
  assert.ok(html.includes('Puedes adjuntar documentos'));
  assert.ok(html.includes('Tú decides'));
  assert.ok(html.includes('Empezar mi caso'));
  assert.ok(html.includes('Toma unos minutos'));
  assert.ok(html.includes('Cómo cuidamos tu información'));
});

test('NarrativeStep includes privacy helper, textarea, and dictation button', () => {
  const html = renderToStaticMarkup(
    React.createElement(NarrativeStep, {
      initialNarrative: 'Relato inicial de prueba',
      onContinue: () => {},
      onSaveAndExit: () => {}
    })
  );
  const doc = new JSDOM(html).window.document;

  assert.ok(doc.querySelector('textarea#narrative-input'));
  assert.ok(html.includes('Cuéntanos qué está pasando'));
  assert.ok(html.includes('Dictar'));
  assert.ok(html.includes('Bajo tu control'));
  assert.ok(html.includes('Sin lenguaje técnico'));
  assert.ok(html.includes('Guardar y salir'));
  assert.ok(html.includes('Continuar'));
});

test('SummaryReviewStep renders provisional legal area and editable fields', () => {
  const testFacts = {
    suggestedCategory: 'laboral' as const,
    categoryLabel: 'Laboral y seguridad social',
    confidence: 'high' as const,
    summary: 'Fuiste despedido mientras estabas incapacitado.',
    desiredOutcome: 'Entender mis opciones y posibles reclamaciones.',
    importantDates: ['3 de octubre'],
    detectedCity: 'Bogotá',
    urgency: 'normal' as const,
    extractedFacts: ['Despido tras incapacidad']
  };

  const html = renderToStaticMarkup(
    React.createElement(SummaryReviewStep, {
      facts: testFacts,
      onConfirm: () => {},
      onBackToNarrative: () => {},
      onSaveAndExit: () => {}
    })
  );

  assert.ok(html.includes('Esto es lo que entendimos'));
  assert.ok(html.includes('ÁREA LEGAL SUGERIDA (PROVISIONAL)'));
  assert.ok(html.includes('Laboral y seguridad social'));
  assert.ok(html.includes('Seleccionar área legal'));
  assert.ok(html.includes('Editar'));
  assert.ok(html.includes('Fechas importantes'));
  assert.ok(html.includes('Seleccionar cuándo ocurrió...'));
  assert.ok(html.includes('3 de octubre'));
  assert.ok(html.includes('Ciudad / Ubicación'));
  assert.ok(html.includes('Seleccionar ciudad...'));
  assert.ok(html.includes('Bogotá'));
  assert.ok(html.includes('Está bien, continuar'));
});

test('DynamicQuestionsStep displays adaptive questions and handles "Otro"', () => {
  const testFacts = {
    suggestedCategory: 'laboral' as const,
    categoryLabel: 'Laboral',
    confidence: 'high' as const,
    summary: 'Resumen',
    desiredOutcome: 'Meta',
    importantDates: [],
    detectedCity: 'Medellín',
    urgency: 'normal' as const,
    extractedFacts: []
  };

  const html = renderToStaticMarkup(
    React.createElement(DynamicQuestionsStep, {
      category: 'laboral',
      extractedFacts: testFacts,
      initialAnswers: { employment_status: 'otro' },
      initialOtherTexts: { employment_status: 'Contrato de aprendizaje' },
      onContinue: () => {},
      onBack: () => {},
      onSaveAndExit: () => {}
    })
  );

  assert.ok(html.includes('Completemos lo importante'));
  assert.ok(html.includes('¿Sigues trabajando allí?'));
  assert.ok(html.includes('Por favor especifica:'));
  assert.ok(html.includes('Prefiero responder después'));
});

test('DocumentsStep generates category recommendations and shows private lock notice', () => {
  const html = renderToStaticMarkup(
    React.createElement(DocumentsStep, {
      category: 'laboral',
      files: [
        { id: '1', file: { name: 'Contrato.pdf', size: 1024 * 500 } as any, kind: 'Prueba' }
      ],
      onFilesChange: () => {},
      onContinue: () => {},
      onSkip: () => {},
      onBack: () => {},
      onSaveAndExit: () => {}
    })
  );

  assert.ok(html.includes('¿Tienes documentos que puedan ayudar?'));
  assert.ok(html.includes('Podrían ser útiles para tu asunto (Laboral):'));
  assert.ok(html.includes('Contrato de trabajo'));
  assert.ok(html.includes('Contrato.pdf'));
  assert.ok(html.includes('🔒 Privado'));
  assert.ok(html.includes('Los abogados no pueden abrir estos archivos todavía'));
  assert.ok(html.includes('Archivos totalmente protegidos'));
});

test('PrivatePartiesStep keeps personal and counterparty data visually separate with locks', () => {
  const html = renderToStaticMarkup(
    React.createElement(PrivatePartiesStep, {
      initialData: {
        fullName: 'Carlos Mendoza',
        email: 'carlos@example.com',
        phone: '3001234567',
        counterparties: [{ id: '1', type: 'empresa', name: 'Empresa XYZ', role: 'Empleador' }]
      },
      onContinue: () => {},
      onBack: () => {},
      onSaveAndExit: () => {}
    })
  );

  assert.ok(html.includes('¿Quiénes están involucrados?'));
  assert.ok(html.includes('TUS DATOS · PRIVADO'));
  assert.ok(html.includes('CONTRAPARTE · PRIVADO'));
  assert.ok(html.includes('Carlos Mendoza'));
  assert.ok(html.includes('carlos@example.com'));
  assert.ok(html.includes('Empresa XYZ'));
  assert.ok(html.includes('Agregar otra persona o entidad'));
});

test('PublishReviewStep clearly separates public preview from private identity and files', () => {
  const html = renderToStaticMarkup(
    React.createElement(PublishReviewStep, {
      state: {
        stage: 'review',
        narrative: 'Mi relato privado',
        extractedFacts: {
          suggestedCategory: 'laboral',
          categoryLabel: 'Laboral y seguridad social',
          confidence: 'high',
          summary: 'Resumen anónimo del caso laboral.',
          desiredOutcome: 'Entender opciones.',
          importantDates: ['1 de octubre'],
          detectedCity: 'Bogotá',
          urgency: 'normal',
          extractedFacts: ['Despido injustificado']
        },
        answers: { city: 'Bogotá' },
        otherTexts: {},
        files: [{ id: '1', file: { name: 'Contrato.pdf', size: 1024 } as any, kind: 'Prueba' }],
        privateData: {
          fullName: 'Carlos Mendoza',
          email: 'carlos@example.com',
          phone: '3109876543',
          counterparties: [{ id: '1', type: 'empresa', name: 'Compañía S.A.S.', role: 'Empleador' }]
        },
        privacy: {
          publishAnonymously: true,
          allowProposals: true,
          allowDocumentAccessRequests: true
        },
        title: 'Consulta sobre despido',
        city: 'Bogotá',
        urgency: 'normal'
      },
      onPublish: () => {},
      onBackToEdit: () => {},
      onSaveAndExit: () => {},
      onUpdatePrivacy: () => {}
    })
  );

  assert.ok(html.includes('Todo listo para publicar'));
  assert.ok(html.includes('LO QUE VERÁN LOS ABOGADOS'));
  assert.ok(html.includes('SOLO TÚ PUEDES VER'));
  assert.ok(html.includes('Caso anónimo'));
  assert.ok(html.includes('1 documento preparado'));
  assert.ok(html.includes('Contenido privado'));
  assert.ok(html.includes('Publicar de forma anónima'));
  assert.ok(html.includes('Permitir que abogados verificados me envíen propuestas'));
  assert.ok(html.includes('Permitir que un abogado solicite acceso a documentos específicos'));
  assert.ok(html.includes('Publicar caso'));
});

test('SuccessStep and Permissions Manager render expected post-publication states', () => {
  const successHtml = renderToStaticMarkup(
    React.createElement(SuccessStep, {
      onGoToDashboard: () => {},
      onPublishAnother: () => {},
      caseTitle: 'Reclamación laboral'
    })
  );

  assert.ok(successHtml.includes('Tu caso ha sido publicado de forma anónima'));
  assert.ok(successHtml.includes('Abogados verificados revisarán el resumen'));
  assert.ok(successHtml.includes('Recibirás una notificación cuando alguien muestre interés'));
  assert.ok(successHtml.includes('Tú decides con quién hablar, qué compartir'));
  assert.ok(successHtml.includes('Ir a mi panel'));

  const permsHtml = renderToStaticMarkup(
    React.createElement(CasePermissionsManager, {
      grants: [
        {
          lawyerId: 'l1',
          lawyerName: 'Dra. Andrea Gómez',
          canViewSummary: true,
          canViewFacts: true,
          canViewIdentity: false,
          canViewPrivateParties: false,
          grantedDocumentIds: ['doc1'],
          canViewFullExpediente: false,
          grantedAt: new Date().toISOString()
        },
        {
          lawyerId: 'l2',
          lawyerName: 'Dr. Carlos Ruiz',
          canViewSummary: true,
          canViewFacts: true,
          canViewIdentity: false,
          canViewPrivateParties: false,
          grantedDocumentIds: [],
          canViewFullExpediente: false
        }
      ],
      onRevokeAccess: () => {}
    })
  );

  assert.ok(permsHtml.includes('Acceso al expediente'));
  assert.ok(permsHtml.includes('Dra. Andrea Gómez'));
  assert.ok(permsHtml.includes('Dr. Carlos Ruiz'));
  assert.ok(permsHtml.includes('1 doc(s)'));
  assert.ok(permsHtml.includes('Sin acceso'));
  assert.ok(permsHtml.includes('Oculta'));
  assert.ok(permsHtml.includes('Revocar acceso'));
});

test('AccessRequestModal allows granular selection of documents and identity', () => {
  const modalHtml = renderToStaticMarkup(
    React.createElement(AccessRequestModal, {
      lawyerName: 'Andrea Gómez',
      reason: 'Necesito revisar las cláusulas para preparar una propuesta más precisa.',
      requestedDocumentIds: ['doc1'],
      requestIdentity: true,
      availableDocuments: [
        { id: 'doc1', name: 'Contrato.pdf' },
        { id: 'doc2', name: 'Carta de despido.pdf' }
      ],
      onApproveSelected: () => {},
      onDeny: () => {},
      onClose: () => {}
    })
  );

  assert.ok(modalHtml.includes('Andrea Gómez solicita acceso adicional'));
  assert.ok(modalHtml.includes('Necesito revisar las cláusulas para preparar una propuesta más precisa'));
  assert.ok(modalHtml.includes('Contrato.pdf'));
  assert.ok(modalHtml.includes('Tu identidad y datos de contacto'));
  assert.ok(modalHtml.includes('Dar acceso seleccionado'));
  assert.ok(modalHtml.includes('No por ahora'));
});

test('IntakeProgress renders interactive clickable step buttons for navigation', () => {
  const html = renderToStaticMarkup(
    React.createElement(IntakeProgress, {
      currentStage: 'parties',
      onNavigateStage: () => {}
    })
  );
  const doc = new JSDOM(html).window.document;
  const buttons = doc.querySelectorAll('button.intake-stage-btn');
  assert.equal(buttons.length, 5);
  assert.ok(html.includes('Tu situación'));
  assert.ok(html.includes('Detalles'));
  assert.ok(html.includes('Documentos'));
  assert.ok(html.includes('Privacidad'));
  assert.ok(html.includes('Revisión'));
});

test('IntakeProgress keeps numbers when skipping steps and only checkmarks genuinely completed steps', () => {
  // User jumped directly to 'parties' (Privacidad, step 4) having only completed 'narrative' (step 1)
  const completed = new Set(['narrative']);
  const html = renderToStaticMarkup(
    React.createElement(IntakeProgress, {
      currentStage: 'parties',
      completedStages: completed as any
    })
  );
  const doc = new JSDOM(html).window.document;

  // Step 1 was completed -> has check icon
  const step1 = doc.querySelectorAll('button.intake-stage-btn')[0];
  assert.ok(step1.querySelector('svg.intake-check-icon'));

  // Step 2 was skipped -> NOT completed, shows number 2
  const step2 = doc.querySelectorAll('button.intake-stage-btn')[1];
  assert.ok(!step2.querySelector('svg.intake-check-icon'));
  assert.equal(step2.querySelector('.intake-step-number')?.textContent?.trim(), '2');

  // Step 3 was skipped -> NOT completed, shows number 3
  const step3 = doc.querySelectorAll('button.intake-stage-btn')[2];
  assert.ok(!step3.querySelector('svg.intake-check-icon'));
  assert.equal(step3.querySelector('.intake-step-number')?.textContent?.trim(), '3');

  // Step 4 is current -> shows number 4
  const step4 = doc.querySelectorAll('button.intake-stage-btn')[3];
  assert.equal(step4.querySelector('.intake-step-number')?.textContent?.trim(), '4');
});

test('MicActivationModal renders step-by-step guidance for browser microphone permission', () => {
  const html = renderToStaticMarkup(
    React.createElement(MicActivationModal, {
      isOpen: true,
      onClose: () => {},
      onRetry: () => {}
    })
  );

  assert.ok(html.includes('Cómo activar el micrófono para dictar'));
  assert.ok(html.includes('Chrome / Edge / Brave'));
  assert.ok(html.includes('Safari (Mac / iPad)'));
  assert.ok(html.includes('Celular (Android / iPhone)'));
  assert.ok(html.includes('Probar micrófono ahora'));
  assert.ok(html.includes('Entendido, prefiero escribir'));
});

test('PublishAuthModal renders custom case publishing account creation modal matching design', () => {
  const html = renderToStaticMarkup(
    React.createElement(PublishAuthModal, {
      isOpen: true,
      onClose: () => {},
      onSuccess: () => {},
      initialEmail: 'cliente@ejemplo.com',
      publicationData: {
        title: 'Caso de prueba',
        category: 'Laboral'
      }
    })
  );

  // Left column copy matching user mockup
  assert.ok(html.includes('TU CASO ESTÁ LISTO —'));
  assert.ok(html.includes('Crea tu cuenta'));
  assert.ok(html.includes('para publicar'));
  assert.ok(html.includes('tu caso.'));
  assert.ok(html.includes('Tu información ya está guardada.'));

  // 3 trust cards matching user mockup
  assert.ok(html.includes('No perderás lo que ya completaste'));
  assert.ok(html.includes('Tu caso está guardado de forma segura.'));
  assert.ok(html.includes('Tu caso seguirá privado'));
  assert.ok(html.includes('Solo se compartirá cuando confirmes la publicación.'));
  assert.ok(html.includes('Podrás editarlo después'));
  assert.ok(html.includes('Podrás hacer cambios en cualquier momento.'));

  // Right column form & actions
  assert.ok(html.includes('Continuar con Google'));
  assert.ok(html.includes('o crea tu cuenta con tu correo'));
  assert.ok(html.includes('Correo electrónico'));
  assert.ok(html.includes('cliente@ejemplo.com'));
  assert.ok(html.includes('Contraseña'));
  assert.ok(html.includes('Crear cuenta y publicar'));
  assert.ok(html.includes('¿Ya tienes cuenta?'));
  assert.ok(html.includes('Inicia sesión'));
});

test('PublishAuthModal does not render when isOpen is false', () => {
  const html = renderToStaticMarkup(
    React.createElement(PublishAuthModal, {
      isOpen: false,
      onClose: () => {},
      onSuccess: () => {}
    })
  );

  assert.equal(html, '');
});

