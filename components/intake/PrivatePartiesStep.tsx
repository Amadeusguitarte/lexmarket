'use client';
import { useState } from 'react';
import {
  Lock,
  User,
  Building,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Shield,
  HelpCircle
} from 'lucide-react';
import type { PrivateClientData, Counterparty } from '@/lib/intake-engine';

interface PrivatePartiesStepProps {
  initialData: PrivateClientData;
  onChange?: (privateData: PrivateClientData) => void;
  onContinue: (privateData: PrivateClientData) => void;
  onBack: () => void;
  onSaveAndExit: () => void;
}

export default function PrivatePartiesStep({
  initialData,
  onChange,
  onContinue,
  onBack,
  onSaveAndExit
}: PrivatePartiesStepProps) {
  const [data, setData] = useState<PrivateClientData>({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    city: initialData.city || '',
    counterparties:
      initialData.counterparties && initialData.counterparties.length > 0
        ? initialData.counterparties
        : [
            {
              id: crypto.randomUUID(),
              type: 'persona',
              name: '',
              role: 'Contraparte'
            }
          ]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateData = (updater: (prev: PrivateClientData) => PrivateClientData) => {
    setData((prev) => {
      const next = updater(prev);
      onChange?.(next);
      return next;
    });
  };

  const handleAddCounterparty = () => {
    updateData((prev) => ({
      ...prev,
      counterparties: [
        ...prev.counterparties,
        {
          id: crypto.randomUUID(),
          type: 'empresa',
          name: '',
          role: 'Contraparte'
        }
      ]
    }));
  };

  const handleRemoveCounterparty = (id: string) => {
    updateData((prev) => ({
      ...prev,
      counterparties: prev.counterparties.filter((c) => c.id !== id)
    }));
  };

  const updateCounterparty = (id: string, updates: Partial<Counterparty>) => {
    updateData((prev) => ({
      ...prev,
      counterparties: prev.counterparties.map((c) => (c.id === id ? { ...c, ...updates } : c))
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!data.fullName.trim()) {
      errs.fullName = 'Por favor ingresa tu nombre.';
    }
    if (!data.email.trim()) {
      errs.email = 'Por favor ingresa tu correo para enviarte actualizaciones.';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    onContinue(data);
  };

  return (
    <div className="intake-step parties-step">
      <div className="step-header">
        <span className="eyebrow">
          <span className="tiny-dot" /> PASO 4 · INFORMACIÓN PRIVADA
        </span>
        <h1 className="editorial-headline">¿Quiénes están involucrados?</h1>
        <p className="step-sub">
          Esta información se mantiene completamente privada. Puede ayudarnos a organizar correctamente tu caso y verificar posibles conflictos de interés.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="parties-form">
        {/* Block 1: User Data (Private) */}
        <div className="private-card-section">
          <div className="private-card-header">
            <div className="header-title-box">
              <span className="private-badge-lock">
                <Lock size={12} /> TUS DATOS · PRIVADO
              </span>
              <h3>Tus datos de contacto</h3>
            </div>
            <span className="confidential-pill">Solo para ti y MatchJurídico</span>
          </div>

          <p className="private-subcopy">
            No mostraremos estos datos a ningún abogado en la plataforma pública.
          </p>

          <div className="form-fields-grid">
            <label className="intake-field">
              <span className="field-label">Nombre completo</span>
              <input
                type="text"
                placeholder="Tu nombre y apellidos"
                value={data.fullName}
                onChange={(e) => {
                  updateData((prev) => ({ ...prev, fullName: e.target.value }));
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                className={errors.fullName ? 'has-error' : ''}
              />
              {errors.fullName && <small className="error-text">{errors.fullName}</small>}
            </label>

            <label className="intake-field">
              <span className="field-label">Correo electrónico</span>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={data.email}
                onChange={(e) => {
                  updateData((prev) => ({ ...prev, email: e.target.value }));
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                className={errors.email ? 'has-error' : ''}
              />
              {errors.email && <small className="error-text">{errors.email}</small>}
            </label>

            <label className="intake-field">
              <span className="field-label">Teléfono / WhatsApp (opcional)</span>
              <input
                type="tel"
                placeholder="Ejemplo: 300 123 4567"
                value={data.phone}
                onChange={(e) => updateData((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <small className="field-hint">Solo te contactaremos si autorizas comunicaciones directas.</small>
            </label>
          </div>
        </div>

        {/* Block 2: Counterparty (Private) */}
        <div className="private-card-section counterparty-section">
          <div className="private-card-header">
            <div className="header-title-box">
              <span className="private-badge-lock">
                <Lock size={12} /> CONTRAPARTE · PRIVADO
              </span>
              <h3>La otra parte involucrada</h3>
            </div>
            <span className="confidential-pill">Privado</span>
          </div>

          <p className="private-subcopy">
            Indica quién es la otra persona o empresa. Esto permite comprobar que los abogados interesados no tengan conflictos éticos previos con ellos.
          </p>

          <div className="counterparties-stream">
            {data.counterparties.map((cp, idx) => (
              <div key={cp.id} className="counterparty-entry-card">
                <div className="counterparty-top-row">
                  <span className="entry-index">Parte #{idx + 1}</span>
                  {data.counterparties.length > 1 && (
                    <button
                      type="button"
                      className="text-button remove-cp-btn"
                      onClick={() => handleRemoveCounterparty(cp.id)}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>

                <div className="form-fields-grid">
                  <label className="intake-field">
                    <span className="field-label">Tipo de contraparte</span>
                    <select
                      value={cp.type}
                      onChange={(e) => updateCounterparty(cp.id, { type: e.target.value as any })}
                    >
                      <option value="persona">Persona particular</option>
                      <option value="empresa">Empresa o sociedad</option>
                      <option value="entidad">Entidad pública / Estado</option>
                      <option value="no_se">No lo sé con certeza</option>
                    </select>
                  </label>

                  <label className="intake-field">
                    <span className="field-label">Nombre o razón social</span>
                    <input
                      type="text"
                      placeholder="Nombre de la persona, comercio o empresa"
                      value={cp.name}
                      onChange={(e) => updateCounterparty(cp.id, { name: e.target.value })}
                    />
                  </label>

                  <label className="intake-field">
                    <span className="field-label">Rol en el asunto</span>
                    <input
                      type="text"
                      placeholder="Ej: Empleador, Inquilino, Proveedor..."
                      value={cp.role}
                      onChange={(e) => updateCounterparty(cp.id, { role: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="text-button add-counterparty-btn"
              onClick={handleAddCounterparty}
            >
              <Plus size={16} /> Agregar otra persona o entidad involucrada
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="intake-step-nav">
          <div className="nav-left-cluster">
            <button type="button" className="text-button" onClick={onBack}>
              <ArrowLeft size={16} /> Atrás
            </button>
            <button
              type="button"
              className="text-button quiet-action"
              onClick={onSaveAndExit}
            >
              Guardar y salir
            </button>
          </div>

          <button type="submit" className="button">
            Revisar antes de publicar <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </div>
  );
}
