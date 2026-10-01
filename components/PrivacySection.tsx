'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface PrivacySectionProps {
  onStart?: () => void;
}

export default function PrivacySection({ onStart }: PrivacySectionProps) {
  return (
    <section className="privacy-section wrap" aria-label="Privacidad bajo tu control">
      <div className="privacy-grid">
        {/* Left Column: Editorial Copy & Steps (Inverted layout) */}
        <div className="privacy-content">
          <span className="privacy-eyebrow">
            <span className="privacy-lock-badge" aria-hidden="true">
              <svg
                className="animated-lock-svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect className="lock-body" x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path className="lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle className="lock-keyhole" cx="12" cy="16" r="1.2" fill="currentColor" />
              </svg>
            </span>
            PRIVACIDAD BAJO TU CONTROL
          </span>

          <h2 className="privacy-headline">
            <span className="privacy-line">Tu caso puede ser visible.</span>
            <span className="privacy-line">Tu identidad y tu expediente, no.</span>
          </h2>

          <p className="fees-description privacy-description">
            Publica un resumen de tu situación de forma anónima para que los abogados entiendan tu caso. Tu identidad y tus documentos permanecen privados hasta que tú decidas con quién compartirlos.
          </p>

          <div className="fees-editorial-steps">
            <div className="fees-step-row">
              <span className="fees-step-num">01</span>
              <span className="fees-step-label">Publicas de forma anónima</span>
            </div>

            <div className="fees-step-row">
              <span className="fees-step-num">02</span>
              <span className="fees-step-label">Tu expediente permanece privado</span>
            </div>

            <div className="fees-step-row">
              <span className="fees-step-num">03</span>
              <span className="fees-step-label">Tú decides quién puede ver más</span>
            </div>
          </div>

          <div className="fees-cta-wrapper">
            <button
              type="button"
              onClick={onStart}
              className="fees-cta-link"
            >
              Empezar con mi caso <ArrowRight size={16} className="fees-cta-arrow" />
            </button>
          </div>
        </div>

        {/* Right Column: Multi-layer floating illustration (25% larger, rounded corners) */}
        <div className="privacy-visual-wrapper">
          <div className="privacy-canvas" tabIndex={0} role="img" aria-label="Visualización de expediente protegido y perfil anónimo flotante">
            {/* Floating Security Seal with Animated Lock */}
            <div className="privacy-floating-seal floating-seal" aria-hidden="true">
              <span className="seal-lock-icon">
                <svg
                  className="animated-lock-svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect className="lock-body" x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path className="lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle className="lock-keyhole" cx="12" cy="16" r="1.2" fill="currentColor" />
                </svg>
              </span>
              <span>Expediente protegido</span>
            </div>

            {/* Layer 1: Base Folder and Documents */}
            <img
              src="/Privacidad/Privacidad background.png"
              alt="Expediente y carpetas protegidas"
              className="privacy-layer privacy-layer-bg"
              loading="lazy"
            />

            {/* Layer 2: Middle Frosted Card - Perfil del Cliente */}
            <img
              src="/Privacidad/tarjeta 1.png"
              alt="Perfil del cliente protegido y desenfocado"
              className="privacy-layer privacy-layer-perfil floating-perfil"
              loading="lazy"
            />

            {/* Layer 3: Front Card - Resumen Anónimo */}
            <img
              src="/Privacidad/Tarjeta 2.png"
              alt="Ficha de caso anónimo con estado pendiente de autorización"
              className="privacy-layer privacy-layer-anonimo floating-anonimo"
              loading="lazy"
            />

            {/* Layer 4: Action Button */}
            <img
              src="/Privacidad/boton.png"
              alt="Botón para solicitar acceso al expediente completo"
              className="privacy-layer privacy-layer-boton floating-boton"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
