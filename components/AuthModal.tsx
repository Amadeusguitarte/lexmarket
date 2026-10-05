'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Briefcase,
  Check,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Lock,
  Mail,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

interface AuthModalProps {
  authMode: 'signup' | 'login' | 'reset' | 'update' | string;
  role: string;
  pendingCase?: any;
  googleReady: boolean;
  linkedinReady?: boolean;
  busy: boolean;
  authReady: boolean;
  onClose: () => void;
  onModeChange: (mode: string) => void;
  onInfo: (info: string) => void;
  onSubmit: (form: HTMLFormElement) => void;
  onContinueGoogle: () => void;
  onContinueLinkedIn?: () => void;
  onRoleChange?: (role: string) => void;
}

function GoogleLogo() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function AuthModal({
  authMode,
  role,
  pendingCase,
  googleReady,
  linkedinReady,
  busy,
  authReady,
  onClose,
  onModeChange,
  onInfo,
  onSubmit,
  onContinueGoogle,
  onContinueLinkedIn,
  onRoleChange,
}: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentRole, setCurrentRole] = useState(role || 'client');

  useEffect(() => {
    if (role) setCurrentRole(role);
  }, [role]);

  const handleRoleChange = (newRole: string) => {
    setCurrentRole(newRole);
    onRoleChange?.(newRole);
    try {
      localStorage.setItem('lexmarket.intendedRole', newRole);
    } catch {}
  };

  useEffect(() => {
    dialogRef.current?.showModal();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  const isSignup = authMode === 'signup';
  const isLogin = authMode === 'login';
  const isReset = authMode === 'reset';

  return (
    <dialog
      ref={dialogRef}
      className="auth-editorial-dialog"
      onCancel={onClose}
      aria-label={!isReset ? 'Crea tu cuenta' : 'Recupera tu acceso'}
    >
      <div className="auth-editorial-container">
        {/* Close Button floating top-right */}
        <button
          type="button"
          className="auth-editorial-close"
          onClick={onClose}
          aria-label="Cerrar ventana"
        >
          <X size={20} strokeWidth={2} />
        </button>

        {/* Left Column: Full Photographic Background Stage */}
        <div className="auth-editorial-left">
          <img
            src="/auth-desk-scene.png?v=4"
            alt=""
            className="auth-editorial-bg-img"
            aria-hidden="true"
          />
          <div className="auth-editorial-bg-scrim" aria-hidden="true" />
          <div className="auth-editorial-left-content">
            <span className="auth-editorial-badge">TU ESPACIO EN MATCHJURÍDICO</span>

            <h2 className="auth-editorial-title">
              {!isReset ? (
                <>
                  Crea tu cuenta <br />
                  <em>y da el siguiente paso</em>
                </>
              ) : (
                <>
                  Recupera tu acceso <br />
                  <em>a MatchJurídico</em>
                </>
              )}
            </h2>

            <p className="auth-editorial-subtitle">
              {currentRole === 'lawyer'
                ? 'Conéctate con clientes verificados, accede a expedientes estructurados y asegura tus honorarios por etapas.'
                : 'Guarda tu caso, organiza tu información y conéctate con abogados verificados cuando estés listo.'}
            </p>

            {/* 3 Value Pillars */}
            <div className="auth-editorial-bullets">
              <div className="auth-bullet-row">
                <div className="auth-bullet-icon">
                  <Folder size={26} strokeWidth={1.8} />
                </div>
                <div className="auth-bullet-text">
                  <strong>Guarda tu progreso</strong>
                  <span>Accede a tu caso en cualquier momento.</span>
                </div>
              </div>

              <div className="auth-bullet-row">
                <div className="auth-bullet-icon">
                  <ShieldCheck size={26} strokeWidth={1.8} />
                </div>
                <div className="auth-bullet-text">
                  <strong>Tu información, siempre privada</strong>
                  <span>Solo tú decides cuándo compartirla.</span>
                </div>
              </div>

              <div className="auth-bullet-row">
                <div className="auth-bullet-icon">
                  <Users size={26} strokeWidth={1.8} />
                </div>
                <div className="auth-bullet-text">
                  <strong>Conéctate con abogados verificados</strong>
                  <span>Cuando estés listo, sin presiones.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interaction Form */}
        <div className="auth-editorial-right">
          <div className="auth-form-wrapper">
            {/* Role Selector Cards - ¿Cómo quieres usar MatchJurídico? */}
            {isSignup && (
              <div className="auth-role-section">
                <h3 className="auth-role-heading">¿Cómo quieres usar MatchJurídico?</h3>
                <div className="auth-role-cards-grid" role="radiogroup" aria-label="¿Cómo quieres usar MatchJurídico?">
                  {/* Option 1: Necesito ayuda legal */}
                  <button
                    type="button"
                    className={`auth-role-card ${currentRole === 'client' ? 'selected' : ''}`}
                    onClick={() => handleRoleChange('client')}
                    role="radio"
                    aria-checked={currentRole === 'client'}
                  >
                    {currentRole === 'client' && (
                      <span className="auth-role-check-badge">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                    <div className="auth-role-icon-wrap">
                      <FileText size={23} strokeWidth={1.8} />
                    </div>
                    <strong className="auth-role-title">Necesito ayuda legal</strong>
                    <span className="auth-role-subtitle">Publicar y gestionar mi caso</span>
                  </button>

                  {/* Option 2: Soy abogado */}
                  <button
                    type="button"
                    className={`auth-role-card ${currentRole === 'lawyer' ? 'selected' : ''}`}
                    onClick={() => handleRoleChange('lawyer')}
                    role="radio"
                    aria-checked={currentRole === 'lawyer'}
                  >
                    {currentRole === 'lawyer' && (
                      <span className="auth-role-check-badge">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                    <div className="auth-role-icon-wrap">
                      <Briefcase size={23} strokeWidth={1.8} />
                    </div>
                    <strong className="auth-role-title">Soy abogado</strong>
                    <span className="auth-role-subtitle">Encontrar casos y ofrecer mis servicios</span>
                  </button>
                </div>
              </div>
            )}

            {/* Google One-Click CTA */}
            {(isSignup || isLogin) && (
              <button
                type="button"
                className="auth-google-btn"
                onClick={onContinueGoogle}
                disabled={busy}
              >
                <GoogleLogo />
                <span>Continuar con Google</span>
              </button>
            )}

            {/* Divider */}
            {(isSignup || isLogin) && (
              <div className="auth-editorial-divider">
                <span>{isSignup ? 'o regístrate con tu correo' : 'o entra con tu correo'}</span>
              </div>
            )}

            {/* Main Auth Form */}
            <form
              className="auth-form-fields"
              onSubmit={e => {
                e.preventDefault();
                onSubmit(e.currentTarget);
              }}
            >
              <input type="hidden" name="role" value={currentRole} />

              {/* Email Field */}
              {authMode !== 'update' && (
                <div className="auth-field-group">
                  <label htmlFor="auth-email-input" className="auth-field-label">
                    Correo electrónico
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-leading-icon" />
                    <input
                      id="auth-email-input"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      required
                      maxLength={254}
                      className="auth-input-control"
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              {authMode !== 'reset' && (
                <div className="auth-field-group">
                  <div className="auth-field-label-row">
                    <label htmlFor="auth-password-input" className="auth-field-label">
                      Contraseña
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        className="auth-forgot-link"
                        onClick={() => onModeChange('reset')}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-leading-icon" />
                    <input
                      id="auth-password-input"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 10 caracteres'}
                      required
                      minLength={isLogin ? 1 : 10}
                      maxLength={128}
                      className="auth-input-control with-trailing"
                    />
                    <button
                      type="button"
                      className="auth-input-trailing-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy / Security Highlight Callout Box */}
              {isSignup && (
                <div className="auth-security-callout">
                  <div className="auth-security-icon-box">
                    <Lock size={15} strokeWidth={2} />
                  </div>
                  <p>
                    Tu información se conserva en privado y segura. No será visible para otros usuarios hasta que decidas compartirla.
                  </p>
                </div>
              )}

              {/* Terms & Consent Checkbox */}
              {isSignup && (
                <label className="auth-terms-checkbox-line">
                  <input type="checkbox" required className="auth-checkbox-input" />
                  <span>
                    Al crear tu cuenta aceptas nuestras{' '}
                    <button
                      type="button"
                      className="auth-legal-link"
                      onClick={() => {
                        onClose();
                        onInfo('terms');
                      }}
                    >
                      Condiciones
                    </button>{' '}
                    y{' '}
                    <button
                      type="button"
                      className="auth-legal-link"
                      onClick={() => {
                        onClose();
                        onInfo('privacy');
                      }}
                    >
                      Política de Privacidad
                    </button>
                    .
                  </span>
                </label>
              )}

              {/* Primary Burgundy Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={busy || !authReady}
              >
                <span>
                  {busy
                    ? 'Un momento…'
                    : isSignup
                    ? 'Crear cuenta'
                    : isReset
                    ? 'Enviar enlace de recuperación'
                    : authMode === 'update'
                    ? 'Guardar contraseña'
                    : 'Iniciar sesión'}
                </span>
                <ArrowRight size={17} strokeWidth={2.2} />
              </button>
            </form>

            {/* Switch Mode Footer */}
            <div className="auth-switch-footer">
              {isSignup ? (
                <p>
                  ¿Ya tienes una cuenta?{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => onModeChange('login')}
                  >
                    Inicia sesión
                  </button>
                </p>
              ) : isLogin ? (
                <p>
                  ¿Aún no tienes cuenta?{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => onModeChange('signup')}
                  >
                    Regístrate
                  </button>
                </p>
              ) : (
                <p>
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => onModeChange('login')}
                  >
                    Volver a iniciar sesión
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
