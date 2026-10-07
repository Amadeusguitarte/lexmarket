'use client';
import { ArrowRight, ShieldCheck, EyeOff, LockKeyhole, FileQuestion } from 'lucide-react';

interface WelcomeStepProps {
  onStart: () => void;
  hasExistingDraft?: boolean;
  onResumeDraft?: () => void;
}

export default function WelcomeStep({ onStart, hasExistingDraft, onResumeDraft }: WelcomeStepProps) {
  return (
    <div className="intake-step welcome-step">
      <div className="welcome-step-header">
        <span className="eyebrow">
          <span className="tiny-dot" /> ANTES DE EMPEZAR
        </span>
        <h1 className="editorial-headline">
          Cuéntanos qué está pasando.<br />
          <em>Tú decides qué compartir.</em>
        </h1>
        <p className="welcome-step-sub">
          Puedes empezar sin dar tu nombre ni subir documentos. Nada se comparte con abogados hasta que revises y publiques tu caso.
        </p>
      </div>

      <div className="trust-principles-grid">
        <div className="trust-card">
          <div className="trust-icon-box">
            <EyeOff size={22} />
          </div>
          <div className="trust-content">
            <h3>Identidad privada</h3>
            <p>Tu nombre y datos de contacto permanecen bajo tu exclusivo control. Los abogados ven un resumen sin datos identificatorios.</p>
          </div>
        </div>

        <div className="trust-card">
          <div className="trust-icon-box">
            <FileQuestion size={22} />
          </div>
          <div className="trust-content">
            <h3>Puedes omitir preguntas</h3>
            <p>No necesitas conocer términos jurídicos. Si no estás seguro de algo o prefieres no responderlo ahora, puedes avanzar sin obstáculos.</p>
          </div>
        </div>

        <div className="trust-card">
          <div className="trust-icon-box">
            <LockKeyhole size={22} />
          </div>
          <div className="trust-content">
            <h3>Tú autorizas cada acceso</h3>
            <p>Los documentos que adjuntes no quedan expuestos. Ningún profesional puede revisarlos sin tu autorización expresa previa.</p>
          </div>
        </div>
      </div>

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

      <div className="welcome-step-actions">
        <button type="button" className="button large-cta" onClick={onStart}>
          Empezar <ArrowRight size={18} />
        </button>
        <span className="time-estimate">Esto solo tomará unos minutos.</span>
      </div>
    </div>
  );
}
