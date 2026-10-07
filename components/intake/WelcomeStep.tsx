'use client';
import { ArrowRight, FileEdit, Paperclip, Eye, Lock } from 'lucide-react';

interface WelcomeStepProps {
  onStart: () => void;
  hasExistingDraft?: boolean;
  onResumeDraft?: () => void;
  onPrivacyInfo?: () => void;
}

export default function WelcomeStep({
  onStart,
  hasExistingDraft,
  onResumeDraft,
  onPrivacyInfo
}: WelcomeStepProps) {
  return (
    <div className="welcome-screen-container">
      {/* Left Photographic Art Column */}
      <aside className="welcome-visual-column">
        <div className="welcome-visual-scrim" />
        
        <div className="welcome-visual-top">
          <div className="welcome-brand">
            <span className="brand">
              Match<span>Jurídico</span><span className="brand-dot">.</span>
            </span>
            <div className="welcome-brand-sub">
              <span>—</span> PERSONAS REALES.<br />
              SOLUCIONES LEGALES.
            </div>
          </div>
        </div>

        <div className="welcome-visual-bottom">
          <div className="welcome-quote-box">
            <p className="welcome-quote-text">
              Un mejor punto de partida<br />
              para tus próximos pasos.
            </p>
          </div>
        </div>
      </aside>

      {/* Right Content Column */}
      <main className="welcome-content-column">
        <div className="welcome-content-inner">
          <div className="welcome-header">
            <div className="welcome-eyebrow">
              <span className="welcome-eyebrow-dot" /> ANTES DE EMPEZAR
            </div>
            <h1 className="welcome-headline">
              Cuéntanos qué pasó.<br />
              <em>Tú eliges cuánto compartir.</em>
            </h1>
            <p className="welcome-description">
              Empieza con lo esencial. Nosotros te ayudamos a ordenar tu situación y a prepararla paso a paso. Si ya tienes documentos relacionados, puedes adjuntarlos ahora o subirlos más adelante.
            </p>
          </div>

          {/* 3 Calm Trust Cards */}
          <div className="welcome-cards-stack">
            <div className="welcome-trust-card">
              <div className="welcome-card-icon-wrap">
                <FileEdit size={19} className="welcome-card-icon" />
              </div>
              <div className="welcome-card-body">
                <h3>Puedes empezar solo con lo básico</h3>
                <p>Cuéntanos lo esencial, sin detalles técnicos.</p>
              </div>
            </div>

            <div className="welcome-trust-card">
              <div className="welcome-card-icon-wrap">
                <Paperclip size={19} className="welcome-card-icon" />
              </div>
              <div className="welcome-card-body">
                <h3>Adjunta los documentos que ya tengas</h3>
                <p>Si aún no los tienes listos, podrás subirlos después.</p>
              </div>
            </div>

            <div className="welcome-trust-card">
              <div className="welcome-card-icon-wrap">
                <Eye size={19} className="welcome-card-icon" />
              </div>
              <div className="welcome-card-body">
                <h3>Revisas todo antes de compartirlo</h3>
                <p>Tú decides cuándo y con quién se comparte.</p>
              </div>
            </div>
          </div>

          {/* Resume draft notice if exists */}
          {hasExistingDraft && (
            <div className="existing-draft-banner">
              <div>
                <strong>Tienes un borrador guardado en este dispositivo</strong>
                <p>Puedes retomarlo donde lo dejaste o comenzar uno nuevo.</p>
              </div>
              <button type="button" className="button outline small" onClick={onResumeDraft}>
                Continuar borrador
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="welcome-actions-group">
            <button type="button" className="welcome-start-cta" onClick={onStart}>
              <span>Empezar</span>
              <ArrowRight size={18} />
            </button>
            <span className="welcome-time-note">
              Toma unos minutos · Puedes continuar después
            </span>
          </div>

          <div className="welcome-divider-line" />

          {/* Security and Privacy link */}
          <div className="welcome-footer-link-row">
            <button
              type="button"
              className="welcome-privacy-trigger"
              onClick={onPrivacyInfo}
            >
              <Lock size={14} className="welcome-lock-icon" />
              <span>Cómo cuidamos tu información</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
