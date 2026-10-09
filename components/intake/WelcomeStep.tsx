'use client';
import { useState } from 'react';
import { MessageSquare, Folder, User, Clock, Save, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import PrivacyInfoModal from './PrivacyInfoModal';

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
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleOpenPrivacy = () => {
    onPrivacyInfo?.();
    setShowPrivacyModal(true);
  };

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
              — EMPIEZA CON CLARIDAD
            </div>
          </div>
        </div>

        <div className="welcome-visual-middle">
          <h2 className="welcome-side-headline">
            De una situación,<br />
            <em>a un caso claro.</em>
          </h2>
          <p className="welcome-side-body">
            Organizamos contigo la información para que puedas entender tus opciones y encontrar el apoyo adecuado.
          </p>
        </div>

        <div className="welcome-visual-bottom">
          <div className="welcome-side-lock-note">
            <Lock size={15} className="welcome-side-lock-icon" />
            <div className="welcome-side-lock-divider" />
            <span className="welcome-side-lock-text">
              Tu información,<br />
              bajo tu control.
            </span>
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
                <MessageSquare size={18} className="welcome-card-icon" />
              </div>
              <div className="welcome-card-body">
                <h3>Es simple</h3>
                <p>Explícanos tu situación con tus propias palabras.</p>
              </div>
            </div>

            <div className="welcome-trust-card">
              <div className="welcome-card-icon-wrap">
                <Folder size={18} className="welcome-card-icon" />
              </div>
              <div className="welcome-card-body">
                <h3>Puedes adjuntar documentos</h3>
                <p>Si ya tienes algo preparado, puedes subirlo ahora. Si no, puedes hacerlo después.</p>
              </div>
            </div>

            <div className="welcome-trust-card">
              <div className="welcome-card-icon-wrap">
                <User size={18} className="welcome-card-icon" />
              </div>
              <div className="welcome-card-body">
                <h3>Tú decides</h3>
                <p>Revisas y eliges qué información se comparte con los abogados.</p>
              </div>
            </div>
          </div>

          {/* Actions: Integrated dual actions if draft exists, single CTA if new */}
          {hasExistingDraft ? (
            <div className="welcome-draft-action-box existing-draft-banner">
              <div className="welcome-draft-header-row">
                <div className="welcome-draft-label">
                  <Save size={15} className="welcome-draft-icon" />
                  <strong>Tienes un borrador guardado en este dispositivo</strong>
                </div>
                <p>Puedes retomarlo donde lo dejaste o comenzar uno nuevo.</p>
              </div>
              <div className="welcome-draft-buttons-group">
                <button
                  type="button"
                  className="welcome-start-cta welcome-resume-cta"
                  onClick={onResumeDraft}
                >
                  <span>Continuar borrador</span>
                  <ArrowRight size={17} />
                </button>
                <button
                  type="button"
                  className="welcome-new-case-btn"
                  onClick={onStart}
                >
                  <span>Comenzar uno nuevo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="welcome-actions-group">
              <button type="button" className="welcome-start-cta" onClick={onStart}>
                <span>Empezar mi caso</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* 3 Bottom Badges */}
          <div className="welcome-badges-row">
            <div className="welcome-badge-item">
              <Clock size={16} />
              <span>Toma unos minutos</span>
            </div>
            <div className="welcome-badge-item">
              <Save size={16} />
              <span>Puedes guardar y continuar después</span>
            </div>
            <div className="welcome-badge-item">
              <Lock size={16} />
              <span>Tu información está protegida</span>
            </div>
          </div>

          <div className="welcome-divider-line" />

          {/* Security and Privacy link */}
          <div className="welcome-footer-link-row">
            <button
              type="button"
              className="welcome-privacy-trigger"
              onClick={handleOpenPrivacy}
            >
              <ShieldCheck size={16} className="welcome-lock-icon" />
              <span>Cómo cuidamos tu información</span>
            </button>
          </div>
        </div>
      </main>

      {/* Reassuring privacy & control modal */}
      <PrivacyInfoModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
}

