'use client';
import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mic,
  RotateCw,
  Sliders,
  CheckCircle2,
  Smartphone,
  Globe,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface MicActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  isRetrying?: boolean;
}

type BrowserTab = 'chrome' | 'safari' | 'mobile';

export default function MicActivationModal({
  isOpen,
  onClose,
  onRetry,
  isRetrying = false
}: MicActivationModalProps) {
  const [activeTab, setActiveTab] = useState<BrowserTab>('chrome');

  // Auto-detect browser on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (/Android|iPhone|iPad|iPod/i.test(ua)) {
        setActiveTab('mobile');
      } else if (/Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)) {
        setActiveTab('safari');
      } else {
        setActiveTab('chrome');
      }
    }
  }, [isOpen]);

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
      className="mic-guide-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-guide-title"
    >
      <div className="mic-guide-modal-card">
        <button
          type="button"
          className="mic-guide-close-btn"
          onClick={onClose}
          aria-label="Cerrar guía de micrófono"
        >
          <X size={18} />
        </button>

        <div className="mic-guide-header">
          <div className="mic-guide-icon-badge">
            <Mic size={22} />
          </div>
          <span className="mic-guide-eyebrow">CONFIGURACIÓN DEL NAVEGADOR</span>
          <h3 id="mic-guide-title" className="mic-guide-title">
            Cómo activar el micrófono para dictar
          </h3>
          <p className="mic-guide-subtitle">
            Tu navegador mantiene el micrófono bloqueado por privacidad. Sigue estos pasos para activarlo en menos de 1 minuto:
          </p>
        </div>

        {/* Browser Selector Tabs */}
        <div className="mic-guide-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'chrome'}
            className={`mic-guide-tab ${activeTab === 'chrome' ? 'active' : ''}`}
            onClick={() => setActiveTab('chrome')}
          >
            <Globe size={14} />
            <span>Chrome / Edge / Brave</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'safari'}
            className={`mic-guide-tab ${activeTab === 'safari' ? 'active' : ''}`}
            onClick={() => setActiveTab('safari')}
          >
            <Globe size={14} />
            <span>Safari (Mac / iPad)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mobile'}
            className={`mic-guide-tab ${activeTab === 'mobile' ? 'active' : ''}`}
            onClick={() => setActiveTab('mobile')}
          >
            <Smartphone size={14} />
            <span>Celular (Android / iPhone)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mic-guide-content">
          {activeTab === 'chrome' && (
            <div className="mic-guide-tab-panel">
              {/* Visual Mock of Browser Bar */}
              <div className="mic-mockup-browser-bar">
                <div className="mic-mockup-url-input">
                  <span className="mic-mockup-lock-highlight" title="Haz clic en este candado o icono">
                    <Lock size={13} />
                    <span className="mic-mockup-pointer-badge">1. Clic aquí</span>
                  </span>
                  <span className="mic-mockup-url-text">matchjuridico.co</span>
                </div>
                <div className="mic-mockup-dropdown-preview">
                  <div className="mic-mockup-row-title">Permisos de este sitio</div>
                  <div className="mic-mockup-permission-row highlight">
                    <span className="perm-label">
                      <Mic size={13} /> Micrófono
                    </span>
                    <span className="perm-status-badge">
                      ✓ Permitir
                    </span>
                  </div>
                </div>
              </div>

              <ol className="mic-guide-steps-list">
                <li>
                  <strong>1. Mira arriba a la izquierda:</strong> en la barra de tu navegador donde está la dirección web, haz clic en el ícono de <strong>candado 🔒</strong> o <strong>ajustes (🎛️)</strong>.
                </li>
                <li>
                  <strong>2. Cambia el permiso:</strong> busca la opción <strong>Micrófono</strong> y cámbiala de &ldquo;Bloqueado&rdquo; a <strong>&ldquo;Permitir&rdquo;</strong> (o enciende el interruptor).
                </li>
                <li>
                  <strong>3. Pulsa el botón abajo:</strong> haz clic en <strong>&ldquo;Probar micrófono ahora&rdquo;</strong> para empezar a dictar inmediatamente sin recargar.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'safari' && (
            <div className="mic-guide-tab-panel">
              <div className="mic-mockup-browser-bar">
                <div className="mic-mockup-url-input">
                  <span className="mic-mockup-lock-highlight">
                    <span style={{ fontWeight: 700, fontSize: 11 }}>aA / 🔒</span>
                    <span className="mic-mockup-pointer-badge">1. Clic aquí</span>
                  </span>
                  <span className="mic-mockup-url-text">matchjuridico.co</span>
                </div>
                <div className="mic-mockup-dropdown-preview">
                  <div className="mic-mockup-row-title">Configuración para este sitio web</div>
                  <div className="mic-mockup-permission-row highlight">
                    <span className="perm-label">
                      <Mic size={13} /> Micrófono:
                    </span>
                    <span className="perm-status-badge">Permitir</span>
                  </div>
                </div>
              </div>

              <ol className="mic-guide-steps-list">
                <li>
                  <strong>1. Pulsa el botón del sitio:</strong> en la barra de direcciones de Safari, haz clic en <strong>aA</strong> o el <strong>candado 🔒</strong>.
                </li>
                <li>
                  <strong>2. Abre la configuración:</strong> selecciona <strong>&ldquo;Configuración para este sitio web...&rdquo;</strong>.
                </li>
                <li>
                  <strong>3. Habilita el micrófono:</strong> en la fila <strong>Micrófono</strong>, selecciona <strong>&ldquo;Permitir&rdquo;</strong> y pulsa &ldquo;Probar micrófono ahora&rdquo;.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'mobile' && (
            <div className="mic-guide-tab-panel">
              <ol className="mic-guide-steps-list">
                <li>
                  <strong>1. Toca el candado o los tres puntos:</strong> junto a la dirección web arriba, toca el ícono de <strong>candado 🔒</strong> o el menú <strong>⋮</strong>.
                </li>
                <li>
                  <strong>2. Entra en Permisos del sitio:</strong> toca en <strong>&ldquo;Permisos&rdquo;</strong> o <strong>&ldquo;Configuración del sitio&rdquo;</strong>.
                </li>
                <li>
                  <strong>3. Activa el Micrófono:</strong> pulsa sobre <strong>Micrófono</strong> y elige <strong>&ldquo;Permitir&rdquo;</strong>. Luego regresa y pulsa &ldquo;Probar micrófono ahora&rdquo;.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Tip Box */}
        <div className="mic-guide-tip-box">
          <HelpCircle size={15} className="tip-icon" />
          <p>
            <strong>¿Prefieres no usar el micrófono?</strong> No te preocupes: puedes escribir tu caso directamente en el cuadro de texto. El dictado es solo una ayuda opcional.
          </p>
        </div>

        {/* Actions Footer */}
        <div className="mic-guide-actions">
          <button
            type="button"
            className="mic-guide-retry-btn"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RotateCw size={15} className={isRetrying ? 'spin' : ''} />
            <span>{isRetrying ? 'Comprobando permiso…' : 'Probar micrófono ahora'}</span>
          </button>

          <button
            type="button"
            className="mic-guide-cancel-btn"
            onClick={onClose}
          >
            Entendido, prefiero escribir
          </button>
        </div>
      </div>
    </div>
  );
}
