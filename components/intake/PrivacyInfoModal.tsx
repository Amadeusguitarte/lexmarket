'use client';
import React, { useEffect } from 'react';
import { Lock, X } from 'lucide-react';

interface PrivacyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyInfoModal({ isOpen, onClose }: PrivacyInfoModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="privacy-info-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="privacy-info-modal-card">
        <button
          type="button"
          className="privacy-info-close-btn"
          onClick={onClose}
          aria-label="Cerrar modal de privacidad"
        >
          <X size={18} />
        </button>

        <div className="privacy-info-icon-badge">
          <Lock size={20} />
        </div>

        <span className="privacy-info-eyebrow">CÓMO CUIDAMOS TU INFORMACIÓN</span>

        <h3 id="privacy-modal-title" className="privacy-info-title">
          Tú mantienes el control.
        </h3>

        <div className="privacy-info-body">
          <p>
            Tu caso y tus documentos permanecen privados mientras los preparas.
          </p>
          <p>
            Tu información no se comparte automáticamente. Tú revisas y decides qué pueden ver los abogados antes de compartir nada.
          </p>
        </div>

        <button
          type="button"
          className="privacy-info-confirm-btn"
          onClick={onClose}
        >
          Entendido
        </button>

        <div className="privacy-info-footer">
          <a
            href="/como-funciona#privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="privacy-info-policy-link"
          >
            Ver política de privacidad →
          </a>
        </div>
      </div>
    </div>
  );
}
