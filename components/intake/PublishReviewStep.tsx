'use client';
import { useState } from 'react';
import {
  Lock,
  Eye,
  Shield,
  Check,
  ArrowRight,
  ArrowLeft,
  FileText,
  MapPin,
  Tag,
  AlertCircle
} from 'lucide-react';
import type { CaseIntakeState } from './types';
import { INTAKE_CATEGORIES } from '@/lib/intake-engine';

interface PublishReviewStepProps {
  state: CaseIntakeState;
  onPublish: () => void;
  onBackToEdit: () => void;
  onSaveAndExit: () => void;
  onUpdatePrivacy: (updates: Partial<CaseIntakeState['privacy']>) => void;
  busy?: boolean;
}

export default function PublishReviewStep({
  state,
  onPublish,
  onBackToEdit,
  onSaveAndExit,
  onUpdatePrivacy,
  busy = false
}: PublishReviewStepProps) {
  const {
    extractedFacts,
    userOverriddenCategory,
    files,
    privateData,
    privacy,
    answers,
    title,
    city
  } = state;

  const activeCategory = userOverriddenCategory || extractedFacts.suggestedCategory;
  const categoryMeta = INTAKE_CATEGORIES[activeCategory] || INTAKE_CATEGORIES.otro;
  const effectiveCity = answers['city'] || city || extractedFacts.detectedCity || 'Colombia';

  return (
    <div className="intake-step publish-review-step">
      <div className="step-header">
        <span className="eyebrow">
          <span className="tiny-dot" /> PASO 5 · REVISIÓN FINAL Y PRIVACIDAD
        </span>
        <h1 className="editorial-headline">Todo listo para publicar.</h1>
        <p className="step-sub">
          Revisa exactamente qué podrán ver los abogados y qué seguirá siendo estrictamente privado en tu expediente.
        </p>
      </div>

      {/* Two Zones Comparison Grid */}
      <div className="privacy-zones-grid">
        {/* ZONE 1: LO QUE VERÁN LOS ABOGADOS */}
        <section className="zone-card public-zone">
          <div className="zone-badge-header">
            <span className="zone-indicator-badge public-badge">
              <Eye size={14} /> LO QUE VERÁN LOS ABOGADOS
            </span>
            <span className="anonymous-status">
              {privacy.publishAnonymously ? 'Caso anónimo' : 'Con nombre'}
            </span>
          </div>

          <div className="zone-case-preview">
            <div className="preview-top-tags">
              <span className="preview-category-tag">{categoryMeta.label}</span>
              <span className="preview-location-tag">
                <MapPin size={12} /> {effectiveCity}
              </span>
            </div>

            <h3 className="preview-case-title">
              {title || `Consulta sobre ${categoryMeta.shortLabel.toLowerCase()}`}
            </h3>

            <div className="preview-narrative-box">
              <span className="preview-box-label">Resumen objetivo:</span>
              <p className="preview-summary-text">{extractedFacts.summary}</p>
            </div>

            {/* Non-identifying facts */}
            {extractedFacts.extractedFacts?.length > 0 && (
              <div className="preview-facts-box">
                <span className="preview-box-label">Puntos clave:</span>
                <ul className="preview-facts-list">
                  {extractedFacts.extractedFacts.slice(0, 3).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Files representation */}
            <div className="preview-docs-row">
              <FileText size={16} />
              <span>
                {files.length > 0
                  ? `${files.length} documento${files.length !== 1 ? 's' : ''} preparado${files.length !== 1 ? 's' : ''}`
                  : 'Sin documentos adjuntos'}
              </span>
              <span className="locked-content-pill">
                <Lock size={11} /> Contenido privado
              </span>
            </div>
          </div>
        </section>

        {/* ZONE 2: SOLO TÚ PUEDES VER */}
        <section className="zone-card private-zone">
          <div className="zone-badge-header">
            <span className="zone-indicator-badge private-badge">
              <Lock size={14} /> SOLO TÚ PUEDES VER
            </span>
            <span className="confidential-text">100% Protegido</span>
          </div>

          <div className="private-items-list">
            <div className="private-item-row">
              <span className="item-label">
                <Lock size={13} /> Tu nombre:
              </span>
              <strong className="item-value">{privateData.fullName || 'No indicado'}</strong>
            </div>

            <div className="private-item-row">
              <span className="item-label">
                <Lock size={13} /> Correo:
              </span>
              <strong className="item-value">{privateData.email || 'No indicado'}</strong>
            </div>

            {privateData.phone && (
              <div className="private-item-row">
                <span className="item-label">
                  <Lock size={13} /> Teléfono:
                </span>
                <strong className="item-value">{privateData.phone}</strong>
              </div>
            )}

            {privateData.counterparties?.length > 0 && (
              <div className="private-item-row">
                <span className="item-label">
                  <Lock size={13} /> Contraparte:
                </span>
                <div className="item-value">
                  {privateData.counterparties
                    .map((c) => c.name || '(Por definir)')
                    .join(', ')}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="private-files-container">
                <span className="item-label">
                  <Lock size={13} /> Archivos privados del expediente:
                </span>
                <ul className="private-files-mini-list">
                  {files.map((f) => (
                    <li key={f.id} className="private-file-mini-item">
                      <Lock size={11} /> {f.file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Privacy Controls & Toggles */}
      <div className="privacy-controls-card">
        <h3 className="controls-headline">Controles de privacidad y publicación</h3>

        <div className="controls-list">
          {/* Toggle: Publicar de forma anónima */}
          <label className="privacy-toggle-item">
            <div className="toggle-info">
              <strong>Publicar de forma anónima</strong>
              <p>Tu identidad y datos de contacto no se mostrarán a los abogados en el catálogo público.</p>
            </div>
            <input
              type="checkbox"
              className="intake-toggle-switch"
              checked={privacy.publishAnonymously}
              onChange={(e) => onUpdatePrivacy({ publishAnonymously: e.target.checked })}
            />
          </label>

          {/* Checkbox: Permitir propuestas */}
          <label className="checkbox-setting-item">
            <input
              type="checkbox"
              checked={privacy.allowProposals}
              onChange={(e) => onUpdatePrivacy({ allowProposals: e.target.checked })}
            />
            <div>
              <strong>Permitir que abogados verificados me envíen propuestas</strong>
              <p>Podrán proponerte alcance y honorarios basados en tu resumen público.</p>
            </div>
          </label>

          {/* Checkbox: Permitir solicitudes de acceso */}
          <label className="checkbox-setting-item">
            <input
              type="checkbox"
              checked={privacy.allowDocumentAccessRequests}
              onChange={(e) => onUpdatePrivacy({ allowDocumentAccessRequests: e.target.checked })}
            />
            <div>
              <strong>Permitir que un abogado solicite acceso a documentos específicos</strong>
              <p>
                Una solicitud <strong>NUNCA otorga acceso automático</strong>. Tú decidirás expresamente si apruebas o rechazas cada archivo solicitado.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="intake-step-nav">
        <div className="nav-left-cluster">
          <button type="button" className="text-button" onClick={onBackToEdit}>
            <ArrowLeft size={16} /> Volver y editar
          </button>
          <button
            type="button"
            className="text-button quiet-action"
            onClick={onSaveAndExit}
          >
            Guardar y salir
          </button>
        </div>

        <button
          type="button"
          className="button large-cta"
          onClick={onPublish}
          disabled={busy}
        >
          {busy ? 'Publicando caso…' : 'Publicar caso'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
