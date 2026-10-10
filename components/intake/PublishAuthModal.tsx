'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  FileText,
  PenLine,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { browserDB } from '@/lib/browser';

interface PublishAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  initialEmail?: string;
  publicationData?: Record<string, string> | null;
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

export default function PublishAuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = '',
  publicationData
}: PublishAuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setBusy(true);
    setError('');
    try {
      const db = browserDB();
      if (!db) {
        throw new Error('Servicio de autenticación no disponible en este momento.');
      }

      try {
        localStorage.setItem('lexmarket.intendedRole', 'client');
        localStorage.setItem('lexmarket.intakeActive', 'true');
        localStorage.setItem('lexmarket.intakeStage', 'review');
        if (publicationData) {
          localStorage.setItem('lexmarket.pendingCase', JSON.stringify(publicationData));
        }
      } catch {}

      const { error: oauthError } = await db.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err?.message || 'No se pudo conectar con Google.');
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      const db = browserDB();
      if (!db) {
        throw new Error('Servicio de autenticación no disponible.');
      }

      try {
        localStorage.setItem('lexmarket.intendedRole', 'client');
        if (publicationData) {
          localStorage.setItem('lexmarket.pendingCase', JSON.stringify(publicationData));
        }
      } catch {}

      if (mode === 'signup') {
        const { data, error: signUpError } = await db.auth.signUp({
          email,
          password,
          options: {
            data: {
              intended_role: 'client'
            },
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
          }
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          await onSuccess();
        } else {
          setVerificationSent(true);
        }
      } else {
        const { data, error: signInError } = await db.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;

        if (data.session) {
          await onSuccess();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo completar la operación. Por favor revisa los datos.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="publish-auth-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-auth-title"
    >
      <div className="publish-auth-modal-card">
        {/* Close Button top-right */}
        <button
          type="button"
          className="publish-auth-close-btn"
          onClick={onClose}
          aria-label="Cerrar y volver a la revisión del caso"
          disabled={busy}
        >
          <X size={20} strokeWidth={2.2} />
        </button>

        {/* Left Side: Warm Cream Background & Value Props */}
        <div className="publish-auth-left">
          <div className="publish-auth-left-content">
            <span className="publish-auth-eyebrow">TU CASO ESTÁ LISTO —</span>

            <h2 id="publish-auth-title" className="publish-auth-title">
              {mode === 'signup' ? (
                <>
                  Crea tu cuenta <br />
                  para publicar <br />
                  <em className="publish-auth-italic">tu caso.</em>
                </>
              ) : (
                <>
                  Inicia sesión <br />
                  para publicar <br />
                  <em className="publish-auth-italic">tu caso.</em>
                </>
              )}
            </h2>

            <p className="publish-auth-subtitle">
              Tu información ya está guardada. Crea una cuenta para publicar el resumen,
              recibir interés de abogados y volver a tu caso cuando quieras.
            </p>

            {/* 3 Trust Cards */}
            <div className="publish-auth-trust-list">
              <div className="publish-auth-trust-card">
                <div className="publish-auth-trust-icon">
                  <FileText size={18} strokeWidth={2} />
                </div>
                <div className="publish-auth-trust-body">
                  <strong>No perderás lo que ya completaste</strong>
                  <p>Tu caso está guardado de forma segura.</p>
                </div>
              </div>

              <div className="publish-auth-trust-card">
                <div className="publish-auth-trust-icon">
                  <Lock size={18} strokeWidth={2} />
                </div>
                <div className="publish-auth-trust-body">
                  <strong>Tu caso seguirá privado</strong>
                  <p>Solo se compartirá cuando confirmes la publicación.</p>
                </div>
              </div>

              <div className="publish-auth-trust-card">
                <div className="publish-auth-trust-icon">
                  <PenLine size={18} strokeWidth={2} />
                </div>
                <div className="publish-auth-trust-body">
                  <strong>Podrás editarlo después</strong>
                  <p>Podrás hacer cambios en cualquier momento.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Clean White Auth Form */}
        <div className="publish-auth-right">
          {verificationSent ? (
            <div className="publish-auth-success-box">
              <div className="publish-auth-success-icon">
                <CheckCircle2 size={44} />
              </div>
              <h3>¡Revisa tu correo!</h3>
              <p>
                Hemos enviado un enlace de confirmación a <strong>{email}</strong>.
              </p>
              <p className="publish-auth-muted-desc">
                Tu borrador está resguardado. Una vez confirmado el correo, tu caso quedará publicado y podrás ingresar directamente a tu expediente.
              </p>
              <button
                type="button"
                className="button publish-auth-submit-btn"
                onClick={onClose}
              >
                <span>Entendido</span>
              </button>
            </div>
          ) : (
            <div className="publish-auth-form-wrap">
              {/* Google Button */}
              <button
                type="button"
                className="publish-auth-google-btn"
                onClick={handleGoogleAuth}
                disabled={busy}
              >
                <GoogleLogo />
                <span>Continuar con Google</span>
              </button>

              {/* Divider */}
              <div className="publish-auth-divider">
                <span>
                  {mode === 'signup'
                    ? 'o crea tu cuenta con tu correo'
                    : 'o inicia sesión con tu correo'}
                </span>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="publish-auth-error-banner" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="publish-auth-form">
                <div className="publish-auth-field">
                  <label htmlFor="publish-auth-email">Correo electrónico</label>
                  <div className="publish-auth-input-wrap">
                    <Mail size={18} className="publish-auth-input-icon" />
                    <input
                      id="publish-auth-email"
                      type="email"
                      required
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={busy}
                    />
                  </div>
                </div>

                <div className="publish-auth-field">
                  <label htmlFor="publish-auth-password">Contraseña</label>
                  <div className="publish-auth-input-wrap">
                    <Lock size={18} className="publish-auth-input-icon" />
                    <input
                      id="publish-auth-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={mode === 'signup' ? 8 : 1}
                      placeholder={mode === 'signup' ? 'Mínimo 10 caracteres' : 'Ingresa tu contraseña'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={busy}
                    />
                    <button
                      type="button"
                      className="publish-auth-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="button publish-auth-submit-btn"
                  disabled={busy}
                >
                  <span>
                    {busy
                      ? 'Procesando…'
                      : mode === 'signup'
                      ? 'Crear cuenta y publicar'
                      : 'Iniciar sesión y publicar'}
                  </span>
                  <ArrowRight size={17} />
                </button>
              </form>

              {/* Bottom Switch Link */}
              <div className="publish-auth-footer">
                {mode === 'signup' ? (
                  <p>
                    ¿Ya tienes cuenta?{' '}
                    <button
                      type="button"
                      className="publish-auth-toggle-link"
                      onClick={() => {
                        setMode('login');
                        setError('');
                      }}
                      disabled={busy}
                    >
                      Inicia sesión
                    </button>
                  </p>
                ) : (
                  <p>
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      className="publish-auth-toggle-link"
                      onClick={() => {
                        setMode('signup');
                        setError('');
                      }}
                      disabled={busy}
                    >
                      Regístrate
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
