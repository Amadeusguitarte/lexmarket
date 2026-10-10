'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { draftStore, fileProblem, suggestKind, type IntakeFile, type IntakeDraft } from '@/lib/intake';
import {
  type LegalCategoryKey,
  type ExtractedFacts,
  type PrivateClientData,
  type PrivacyPreferences,
  analyzeNarrativeHeuristically,
  mapToSystemCategory,
  INTAKE_CATEGORIES
} from '@/lib/intake-engine';
import { services } from '@/lib/shared';
import type { IntakeStage, CaseIntakeState } from './intake/types';
import IntakeProgress from './intake/IntakeProgress';
import WelcomeStep from './intake/WelcomeStep';
import NarrativeStep from './intake/NarrativeStep';
import SummaryReviewStep from './intake/SummaryReviewStep';
import DynamicQuestionsStep from './intake/DynamicQuestionsStep';
import DocumentsStep from './intake/DocumentsStep';
import PrivatePartiesStep from './intake/PrivatePartiesStep';
import PublishReviewStep from './intake/PublishReviewStep';
import SuccessStep from './intake/SuccessStep';

interface CaseIntakeProps {
  onClose: () => void;
  onReady: (data: Record<string, string>) => void | Promise<void>;
  signedIn?: boolean;
}

// Editorial sidebar contents per intake stage
const STAGE_ASIDE_CONTENT: Record<
  IntakeStage,
  { eyebrow: string; title: string; subtitle: string; image: string }
> = {
  welcome: {
    eyebrow: 'MATCHJURÍDICO · ADMISIÓN',
    title: 'Tu situación.\nTú decides el ritmo.',
    subtitle: 'Un espacio pensado para entender lo que ocurrió sin tecnicismos ni formularios fríos.',
    image: '/intake-situation-desk.png'
  },
  narrative: {
    eyebrow: 'EN TUS PALABRAS',
    title: 'Tu situación.\nEn tus palabras.',
    subtitle: 'Explícanos lo que pasó tal como se lo contarías a alguien de confianza.',
    image: '/intake-situation-desk.png'
  },
  summary_review: {
    eyebrow: 'ASISTENCIA INTELIGENTE',
    title: 'Organizamos\ntu información.',
    subtitle: 'Extraemos lo esencial de tu relato para que puedas revisarlo y corregir cualquier detalle.',
    image: '/intake-expediente.png'
  },
  clarification: {
    eyebrow: 'PRECISIÓN JURÍDICA',
    title: 'Algunos detalles\npara entender mejor tu caso.',
    subtitle: 'Preguntas adaptadas a tu situación concreta para conectar con el especialista adecuado.',
    image: '/intake-expediente.png'
  },
  evidence: {
    eyebrow: 'EXPEDIENTE PROTEGIDO',
    title: 'Documentos que\npueden ayudar.',
    subtitle: 'Sube contratos, cartas o comprobantes cuando quieras. Todo permanece privado.',
    image: '/intake-expediente.png'
  },
  parties: {
    eyebrow: 'CONFIDENCIALIDAD TOTAL',
    title: 'Información\nprivada.',
    subtitle: 'Tus datos de contacto y la contraparte se mantienen bajo reserva absoluta.',
    image: '/intake-expediente.png'
  },
  review: {
    eyebrow: 'CONTROL ABSOLUTO',
    title: 'Revisa y decide\nqué compartir.',
    subtitle: 'Verifica la separación exacta entre lo que verán los abogados y tu esfera privada.',
    image: '/intake-expediente.png'
  },
  success: {
    eyebrow: 'CASO PUBLICADO',
    title: 'El siguiente paso,\nen buenas manos.',
    subtitle: 'Tu expediente anónimo ya está activo. Te notificaremos ante cualquier interés.',
    image: '/intake-expediente.png'
  }
};

export default function CaseIntake({ onClose, onReady, signedIn = false }: CaseIntakeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Core intake state
  const [stage, setStage] = useState<IntakeStage>('welcome');
  const [narrative, setNarrative] = useState('');
  const [extractedFacts, setExtractedFacts] = useState<ExtractedFacts>({
    suggestedCategory: 'otro',
    categoryLabel: 'Otro asunto',
    confidence: 'low',
    summary: '',
    desiredOutcome: 'Entender mis opciones y posibles reclamaciones.',
    importantDates: [],
    detectedCity: '',
    urgency: 'normal',
    extractedFacts: []
  });
  const [userOverriddenCategory, setUserOverriddenCategory] = useState<LegalCategoryKey | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<IntakeFile[]>([]);
  const [privateData, setPrivateData] = useState<PrivateClientData>({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    counterparties: []
  });
  const [privacy, setPrivacy] = useState<PrivacyPreferences>({
    publishAnonymously: true,
    allowProposals: true,
    allowDocumentAccessRequests: true
  });
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'soon' | 'urgent'>('normal');
  const [caseId, setCaseId] = useState<string | undefined>(undefined);
  const [completedStages, setCompletedStages] = useState<Set<IntakeStage>>(new Set());

  // Intelligent check whether a given stage has actually been completed
  const isStageCompleted = (stg: IntakeStage): boolean => {
    if (completedStages.has(stg)) return true;
    switch (stg) {
      case 'narrative':
        return narrative.trim().length >= 20 && stage !== 'narrative' && stage !== 'welcome';
      case 'clarification':
        return Object.keys(answers).length > 0;
      case 'evidence':
        return files.length > 0;
      case 'parties':
        return Boolean(privateData.fullName?.trim() && privateData.email?.trim());
      case 'review':
        return stage === 'success';
      default:
        return false;
    }
  };

  const [hasExistingDraft, setHasExistingDraft] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Open modal on mount and check for saved drafts in IndexedDB
  useEffect(() => {
    setMounted(true);
    void draftStore('read')
      .then((savedDraft) => {
        if (savedDraft && (savedDraft.data?.description || savedDraft.files?.length)) {
          setHasExistingDraft(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mounted && dialogRef.current) {
      const dialog = dialogRef.current;
      try {
        if (!dialog.open) {
          dialog.showModal();
        }
      } catch {
        dialog.setAttribute('open', '');
      }
    }
  }, [mounted]);

  // Save current progress to IndexedDB
  const persistDraft = async (overrideStage?: IntakeStage) => {
    try {
      const activeCat = userOverriddenCategory || extractedFacts.suggestedCategory;
      const effectiveCity = answers['city'] || city || extractedFacts.detectedCity || '';
      const finalTitle =
        title ||
        (extractedFacts.summary
          ? extractedFacts.summary.slice(0, 70).replace(/\.+$/, '')
          : `Consulta sobre ${INTAKE_CATEGORIES[activeCat]?.shortLabel || 'asunto legal'}`);

      const dataToStore: Record<string, string> = {
        title: finalTitle,
        category: mapToSystemCategory(activeCat),
        city: effectiveCity,
        service: services[0],
        description: narrative,
        public_summary: extractedFacts.summary,
        urgency: urgency,
        client_name: privateData.fullName,
        client_email: privateData.email,
        client_phone: privateData.phone || '',
        counterparties_json: JSON.stringify(privateData.counterparties || []),
        answers_json: JSON.stringify(answers),
        other_texts_json: JSON.stringify(otherTexts),
        stage: overrideStage || stage
      };

      const previous = await draftStore('read');
      const draftPayload: IntakeDraft = {
        ...(previous || {}),
        data: dataToStore,
        files,
        caseId,
        updated: Date.now()
      };
      await draftStore('write', draftPayload);
    } catch {}
  };

  // Resume a previously stored draft
  const handleResumeDraft = async () => {
    try {
      const saved = await draftStore('read');
      if (!saved) return;
      if (saved.data) {
        if (saved.data.description) setNarrative(saved.data.description);
        if (saved.data.title) setTitle(saved.data.title);
        if (saved.data.city) setCity(saved.data.city);
        if (saved.data.public_summary) {
          setExtractedFacts((prev) => ({
            ...prev,
            summary: saved.data.public_summary
          }));
        }
        if (saved.data.client_name || saved.data.client_email) {
          setPrivateData((prev) => ({
            ...prev,
            fullName: saved.data.client_name || '',
            email: saved.data.client_email || '',
            phone: saved.data.client_phone || ''
          }));
        }
        if (saved.data.answers_json) {
          try {
            setAnswers(JSON.parse(saved.data.answers_json));
          } catch {}
        }
        if (saved.data.other_texts_json) {
          try {
            setOtherTexts(JSON.parse(saved.data.other_texts_json));
          } catch {}
        }
        if (saved.data.stage && saved.data.stage !== 'welcome') {
          setStage(saved.data.stage as IntakeStage);
        } else {
          setStage('narrative');
        }
      }
      if (saved.files) {
        setFiles(saved.files);
      }
      if (saved.caseId) {
        setCaseId(saved.caseId);
      }
    } catch {}
  };

  const handleSaveAndExit = async () => {
    setBusy(true);
    try {
      await persistDraft();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  // Direct navigation between stages from top stepper
  const handleNavigateStage = async (targetStage: IntakeStage) => {
    if (targetStage === stage) return;

    // If leaving narrative and user typed something, run heuristic extraction if not already extracted
    if (stage === 'narrative' && targetStage !== 'narrative') {
      if (narrative.trim() && (!extractedFacts.summary || extractedFacts.summary === '')) {
        const heuristic = analyzeNarrativeHeuristically(narrative);
        setExtractedFacts(heuristic);
        if (heuristic.detectedCity && !city) {
          setCity(heuristic.detectedCity);
        }
        if (!title) {
          const catShort = INTAKE_CATEGORIES[heuristic.suggestedCategory]?.shortLabel || 'Asunto legal';
          setTitle(`Consulta sobre ${catShort.toLowerCase()}`);
        }
      }
    }

    setStage(targetStage);
    await persistDraft(targetStage);
  };

  // Stage 1 -> Stage 2: Analyze narrative
  const handleNarrativeContinue = async (userNarrative: string) => {
    setNarrative(userNarrative);
    setBusy(true);
    setError('');

    try {
      // First, get fast client-side heuristic analysis
      const heuristic = analyzeNarrativeHeuristically(userNarrative);
      let analyzedData = heuristic;

      // Call API analyze endpoint
      try {
        const res = await fetch('/api/cases/analyze-intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ narrative: userNarrative })
        });
        if (res.ok) {
          const apiFacts = await res.json();
          if (apiFacts.suggestedCategory && apiFacts.summary) {
            analyzedData = apiFacts;
          }
        }
      } catch {
        // Fallback to client-side heuristics seamlessly
      }

      setExtractedFacts(analyzedData);
      if (analyzedData.detectedCity && !city) {
        setCity(analyzedData.detectedCity);
      }
      if (analyzedData.urgency) {
        setUrgency(analyzedData.urgency);
      }

      // Generate suggested title
      const catShort = INTAKE_CATEGORIES[analyzedData.suggestedCategory]?.shortLabel || 'Asunto legal';
      setTitle(`Consulta sobre ${catShort.toLowerCase()}`);

      setCompletedStages((prev) => new Set(prev).add('narrative').add('summary_review'));
      setStage('summary_review');
      await persistDraft('summary_review');
    } catch (err: any) {
      setError(err.message || 'No pudimos procesar tu relato. Por favor intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  // Stage 2 -> Stage 3: Confirmed summary
  const handleSummaryConfirm = async (confirmedFacts: ExtractedFacts) => {
    setExtractedFacts(confirmedFacts);
    setUserOverriddenCategory(confirmedFacts.suggestedCategory);
    setCompletedStages((prev) => new Set(prev).add('narrative').add('summary_review'));
    setStage('clarification');
    await persistDraft('clarification');
  };

  // Stage 3 -> Stage 4: Completed dynamic questions
  const handleQuestionsContinue = async (
    confirmedAnswers: Record<string, any>,
    confirmedOtherTexts: Record<string, string>
  ) => {
    setAnswers(confirmedAnswers);
    setOtherTexts(confirmedOtherTexts);
    if (confirmedAnswers['city']) {
      setCity(confirmedAnswers['city']);
    }
    setCompletedStages((prev) => new Set(prev).add('clarification'));
    setStage('evidence');
    await persistDraft('evidence');
  };

  // Stage 4 -> Stage 5: Documents done / skipped
  const handleDocumentsContinue = async () => {
    setCompletedStages((prev) => new Set(prev).add('evidence'));
    setStage('parties');
    await persistDraft('parties');
  };

  // Stage 5 -> Stage 6: Parties done
  const handlePartiesContinue = async (confirmedParties: PrivateClientData) => {
    setPrivateData(confirmedParties);
    setCompletedStages((prev) => new Set(prev).add('parties'));
    setStage('review');
    await persistDraft('review');
  };

  // Stage 6 -> Stage 7: Publish case
  const handlePublishCase = async () => {
    setBusy(true);
    setError('');

    try {
      const activeCat = userOverriddenCategory || extractedFacts.suggestedCategory;
      const effectiveCity = answers['city'] || city || extractedFacts.detectedCity || 'Colombia';
      const effectiveTitle =
        title ||
        (extractedFacts.summary.length > 10
          ? extractedFacts.summary.slice(0, 60).replace(/\.+$/, '')
          : `Consulta sobre ${INTAKE_CATEGORIES[activeCat]?.shortLabel || 'asunto'}`);

      // Compose private details breakdown to preserve alongside description
      const detailsList: string[] = [];
      if (answers) {
        Object.entries(answers).forEach(([k, v]) => {
          if (v && k !== 'city') {
            const otherVal = otherTexts[k] ? ` (${otherTexts[k]})` : '';
            detailsList.push(`• ${k}: ${Array.isArray(v) ? v.join(', ') : v}${otherVal}`);
          }
        });
      }

      const counterpartyInfo = privateData.counterparties
        ?.filter((c) => c.name)
        .map((c) => `${c.name} (${c.role || c.type})`)
        .join(', ');

      const structuredDescription = [
        narrative,
        detailsList.length > 0 ? `\n\nDetalles del asunto:\n${detailsList.join('\n')}` : '',
        counterpartyInfo ? `\n\nContraparte señalada: ${counterpartyInfo}` : '',
        privateData.fullName ? `\nContacto: ${privateData.fullName} (${privateData.email})` : ''
      ].join('');

      const publicationData: Record<string, string> = {
        title: effectiveTitle.slice(0, 110),
        category: mapToSystemCategory(activeCat),
        city: effectiveCity.slice(0, 80),
        service: 'Definir el siguiente paso',
        description: structuredDescription.slice(0, 39000),
        public_summary: extractedFacts.summary.slice(0, 1900),
        urgency: urgency
      };

      // Persist to IndexedDB
      await persistDraft('review');

      // Forward to parent case publisher
      await onReady(publicationData);

      setStage('success');
    } catch (err: any) {
      setError(err.message || 'No se pudo publicar el caso. Por favor revisa la información.');
    } finally {
      setBusy(false);
    }
  };

  const asideContent = STAGE_ASIDE_CONTENT[stage] || STAGE_ASIDE_CONTENT.welcome;
  const currentCategory = userOverriddenCategory || extractedFacts.suggestedCategory;
  const isWelcome = stage === 'welcome';

  const dialogContent = (
    <dialog
      ref={dialogRef}
      className={`intake-dialog redesign-dialog ${isWelcome ? 'welcome-modal-mode' : 'workflow-modal-mode'}`}
      aria-labelledby="intake-step-title"
      onCancel={(e) => {
        e.preventDefault();
        void handleSaveAndExit();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          void handleSaveAndExit();
        }
      }}
    >
      {/* Close button for Welcome Mode (top right) */}
      {isWelcome && (
        <button
          type="button"
          className="welcome-modal-close-btn"
          onClick={() => void handleSaveAndExit()}
          aria-label="Cerrar"
          title="Cerrar"
        >
          <X size={19} />
        </button>
      )}

      {/* When in welcome stage: render WelcomeStep directly matching Screenshot 1 */}
      {isWelcome ? (
        <WelcomeStep
          onStart={() => setStage('narrative')}
          hasExistingDraft={hasExistingDraft}
          onResumeDraft={handleResumeDraft}
        />
      ) : (
        <div className="workflow-wrapper">
          {/* Top Unified Header across whole modal matching Screenshot 2 */}
          <header className="intake-top-unified-header">
            <div className="header-brand-wrap">
              <a
                className="brand"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  void handleSaveAndExit();
                }}
              >
                Match<span>Jurídico</span><span className="brand-dot">.</span>
              </a>
            </div>

            <div className="header-stepper-wrap">
              <IntakeProgress
                currentStage={stage}
                onNavigateStage={handleNavigateStage}
                isStageCompleted={isStageCompleted}
              />
            </div>

            <button
              type="button"
              className="icon-button close-intake-btn"
              onClick={() => void handleSaveAndExit()}
              aria-label="Guardar borrador y salir"
              disabled={busy}
              title="Guardar borrador y salir"
            >
              <X size={18} />
            </button>
          </header>

          {/* Error Banner if any */}
          {error && (
            <div className="intake-global-error" role="alert">
              {error}
            </div>
          )}

          {/* Workflow Body */}
          <div className="workflow-body-container">
            {stage === 'narrative' ? (
              <NarrativeStep
                initialNarrative={narrative}
                onChange={(val) => setNarrative(val)}
                onContinue={handleNarrativeContinue}
                onSaveAndExit={handleSaveAndExit}
                onImportDocument={(file) => {
                  setFiles((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      file,
                      kind: suggestKind(file.name)
                    }
                  ]);
                }}
                busy={busy}
              />
            ) : (
              <div className="intake-layout redesign-layout">
                {/* Left Side: Contextual Narrative & Reassurance for subsequent stages */}
                <aside className="intake-aside redesign-aside">
                  <div className="aside-top">
                    <div className="aside-narrative-copy">
                      <span className="eyebrow aside-eyebrow">
                        <span className="tiny-dot" /> {asideContent.eyebrow}
                      </span>
                      <h2 className="aside-headline">{asideContent.title}</h2>
                      <p className="aside-sub">{asideContent.subtitle}</p>
                    </div>
                  </div>

                  <div className="aside-visual-wrapper">
                    <img
                      src={asideContent.image}
                      alt="MatchJurídico atmósfera visual"
                      className="aside-atmospheric-img"
                    />
                  </div>

                  <div className="aside-bottom">
                    <p className="intake-private-notice">
                      <Lock size={14} className="lock-icon" />
                      <span>Por ahora, todo se guarda bajo tu control en este dispositivo.</span>
                    </p>
                  </div>
                </aside>

                {/* Right Side: Step Content */}
                <main className="intake-main redesign-main">
                  <div className="intake-scroll-content">
                    {stage === 'summary_review' && (
                      <SummaryReviewStep
                        facts={extractedFacts}
                        onConfirm={handleSummaryConfirm}
                        onBackToNarrative={() => setStage('narrative')}
                        onSaveAndExit={handleSaveAndExit}
                      />
                    )}

                    {stage === 'clarification' && (
                      <DynamicQuestionsStep
                        category={currentCategory}
                        extractedFacts={extractedFacts}
                        initialAnswers={answers}
                        initialOtherTexts={otherTexts}
                        onChange={(newAnswers, newOtherTexts) => {
                          setAnswers(newAnswers);
                          setOtherTexts(newOtherTexts);
                          if (newAnswers['city']) setCity(newAnswers['city']);
                        }}
                        onContinue={handleQuestionsContinue}
                        onBack={() => setStage('summary_review')}
                        onSaveAndExit={handleSaveAndExit}
                      />
                    )}

                    {stage === 'evidence' && (
                      <DocumentsStep
                        category={currentCategory}
                        files={files}
                        onFilesChange={setFiles}
                        onContinue={handleDocumentsContinue}
                        onSkip={handleDocumentsContinue}
                        onBack={() => setStage('clarification')}
                        onSaveAndExit={handleSaveAndExit}
                        busy={busy}
                      />
                    )}

                    {stage === 'parties' && (
                      <PrivatePartiesStep
                        initialData={privateData}
                        onChange={(newData) => setPrivateData(newData)}
                        onContinue={handlePartiesContinue}
                        onBack={() => setStage('evidence')}
                        onSaveAndExit={handleSaveAndExit}
                      />
                    )}

                    {stage === 'review' && (
                      <PublishReviewStep
                        state={{
                          stage,
                          narrative,
                          extractedFacts,
                          userOverriddenCategory,
                          answers,
                          otherTexts,
                          files,
                          privateData,
                          privacy,
                          title,
                          city,
                          urgency,
                          caseId
                        }}
                        onPublish={handlePublishCase}
                        onBackToEdit={() => setStage('parties')}
                        onSaveAndExit={handleSaveAndExit}
                        onUpdatePrivacy={(updates) => setPrivacy((prev) => ({ ...prev, ...updates }))}
                        busy={busy}
                      />
                    )}

                    {stage === 'success' && (
                      <SuccessStep
                        onGoToDashboard={() => onClose()}
                        onPublishAnother={() => {
                          setStage('welcome');
                          setNarrative('');
                          setFiles([]);
                          setAnswers({});
                          setOtherTexts({});
                        }}
                        caseTitle={title}
                      />
                    )}
                  </div>
                </main>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );

  if (typeof document !== 'undefined' && mounted) {
    return createPortal(dialogContent, document.body);
  }

  return dialogContent;
}
