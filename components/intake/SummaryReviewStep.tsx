'use client';
import { useState } from 'react';
import {
  Sparkles,
  Check,
  Edit2,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  X
} from 'lucide-react';
import type { ExtractedFacts, LegalCategoryKey } from '@/lib/intake-engine';
import { INTAKE_CATEGORIES } from '@/lib/intake-engine';

interface SummaryReviewStepProps {
  facts: ExtractedFacts;
  onConfirm: (confirmedFacts: ExtractedFacts) => void;
  onBackToNarrative: () => void;
  onSaveAndExit: () => void;
}

const CATEGORY_ORDER: LegalCategoryKey[] = [
  'laboral',
  'familia',
  'civil_contractual',
  'comercial',
  'inmobiliario',
  'consumidor',
  'administrativo',
  'penal',
  'transito_responsabilidad',
  'propiedad_intelectual',
  'otro',
  'no_seguro'
];

export default function SummaryReviewStep({
  facts,
  onConfirm,
  onBackToNarrative,
  onSaveAndExit
}: SummaryReviewStepProps) {
  const [data, setData] = useState<ExtractedFacts>({ ...facts });
  const [showAreaPanel, setShowAreaPanel] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Field edit states
  const [editSummary, setEditSummary] = useState(data.summary);
  const [editGoal, setEditGoal] = useState(data.desiredOutcome);
  const [editCity, setEditCity] = useState(data.detectedCity || '');
  const [editDates, setEditDates] = useState(data.importantDates.join(', '));

  const handleSaveField = (field: string) => {
    if (field === 'summary') setData((d) => ({ ...d, summary: editSummary }));
    if (field === 'goal') setData((d) => ({ ...d, desiredOutcome: editGoal }));
    if (field === 'city') setData((d) => ({ ...d, detectedCity: editCity }));
    if (field === 'dates') {
      const parsed = editDates
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      setData((d) => ({ ...d, importantDates: parsed.length ? parsed : ['No especificadas'] }));
    }
    setEditingField(null);
  };

  const handleSelectCategory = (catKey: LegalCategoryKey) => {
    setData((d) => ({
      ...d,
      suggestedCategory: catKey,
      categoryLabel: INTAKE_CATEGORIES[catKey]?.label || 'General'
    }));
  };

  return (
    <div className="intake-step summary-step">
      <div className="step-header">
        <span className="eyebrow">
          <Sparkles size={14} className="sparkle-icon" /> ORGANIZAMOS TU INFORMACIÓN
        </span>
        <h1 className="editorial-headline">Esto es lo que entendimos.</h1>
        <p className="step-sub">
          Organizamos los puntos clave de tu relato para que ningún detalle se pierda. Revisa si todo es correcto o corrígelo con tranquilidad.
        </p>
      </div>

      <div className="extracted-overview-card">
        {/* Compact Legal Area Bar */}
        <div className="summary-category-bar compact-view">
          <div className="category-meta">
            <span className="provisional-tag">ÁREA LEGAL SUGERIDA (PROVISIONAL)</span>
            <div className="category-current-badge-row">
              <span className="current-area-badge">
                <span className="area-indicator-dot" />
                {data.categoryLabel}
              </span>
              {data.secondaryCategory && data.suggestedCategory !== data.secondaryCategory && (
                <span className="secondary-area-badge">
                  + {INTAKE_CATEGORIES[data.secondaryCategory]?.shortLabel}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className="button outline small select-area-btn"
            onClick={() => setShowAreaPanel(true)}
          >
            <Edit2 size={13} />
            <span>Seleccionar área legal</span>
          </button>
        </div>

        {/* Structured Insights Grid */}
        <div className="summary-details-list">
          {/* Summary Box */}
          <article className="summary-field-row">
            <div className="field-meta">
              <span className="field-title">Resumen de tu situación</span>
              {editingField === 'summary' ? (
                <div className="inline-edit-box">
                  <textarea
                    rows={3}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                  />
                  <div className="inline-edit-actions">
                    <button
                      type="button"
                      className="button small"
                      onClick={() => handleSaveField('summary')}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setEditingField(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="field-value">{data.summary}</p>
              )}
            </div>
            {editingField !== 'summary' && (
              <button
                type="button"
                className="text-button small-edit"
                onClick={() => {
                  setEditSummary(data.summary);
                  setEditingField('summary');
                }}
              >
                <Edit2 size={13} /> Editar
              </button>
            )}
          </article>

          {/* Desired Goal */}
          <article className="summary-field-row">
            <div className="field-meta">
              <span className="field-title">Lo que buscas resolver</span>
              {editingField === 'goal' ? (
                <div className="inline-edit-box">
                  <input
                    type="text"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                  />
                  <div className="inline-edit-actions">
                    <button
                      type="button"
                      className="button small"
                      onClick={() => handleSaveField('goal')}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setEditingField(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="field-value">{data.desiredOutcome}</p>
              )}
            </div>
            {editingField !== 'goal' && (
              <button
                type="button"
                className="text-button small-edit"
                onClick={() => {
                  setEditGoal(data.desiredOutcome);
                  setEditingField('goal');
                }}
              >
                <Edit2 size={13} /> Editar
              </button>
            )}
          </article>

          {/* Two-column facts: Dates & City */}
          <div className="summary-two-col">
            <article className="summary-field-box">
              <div className="box-header">
                <span className="box-title">
                  <Calendar size={14} /> Fechas importantes
                </span>
                {editingField !== 'dates' && (
                  <button
                    type="button"
                    className="text-button small-edit"
                    onClick={() => {
                      setEditDates(data.importantDates.join(', '));
                      setEditingField('dates');
                    }}
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                )}
              </div>
              {editingField === 'dates' ? (
                <div className="inline-edit-box">
                  <input
                    type="text"
                    placeholder="Fechas separadas por comas"
                    value={editDates}
                    onChange={(e) => setEditDates(e.target.value)}
                  />
                  <div className="inline-edit-actions">
                    <button
                      type="button"
                      className="button small"
                      onClick={() => handleSaveField('dates')}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setEditingField(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="dates-pill-list">
                  {data.importantDates.map((dateStr, idx) => (
                    <li key={idx} className="date-pill">
                      {dateStr}
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="summary-field-box">
              <div className="box-header">
                <span className="box-title">
                  <MapPin size={14} /> Ciudad / Ubicación
                </span>
                {editingField !== 'city' && (
                  <button
                    type="button"
                    className="text-button small-edit"
                    onClick={() => {
                      setEditCity(data.detectedCity || '');
                      setEditingField('city');
                    }}
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                )}
              </div>
              {editingField === 'city' ? (
                <div className="inline-edit-box">
                  <input
                    type="text"
                    placeholder="Ejemplo: Bogotá, Medellín, Cali..."
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                  <div className="inline-edit-actions">
                    <button
                      type="button"
                      className="button small"
                      onClick={() => handleSaveField('city')}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setEditingField(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="field-value city-val">
                  {data.detectedCity || 'No mencionada en el relato (la completaremos en el siguiente paso)'}
                </p>
              )}
            </article>
          </div>

          {/* Key Facts list */}
          {data.extractedFacts?.length > 0 && (
            <div className="facts-section">
              <span className="facts-header">Hechos clave identificados:</span>
              <ul className="facts-list">
                {data.extractedFacts.map((fact, i) => (
                  <li key={i}>
                    <Check size={14} className="fact-check" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Actions */}
      <div className="intake-step-nav summary-nav">
        <button type="button" className="text-button quiet-action" onClick={onBackToNarrative}>
          <ArrowLeft size={16} /> Quiero corregir mi relato
        </button>

        <div className="summary-forward-actions">
          <button type="button" className="button" onClick={() => onConfirm(data)}>
            Está bien, continuar <ArrowRight size={17} />
          </button>
        </div>
      </div>

      {/* Panel con todas las áreas legales */}
      {showAreaPanel && (
        <div className="area-panel-backdrop" onClick={() => setShowAreaPanel(false)}>
          <div
            className="area-panel-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="area-panel-title"
          >
            <div className="area-panel-header">
              <div>
                <span className="provisional-tag">ÁREA LEGAL</span>
                <h2 id="area-panel-title" className="area-panel-title">
                  Seleccionar área legal
                </h2>
                <p className="area-panel-subtitle">
                  Elige la especialidad que mejor describa tu caso. Si tienes dudas, puedes seleccionar &quot;No estoy seguro&quot; al final.
                </p>
              </div>
              <button
                type="button"
                className="icon-button close-panel-btn"
                onClick={() => setShowAreaPanel(false)}
                aria-label="Cerrar panel"
              >
                <X size={18} />
              </button>
            </div>

            <div className="area-panel-grid">
              {CATEGORY_ORDER.map((catKey) => {
                const meta = INTAKE_CATEGORIES[catKey];
                const isSelected = data.suggestedCategory === catKey;
                const isNoSeguro = catKey === 'no_seguro';

                return (
                  <button
                    key={catKey}
                    type="button"
                    className={`area-panel-card ${isSelected ? 'selected' : ''} ${isNoSeguro ? 'card-no-seguro' : ''}`}
                    onClick={() => {
                      handleSelectCategory(catKey);
                      setShowAreaPanel(false);
                    }}
                  >
                    <div className="area-card-top">
                      <strong className="area-card-label">{meta.label}</strong>
                      {isSelected ? (
                        <span className="area-check-badge">
                          <Check size={14} />
                        </span>
                      ) : (
                        <span className="area-radio-dot" />
                      )}
                    </div>
                    {meta.description && (
                      <p className="area-card-desc">{meta.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
