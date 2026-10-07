'use client';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Clock,
  Check,
  Calendar,
  AlertCircle,
  Info
} from 'lucide-react';
import type {
  LegalCategoryKey,
  IntakeQuestion,
  ExtractedFacts
} from '@/lib/intake-engine';
import {
  GLOBAL_QUESTIONS,
  CATEGORY_QUESTION_SETS
} from '@/lib/intake-engine';

interface DynamicQuestionsStepProps {
  category: LegalCategoryKey;
  extractedFacts: ExtractedFacts;
  initialAnswers: Record<string, any>;
  initialOtherTexts: Record<string, string>;
  onContinue: (answers: Record<string, any>, otherTexts: Record<string, string>) => void;
  onBack: () => void;
  onSaveAndExit: () => void;
}

export default function DynamicQuestionsStep({
  category,
  extractedFacts,
  initialAnswers,
  initialOtherTexts,
  onContinue,
  onBack,
  onSaveAndExit
}: DynamicQuestionsStepProps) {
  // Pre-fill answers with detected facts if not already answered
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const prefilled: Record<string, any> = { ...initialAnswers };
    if (!prefilled['city'] && extractedFacts.detectedCity) {
      prefilled['city'] = extractedFacts.detectedCity;
    }
    if (!prefilled['urgency_deadline'] && extractedFacts.urgency === 'urgent') {
      prefilled['urgency_deadline'] = 'si';
    }
    return prefilled;
  });

  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({ ...initialOtherTexts });
  const [skippedQuestions, setSkippedQuestions] = useState<Record<string, boolean>>({});

  // Merge questions: category-specific first + global questions, filtering with showWhen
  const categoryQuestions = CATEGORY_QUESTION_SETS[category] || CATEGORY_QUESTION_SETS.otro;
  const allAvailableQuestions: IntakeQuestion[] = [...categoryQuestions, ...GLOBAL_QUESTIONS];

  // Filter questions according to progressive disclosure rules
  const visibleQuestions = allAvailableQuestions.filter((q) => {
    if (q.showWhen) {
      return q.showWhen(answers, extractedFacts);
    }
    return true;
  });

  const handleSingleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
    // Clear skip state if answered
    if (skippedQuestions[questionId]) {
      setSkippedQuestions((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleMultiSelectToggle = (questionId: string, value: string) => {
    const current: string[] = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    const exists = current.includes(value);
    const updated = exists ? current.filter((v) => v !== current.find((item) => item === value)) : [...current, value];
    setAnswers((prev) => ({
      ...prev,
      [questionId]: updated
    }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleOtherTextChange = (questionId: string, text: string) => {
    setOtherTexts((prev) => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleSkipQuestion = (questionId: string) => {
    setSkippedQuestions((prev) => ({ ...prev, [questionId]: true }));
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[questionId];
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue(answers, otherTexts);
  };

  return (
    <div className="intake-step dynamic-questions-step">
      <div className="step-header">
        <span className="eyebrow">
          <span className="tiny-dot" /> PASO 2 · DETALLES IMPORTANTES
        </span>
        <h1 className="editorial-headline">Completemos lo importante.</h1>
        <p className="step-sub">
          Solo te preguntaremos lo necesario para entender mejor tu situación y encontrar profesionales adecuados para este tipo de asunto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="questions-form">
        <div className="questions-stream">
          {visibleQuestions.map((q, idx) => {
            const currentVal = answers[q.id];
            const isSkipped = !!skippedQuestions[q.id];
            const isOtherSelected =
              currentVal === 'otro' ||
              (Array.isArray(currentVal) && currentVal.includes('otro'));

            return (
              <fieldset
                key={q.id}
                className={`question-card-cluster ${isSkipped ? 'skipped-cluster' : ''}`}
              >
                <div className="question-header">
                  <legend className="question-text">
                    <span className="question-number">{idx + 1}.</span> {q.question}
                  </legend>
                  {q.helper && <p className="question-helper">{q.helper}</p>}
                  {q.whyWeAsk && (
                    <div className="why-we-ask-callout">
                      <Info size={13} />
                      <span>{q.whyWeAsk}</span>
                    </div>
                  )}
                </div>

                {isSkipped ? (
                  <div className="skipped-indicator">
                    <span>Respondido como &quot;Prefiero responder después&quot;</span>
                    <button
                      type="button"
                      className="text-button small-edit"
                      onClick={() => setSkippedQuestions((prev) => ({ ...prev, [q.id]: false }))}
                    >
                      Responder ahora
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Render Single Select Options */}
                    {q.type === 'single_select' && q.options && (
                      <div className="options-pill-grid">
                        {q.options.map((opt) => {
                          const isSelected = currentVal === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`option-pill ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleSingleSelect(q.id, opt.value)}
                            >
                              <span className="option-label">{opt.label}</span>
                              {isSelected && <Check size={14} className="pill-check" />}
                            </button>
                          );
                        })}

                        {/* Generic "Otro" option */}
                        {q.supportsOther && (
                          <button
                            type="button"
                            className={`option-pill ${currentVal === 'otro' ? 'selected' : ''}`}
                            onClick={() => handleSingleSelect(q.id, 'otro')}
                          >
                            <span className="option-label">Otro</span>
                            {currentVal === 'otro' && <Check size={14} className="pill-check" />}
                          </button>
                        )}

                        {/* Generic "No estoy seguro" option */}
                        {q.supportsUnsure && (
                          <button
                            type="button"
                            className={`option-pill neutral-unsure ${currentVal === 'no_seguro' ? 'selected' : ''}`}
                            onClick={() => handleSingleSelect(q.id, 'no_seguro')}
                          >
                            <HelpCircle size={14} />
                            <span className="option-label">No estoy seguro</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Render Multi Select Options */}
                    {q.type === 'multi_select' && q.options && (
                      <div className="options-pill-grid">
                        {q.options.map((opt) => {
                          const isSelected = Array.isArray(currentVal) && currentVal.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`option-pill ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleMultiSelectToggle(q.id, opt.value)}
                            >
                              <span className="option-label">{opt.label}</span>
                              {isSelected && <Check size={14} className="pill-check" />}
                            </button>
                          );
                        })}

                        {q.supportsOther && (
                          <button
                            type="button"
                            className={`option-pill ${Array.isArray(currentVal) && currentVal.includes('otro') ? 'selected' : ''}`}
                            onClick={() => handleMultiSelectToggle(q.id, 'otro')}
                          >
                            <span className="option-label">Otro</span>
                            {Array.isArray(currentVal) && currentVal.includes('otro') && (
                              <Check size={14} className="pill-check" />
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Generic "Otro" revealed free-text field */}
                    {isOtherSelected && (
                      <div className="other-input-reveal">
                        <label htmlFor={`other-${q.id}`} className="other-input-label">
                          Por favor especifica:
                        </label>
                        <input
                          id={`other-${q.id}`}
                          type="text"
                          placeholder="Escribe aquí los detalles..."
                          value={otherTexts[q.id] || ''}
                          onChange={(e) => handleOtherTextChange(q.id, e.target.value)}
                          className="subtle-text-input"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Text input question type */}
                    {q.type === 'text' && (
                      <div className="direct-text-wrapper">
                        <input
                          type="text"
                          placeholder={q.placeholder || 'Escribe tu respuesta aquí...'}
                          value={currentVal || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          className="subtle-text-input"
                        />
                      </div>
                    )}

                    {/* Date question type */}
                    {q.type === 'date' && (
                      <div className="direct-date-wrapper">
                        <input
                          type="date"
                          value={currentVal || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                          className="subtle-date-input"
                        />
                      </div>
                    )}

                    {/* Skip / "Prefiero responder después" action */}
                    {q.canSkipLater && (
                      <div className="skip-action-row">
                        <button
                          type="button"
                          className="text-button quiet-skip"
                          onClick={() => handleSkipQuestion(q.id)}
                        >
                          Prefiero responder después
                        </button>
                      </div>
                    )}
                  </>
                )}
              </fieldset>
            );
          })}
        </div>

        <div className="intake-step-nav">
          <div className="nav-left-cluster">
            <button type="button" className="text-button" onClick={onBack}>
              <ArrowLeft size={16} /> Atrás
            </button>
            <button
              type="button"
              className="text-button quiet-action"
              onClick={onSaveAndExit}
            >
              Guardar y salir
            </button>
          </div>

          <button type="submit" className="button">
            Continuar a documentos <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
