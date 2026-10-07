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
  Layers,
  ChevronDown,
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

export default function SummaryReviewStep({
  facts,
  onConfirm,
  onBackToNarrative,
  onSaveAndExit
}: SummaryReviewStepProps) {
  const [data, setData] = useState<ExtractedFacts>({ ...facts });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
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
    setShowCategoryModal(false);
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
        {/* Provisional Category Banner */}
        <div className="summary-category-bar">
          <div className="category-meta">
            <span className="provisional-tag">ÁREA LEGAL SUGERIDA (PROVISIONAL)</span>
            <h2 className="current-category-name">{data.categoryLabel}</h2>
            {data.secondaryCategory && (
              <span className="secondary-category-pill">
                + También se relaciona con: {INTAKE_CATEGORIES[data.secondaryCategory]?.shortLabel}
              </span>
            )}
          </div>
          <button
            type="button"
            className="button outline small edit-category-btn"
            onClick={() => setShowCategoryModal(true)}
          >
            <Edit2 size={13} /> Cambiar área legal
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
          <button
            type="button"
            className="button outline"
            onClick={() => setShowCategoryModal(true)}
          >
            Elegir otra área
          </button>

          <button type="button" className="button" onClick={() => onConfirm(data)}>
            Está bien, continuar <ArrowRight size={17} />
          </button>
        </div>
      </div>

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="modal-backdrop-intake" onClick={() => setShowCategoryModal(false)}>
          <div
            className="modal-content-category"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-head">
              <div>
                <h2>Área legal para tu caso</h2>
                <p className="modal-sub">
                  Elige la categoría que mejor describa tu situación, o selecciona &quot;No estoy seguro&quot; si tienes dudas.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowCategoryModal(false)}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="category-options-grid">
              {(Object.keys(INTAKE_CATEGORIES) as LegalCategoryKey[]).map((catKey) => {
                const meta = INTAKE_CATEGORIES[catKey];
                const isSelected = data.suggestedCategory === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    className={`category-card-select ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectCategory(catKey)}
                  >
                    <div className="category-card-header">
                      <strong>{meta.label}</strong>
                      {isSelected && <Check size={16} className="selected-check" />}
                    </div>
                    <p>{meta.description}</p>
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
