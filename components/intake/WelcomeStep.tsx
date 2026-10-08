'use client';
import { MessageSquare, Folder, User, Clock, Save, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

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
        <div className="welcome-visual-top">
          <div className="welcome-brand">
            <span className="brand">
              Match<span>Jurídico</span><span className="brand-dot">.</span>
            </span>
            <div className="welcome-brand-sub">
              — EMPIEZA CON CLARIDAD
            </div>
          </div>
        </div>

        <div className="welcome-visual-middle">
          <h2 className="welcome-side-headline">
            Tu caso empieza<br />
            con lo esencial.
          </h2>
          <p className="welcome-side-accent">
            Nosotros te ayudamos<br />
            a organizar el siguiente paso.
          </p>
          <p className="welcome-side-body">
            Avanza a tu ritmo. Puedes empezar con una descripción breve, adjuntar documentos si ya los tienes y revisar todo antes de compartirlo con abogados.
          </p>
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
              Empieza por lo importante.<br />
              <em>Tú eliges cuánto compartir.</em>
            </h1>
            <p className="welcome-description">
              Describe tu situación en pocas palabras. Si ya tienes documentos preparados, puedes adjuntarlos ahora o hacerlo más adelante. Antes de publicar, revisarás todo con calma.
            </p>
          </div>

          {/* 3 Calm Trust Cards */}
          <div className="welcome-cards-stack">
            <div className="welcome-trust-card">
              <div className="welcome-card-icon-wrap">
                <MessageSquare size={18} className="welcome-card-icon" />
              </div>
              <div className="welcome-card-body">
                <h3>Es simple</h3>
                <p>Explícanos tu situación como la contarías a alguien de confianza.</p>
              </div>
            </div>

            <div className="welcome-trust-card">
              <div className="welcome-card-icon-wrap">
                <Folder size={18} className="welcome-card-icon" />
              </div>
              <div className="welcome-card-body">
                <h3>Puedes adjuntar documentos</h3>
                <p>Si ya tienes algo preparado, súbelo ahora. Si no, podrás hacerlo después.</p>
              </div>
            </div>

            <div className="welcome-trust-card">
              <div className="welcome-card-icon-wrap">
                <User size={18} className="welcome-card-icon" />
              </div>
              <div className="welcome-card-body">
                <h3>Tú decides</h3>
                <p>Revisas y eliges qué información compartir con los abogados.</p>
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
              <span>Empieza mi caso</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* 3 Bottom Badges */}
          <div className="welcome-badges-row">
            <div className="welcome-badge-item">
              <Clock size={15} />
              <span>Toma unos minutos</span>
            </div>
            <div className="welcome-badge-item">
              <Save size={15} />
              <span>Puedes guardar y continuar después</span>
            </div>
            <div className="welcome-badge-item">
              <Lock size={15} />
              <span>Tu información queda bajo tu control</span>
            </div>
          </div>

          <div className="welcome-divider-line" />

          {/* Security and Privacy link */}
          <div className="welcome-footer-link-row">
            <button
              type="button"
              className="welcome-privacy-trigger"
              onClick={onPrivacyInfo}
            >
              <ShieldCheck size={16} className="welcome-lock-icon" />
              <span>Cómo cuidamos tu información</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

