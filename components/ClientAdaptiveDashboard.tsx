'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  MessageCircle,
  FolderOpen,
  ArrowRight,
  ListChecks,
  Check,
  Scale,
  Calendar,
  Clock,
  MoreVertical,
  Eye,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Sparkles,
  Layers
} from 'lucide-react';
import type { Row } from './Forms';

export type DashboardMode = 'draft' | 'published' | 'empty' | 'in_progress';

interface ClientAdaptiveDashboardProps {
  user: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  };
  items: Row[];
  draftCase?: {
    title?: string;
    category?: string;
    city?: string;
    summary?: string;
    stage?: string;
  } | null;
  onOpenCase: (caseId: string) => void;
  onContinueDraft: () => void;
  onCreateCase: () => void;
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
  onOpenChat?: (caseId: string, lawyerId: string) => void;
}

export default function ClientAdaptiveDashboard({
  user,
  items,
  draftCase,
  onOpenCase,
  onContinueDraft,
  onCreateCase,
  onNavigate,
  onOpenChat
}: ClientAdaptiveDashboardProps) {
  // Determine default mode based on user's real cases/draft state
  const detectDefaultMode = (): DashboardMode => {
    // 1. Is there an active engaged/in-progress case with a lawyer?
    const inProgressCase = items.find(
      (c) => c.status === 'engaged' || c.status === 'in_progress' || c.access_state === 'granted'
    );
    if (inProgressCase) return 'in_progress';

    // 2. Is there a published case?
    const publishedCase = items.find((c) => c.status === 'published' || c.status === 'under_review');
    if (publishedCase) return 'published';

    // 3. Is there a draft case?
    if (draftCase?.title || draftCase?.summary) return 'draft';

    // 4. Default to empty if no cases
    if (items.length === 0) return 'empty';

    return 'draft';
  };

  const [activeMode, setActiveMode] = useState<DashboardMode>(detectDefaultMode());

  // Keep synced if real data changes
  useEffect(() => {
    setActiveMode(detectDefaultMode());
  }, [items.length, draftCase?.title]);

  const firstName = user.name ? user.name.split(' ')[0] : 'Louis';

  // Find relevant active case if available
  const activeCase = items[0] || null;

  return (
    <div className="adaptive-dashboard-root">
      {/* Interactive State Switcher for Preview & Verification */}
      <div className="adaptive-state-bar" role="navigation" aria-label="Selector de estado del panel">
        <span className="state-bar-label">
          <Layers size={14} /> Modo de panel:
        </span>
        <div className="state-bar-pill-group">
          <button
            type="button"
            className={`state-bar-pill ${activeMode === 'draft' ? 'active pill-draft' : ''}`}
            onClick={() => setActiveMode('draft')}
            aria-pressed={activeMode === 'draft'}
          >
            <span className="dot dot-draft" /> A. Con borrador
          </button>
          <button
            type="button"
            className={`state-bar-pill ${activeMode === 'published' ? 'active pill-published' : ''}`}
            onClick={() => setActiveMode('published')}
            aria-pressed={activeMode === 'published'}
          >
            <span className="dot dot-published" /> B. Publicado y propuestas
          </button>
          <button
            type="button"
            className={`state-bar-pill ${activeMode === 'empty' ? 'active pill-empty' : ''}`}
            onClick={() => setActiveMode('empty')}
            aria-pressed={activeMode === 'empty'}
          >
            <span className="dot dot-empty" /> C. Recién registrado (nuevo)
          </button>
          <button
            type="button"
            className={`state-bar-pill ${activeMode === 'in_progress' ? 'active pill-progress' : ''}`}
            onClick={() => setActiveMode('in_progress')}
            aria-pressed={activeMode === 'in_progress'}
          >
            <span className="dot dot-progress" /> D. Caso en curso
          </button>
        </div>
      </div>

      {/* RENDER THE SELECTED DASHBOARD VARIANT */}
      {activeMode === 'draft' && (
        <DraftDashboardView
          firstName={firstName}
          draftCase={draftCase}
          onContinueDraft={onContinueDraft}
          onNavigate={onNavigate}
        />
      )}

      {activeMode === 'published' && (
        <PublishedDashboardView
          activeCase={activeCase}
          onOpenCase={onOpenCase}
          onNavigate={onNavigate}
          onOpenChat={onOpenChat}
        />
      )}

      {activeMode === 'empty' && (
        <EmptyDashboardView
          onCreateCase={onCreateCase}
          onNavigate={onNavigate}
        />
      )}

      {activeMode === 'in_progress' && (
        <InProgressDashboardView
          activeCase={activeCase}
          onOpenCase={onOpenCase}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

/* =========================================================================================
 * VARIANT A: Usuario con borrador (como tu caso)
 * ========================================================================================= */
function DraftDashboardView({
  firstName,
  draftCase,
  onContinueDraft,
  onNavigate
}: {
  firstName: string;
  draftCase?: { title?: string; category?: string; city?: string; summary?: string } | null;
  onContinueDraft: () => void;
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
}) {
  const caseTitle = draftCase?.title || 'Incumplimiento de contrato de arrendamiento';
  const categoryAndCity = `${draftCase?.category || 'Civil y contractual'} · ${draftCase?.city || 'Bogotá'}`;

  return (
    <div className="dashboard-content-flow state-draft-layout">
      {/* Greeting Header */}
      <header className="dashboard-view-header">
        <h1 className="editorial-greeting">Buenos días, {firstName}.</h1>
        <p className="editorial-sub">Continúa donde lo dejaste.</p>
      </header>

      {/* Hero Banner: Caso en preparación */}
      <section className="hero-status-card card-draft-theme" aria-label="Caso en preparación">
        <div className="hero-status-main">
          <div className="hero-status-icon-wrap">
            <div className="icon-rounded-box coral-tint">
              <FileText size={22} className="coral-icon" />
            </div>
          </div>

          <div className="hero-status-details">
            <span className="status-badge-overline coral-overline">
              CASO EN PREPARACIÓN
            </span>
            <h2 className="hero-case-title">{caseTitle}</h2>
            <p className="hero-case-meta">{categoryAndCity}</p>

            <div className="progress-section-block">
              <div className="progress-label-row">
                <span className="steps-count-label">4 de 5 pasos completados</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill fill-burgundy" style={{ width: '80%' }} />
              </div>
              <p className="progress-helper-text">Te falta revisar el resumen antes de publicarlo.</p>
            </div>
          </div>
        </div>

        <div className="hero-status-actions">
          <button type="button" className="button button-burgundy" onClick={onContinueDraft}>
            Continuar mi caso <ArrowRight size={17} />
          </button>
          <button type="button" className="text-button quiet-resume-link" onClick={onContinueDraft}>
            Ver resumen
          </button>
          <button type="button" className="icon-button options-dots-btn" aria-label="Opciones del caso">
            <MoreVertical size={18} />
          </button>
        </div>
      </section>

      {/* Metric Cards Row */}
      <section className="dashboard-metrics-grid" aria-label="Métricas del espacio">
        <div className="metric-box-card" onClick={() => onNavigate('cases')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq"><FolderOpen size={18} /></div>
            <span className="metric-card-title">Tus casos</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value">1</span>
            <span className="metric-unit-label">borrador</span>
          </div>
        </div>

        <div className="metric-box-card">
          <div className="metric-card-header">
            <div className="metric-icon-sq"><Users size={18} /></div>
            <span className="metric-card-title">Propuestas</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value">0</span>
            <span className="metric-unit-label">aún</span>
          </div>
        </div>

        <div className="metric-box-card clickable" onClick={() => onNavigate('messages')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq red-sq"><MessageCircle size={18} /></div>
            <span className="metric-card-title">Mensajes</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value text-red">2</span>
            <span className="metric-unit-label">sin leer</span>
          </div>
        </div>

        <div className="metric-box-card" onClick={() => onNavigate('cases')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq"><FileText size={18} /></div>
            <span className="metric-card-title">Documentos</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value">5</span>
            <span className="metric-unit-label">guardados</span>
          </div>
        </div>
      </section>

      {/* Bottom 2-Column Split */}
      <div className="dashboard-bottom-columns">
        {/* Left Column: Actividad reciente */}
        <section className="dashboard-panel-card activity-panel" aria-labelledby="activity-heading">
          <div className="panel-card-header">
            <h3 id="activity-heading">Actividad reciente</h3>
            <button type="button" className="text-button header-inline-link" onClick={() => onNavigate('cases')}>
              Ver toda la actividad <ArrowRight size={14} />
            </button>
          </div>

          <div className="activity-timeline-list">
            <div className="activity-item-row">
              <span className="activity-bullet orange-bullet" />
              <div className="activity-row-icon"><FileText size={16} /></div>
              <div className="activity-row-text">
                <p><strong>Contrato_arrendamiento.pdf</strong> fue añadido a tu expediente</p>
              </div>
              <time className="activity-row-time">5:12 p. m.</time>
            </div>

            <div className="activity-item-row">
              <span className="activity-bullet orange-bullet" />
              <div className="activity-row-icon"><FileText size={16} /></div>
              <div className="activity-row-text">
                <p>Tú editaste el caso</p>
              </div>
              <time className="activity-row-time">4:30 p. m.</time>
            </div>

            <div className="activity-item-row">
              <span className="activity-bullet orange-bullet" />
              <div className="activity-row-icon"><FileText size={16} /></div>
              <div className="activity-row-text">
                <p>Borrador guardado automáticamente</p>
              </div>
              <time className="activity-row-time">2:18 p. m.</time>
            </div>
          </div>
        </section>

        {/* Right Column: Próximo paso */}
        <section className="dashboard-panel-card next-step-panel warm-cream-panel" aria-labelledby="next-step-heading">
          <div className="next-step-top">
            <div className="next-step-icon-box">
              <ListChecks size={22} className="next-step-icon" />
            </div>
            <div>
              <span className="next-step-eyebrow">Próximo paso</span>
              <h3 id="next-step-heading" className="next-step-title">Revisa el resumen de tu caso.</h3>
            </div>
          </div>

          <p className="next-step-desc">
            Verifica la información y los documentos antes de publicarlo.
          </p>

          <button type="button" className="button button-burgundy full-width-btn" onClick={onContinueDraft}>
            Revisar y publicar <ArrowRight size={17} />
          </button>
        </section>
      </div>
    </div>
  );
}

/* =========================================================================================
 * VARIANT B: Usuario con caso publicado y propuestas
 * ========================================================================================= */
function PublishedDashboardView({
  activeCase,
  onOpenCase,
  onNavigate,
  onOpenChat
}: {
  activeCase: Row | null;
  onOpenCase: (caseId: string) => void;
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
  onOpenChat?: (caseId: string, lawyerId: string) => void;
}) {
  const caseTitle = activeCase?.title || 'Terminación de contrato con pagos pendientes';
  const categoryAndCity = `${activeCase?.category || 'Laboral'} · ${activeCase?.city || 'Medellín'} · Publicado el 7 de octubre de 2026`;
  const caseId = activeCase?.id || 'case-sample';

  return (
    <div className="dashboard-content-flow state-published-layout">
      {/* Greeting Header */}
      <header className="dashboard-view-header">
        <h1 className="editorial-greeting">Tu caso ya está publicado.</h1>
        <p className="editorial-sub">3 abogados han mostrado interés.</p>
      </header>

      {/* Hero Banner: Caso publicado (Sage green theme) */}
      <section className="hero-status-card card-published-theme" aria-label="Caso publicado">
        <div className="hero-status-main">
          <div className="hero-status-icon-wrap">
            <div className="icon-rounded-box green-tint">
              <FileText size={22} className="green-icon" />
            </div>
          </div>

          <div className="hero-status-details">
            <span className="status-badge-overline green-overline">
              CASO PUBLICADO
            </span>
            <h2 className="hero-case-title">{caseTitle}</h2>
            <p className="hero-case-meta">{categoryAndCity}</p>
          </div>
        </div>

        <div className="hero-status-actions">
          <button type="button" className="button button-burgundy" onClick={() => onOpenCase(caseId)}>
            Ver mi caso <ArrowRight size={17} />
          </button>
          <button type="button" className="icon-button options-dots-btn" aria-label="Opciones del caso">
            <MoreVertical size={18} />
          </button>
        </div>
      </section>

      {/* Metric Cards Row */}
      <section className="dashboard-metrics-grid" aria-label="Métricas de propuestas y estado">
        <div className="metric-box-card clickable" onClick={() => onNavigate('cases')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq green-sq"><Users size={18} /></div>
            <span className="metric-card-title">Propuestas</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value text-green">3</span>
            <span className="metric-unit-label">nuevas</span>
          </div>
        </div>

        <div className="metric-box-card clickable" onClick={() => onNavigate('messages')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq red-sq"><MessageCircle size={18} /></div>
            <span className="metric-card-title">Mensajes</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value text-red">4</span>
            <span className="metric-unit-label">sin leer</span>
          </div>
        </div>

        <div className="metric-box-card clickable" onClick={() => onNavigate('cases')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq"><FileText size={18} /></div>
            <span className="metric-card-title">Documentos</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value">8</span>
            <span className="metric-unit-label">en tu expediente</span>
          </div>
        </div>

        <div className="metric-box-card">
          <div className="metric-card-header">
            <div className="metric-icon-sq"><Eye size={18} /></div>
            <span className="metric-card-title">Estado</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value font-medium">En revisión</span>
            <span className="metric-unit-label">Abogados viendo tu caso</span>
          </div>
        </div>
      </section>

      {/* Bottom 2-Column Split: Propuestas recientes + Actividad */}
      <div className="dashboard-bottom-columns">
        {/* Left Column: Propuestas recientes */}
        <section className="dashboard-panel-card proposals-panel" aria-labelledby="proposals-heading">
          <div className="panel-card-header">
            <h3 id="proposals-heading">Propuestas recientes</h3>
            <button type="button" className="text-button header-inline-link" onClick={() => onNavigate('cases')}>
              Ver todas <ArrowRight size={14} />
            </button>
          </div>

          <div className="proposals-list-stack">
            {/* Proposal 1 */}
            <div
              className="proposal-client-row clickable"
              onClick={() => onOpenChat ? onOpenChat(caseId, 'andrea') : onOpenCase(caseId)}
            >
              <div className="proposal-avatar-initials coral-avatar">AG</div>
              <div className="proposal-lawyer-info">
                <h4>Andrea Gómez</h4>
                <p>Abogada laboral · Bogotá</p>
              </div>
              <span className="proposal-tag-soft-green">Nueva</span>
              <time className="proposal-row-time">Hace 18 min</time>
            </div>

            {/* Proposal 2 */}
            <div
              className="proposal-client-row clickable"
              onClick={() => onOpenChat ? onOpenChat(caseId, 'carlos') : onOpenCase(caseId)}
            >
              <div className="proposal-avatar-initials burgundy-avatar">CR</div>
              <div className="proposal-lawyer-info">
                <h4>Carlos Restrepo</h4>
                <p>Derecho laboral · Medellín</p>
              </div>
              <span className="proposal-tag-soft-green">Nueva</span>
              <time className="proposal-row-time">Hace 2 h</time>
            </div>

            {/* Proposal 3 */}
            <div
              className="proposal-client-row clickable"
              onClick={() => onOpenChat ? onOpenChat(caseId, 'laura') : onOpenCase(caseId)}
            >
              <div className="proposal-avatar-initials lavender-avatar">LM</div>
              <div className="proposal-lawyer-info">
                <h4>Laura Martínez</h4>
                <p>Derecho laboral · Bogotá</p>
              </div>
              <time className="proposal-row-time">Hace 5 h</time>
            </div>
          </div>
        </section>

        {/* Right Column: Actividad reciente */}
        <section className="dashboard-panel-card activity-panel" aria-labelledby="activity-heading-b">
          <div className="panel-card-header">
            <h3 id="activity-heading-b">Actividad reciente</h3>
          </div>

          <div className="activity-timeline-list">
            <div className="activity-item-row">
              <span className="activity-bullet green-bullet" />
              <div className="activity-row-icon"><FileText size={16} /></div>
              <div className="activity-row-text">
                <p><strong>Andrea Gómez</strong> mostró interés en tu caso</p>
              </div>
              <time className="activity-row-time">Hace 18 min</time>
            </div>

            <div className="activity-item-row">
              <span className="activity-bullet green-bullet" />
              <div className="activity-row-icon"><FileText size={16} /></div>
              <div className="activity-row-text">
                <p><strong>Carlos Restrepo</strong> te envió una propuesta</p>
              </div>
              <time className="activity-row-time">Hace 2 h</time>
            </div>

            <div className="activity-item-row">
              <span className="activity-bullet green-bullet" />
              <div className="activity-row-icon"><FileText size={16} /></div>
              <div className="activity-row-text">
                <p>Tu caso fue publicado correctamente</p>
              </div>
              <time className="activity-row-time">Ayer, 3:15 p. m.</time>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================================================
 * VARIANT C: Usuario sin casos (recién registrado)
 * ========================================================================================= */
function EmptyDashboardView({
  onCreateCase,
  onNavigate
}: {
  onCreateCase: () => void;
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
}) {
  return (
    <div className="dashboard-content-flow state-empty-layout">
      {/* Editorial Welcome Card with Split Content & Desk Scene */}
      <section className="empty-welcome-hero-card" aria-label="Bienvenida a tu espacio">
        <div className="empty-hero-copy">
          <h1 className="empty-hero-headline">Todo empieza con tu situación.</h1>
          <p className="empty-hero-description">
            Cuéntanos qué está pasando y te ayudaremos a organizar la información para encontrar abogados adecuados.
          </p>

          <button type="button" className="button button-burgundy large-cta-btn" onClick={onCreateCase}>
            Crear mi primer caso <ArrowRight size={18} />
          </button>
        </div>

        <div className="empty-hero-art-wrapper">
          <img
            src="/intake-situation-desk.png"
            alt="Espacio de trabajo ordenado con carpetas, libreta y laptop"
            className="empty-hero-art-img"
          />
        </div>
      </section>

      {/* Metric Cards Row */}
      <section className="dashboard-metrics-grid" aria-label="Métricas iniciales">
        <div className="metric-box-card clickable" onClick={() => onNavigate('messages')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq"><MessageCircle size={18} /></div>
            <span className="metric-card-title">Mensajes</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value">0</span>
            <span className="metric-unit-label">aún</span>
          </div>
        </div>

        <div className="metric-box-card clickable" onClick={onCreateCase}>
          <div className="metric-card-header">
            <div className="metric-icon-sq"><FolderOpen size={18} /></div>
            <span className="metric-card-title">Mis casos</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value">0</span>
            <span className="metric-unit-label">aún</span>
          </div>
        </div>

        <div className="metric-box-card clickable" onClick={onCreateCase}>
          <div className="metric-card-header">
            <div className="metric-icon-sq"><FileText size={18} /></div>
            <span className="metric-card-title">Documentos</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value">0</span>
            <span className="metric-unit-label">aún</span>
          </div>
        </div>

        <div className="metric-box-card clickable" onClick={() => onNavigate('profile')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq"><UserCheck size={18} /></div>
            <span className="metric-card-title">Mi perfil</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value">40%</span>
            <span className="metric-unit-label">completo</span>
          </div>
        </div>
      </section>

      {/* Bottom Educational Block: ¿Cómo funciona? */}
      <section className="dashboard-panel-card how-it-works-panel" aria-labelledby="how-it-works-heading">
        <h3 id="how-it-works-heading" className="how-panel-title">¿Cómo funciona?</h3>

        <div className="how-steps-row-grid">
          {/* Step 1 */}
          <div className="how-step-card-col">
            <div className="how-step-num-badge">1</div>
            <div className="how-step-info">
              <h4>Cuéntanos tu situación</h4>
              <p>Responde algunas preguntas y adjunta documentos (si tienes).</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="how-step-card-col">
            <div className="how-step-num-badge">2</div>
            <div className="how-step-info">
              <h4>Recibe propuestas</h4>
              <p>Abogados verificados revisan tu caso y te envían propuestas.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="how-step-card-col">
            <div className="how-step-num-badge">3</div>
            <div className="how-step-info">
              <h4>Elige con confianza</h4>
              <p>Compara perfiles, conversa y decide quién te acompaña.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================================================
 * VARIANT D: Usuario con abogado asignado / caso en curso
 * ========================================================================================= */
function InProgressDashboardView({
  activeCase,
  onOpenCase,
  onNavigate
}: {
  activeCase: Row | null;
  onOpenCase: (caseId: string) => void;
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
}) {
  const caseTitle = activeCase?.title || 'Revisión del contrato y estrategia';
  const categoryAndCity = `${activeCase?.category || 'Civil y contractual'} · ${activeCase?.city || 'Bogotá'}`;
  const caseId = activeCase?.id || 'case-active';

  return (
    <div className="dashboard-content-flow state-progress-layout">
      {/* Greeting Header */}
      <header className="dashboard-view-header">
        <h1 className="editorial-greeting">Tu caso está en curso.</h1>
        <p className="editorial-sub">Tienes próximas actividades con tu abogado.</p>
      </header>

      {/* Hero Status Card: En Asesoría (Calm Slate Blue theme) */}
      <section className="hero-status-card card-advising-theme" aria-label="Caso en curso">
        <div className="hero-status-main">
          <div className="hero-status-icon-wrap">
            <div className="icon-rounded-box blue-tint">
              <Scale size={22} className="blue-icon" />
            </div>
          </div>

          <div className="hero-status-details">
            <span className="status-badge-overline blue-overline">
              EN ASESORÍA
            </span>
            <h2 className="hero-case-title">{caseTitle}</h2>
            <p className="hero-case-meta">{categoryAndCity}</p>

            <div className="assigned-lawyer-pill">
              <span className="mini-lawyer-avatar">AG</span>
              <span>Con Andrea Gómez</span>
            </div>
          </div>
        </div>

        {/* Right Half: Próxima actividad card */}
        <div className="upcoming-activity-card">
          <div className="upcoming-activity-header">
            <span className="upcoming-activity-label">Próxima actividad</span>
            <button type="button" className="icon-button options-dots-btn" aria-label="Opciones">
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="upcoming-activity-body">
            <Calendar size={18} className="activity-calendar-icon" />
            <div>
              <strong>Reunión virtual</strong>
              <p>Mañana, 10 de octubre · 10:00 a. m.</p>
            </div>
          </div>

          <button
            type="button"
            className="button outline small details-link-btn"
            onClick={() => onOpenCase(caseId)}
          >
            Ver detalles <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Metric Cards Row */}
      <section className="dashboard-metrics-grid" aria-label="Métricas de la asesoría">
        <div className="metric-box-card clickable" onClick={() => onNavigate('messages')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq red-sq"><MessageCircle size={18} /></div>
            <span className="metric-card-title">Mensajes</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value text-red">2</span>
            <span className="metric-unit-label">sin leer</span>
          </div>
        </div>

        <div className="metric-box-card clickable" onClick={() => onNavigate('cases')}>
          <div className="metric-card-header">
            <div className="metric-icon-sq"><FileText size={18} /></div>
            <span className="metric-card-title">Documentos</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value">12</span>
            <span className="metric-unit-label">en tu caso</span>
          </div>
        </div>

        <div className="metric-box-card">
          <div className="metric-card-header">
            <div className="metric-icon-sq orange-sq"><CheckSquare size={18} /></div>
            <span className="metric-card-title">Tareas</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value text-orange">1</span>
            <span className="metric-unit-label">pendiente</span>
          </div>
        </div>

        <div className="metric-box-card">
          <div className="metric-card-header">
            <div className="metric-icon-sq"><ShieldCheck size={18} /></div>
            <span className="metric-card-title">Estado</span>
          </div>
          <div className="metric-card-body">
            <span className="metric-primary-value font-medium">En asesoría</span>
            <span className="metric-unit-label">Desde el 3 de octubre</span>
          </div>
        </div>
      </section>

      {/* Bottom 2-Column Split: Actividad + Próximo paso */}
      <div className="dashboard-bottom-columns">
        {/* Left Column: Actividad reciente */}
        <section className="dashboard-panel-card activity-panel" aria-labelledby="activity-heading-d">
          <div className="panel-card-header">
            <h3 id="activity-heading-d">Actividad reciente</h3>
            <button type="button" className="text-button header-inline-link" onClick={() => onNavigate('cases')}>
              Ver toda <ArrowRight size={14} />
            </button>
          </div>

          <div className="activity-timeline-list">
            <div className="activity-item-row">
              <span className="activity-bullet blue-bullet" />
              <div className="activity-row-icon"><Users size={16} /></div>
              <div className="activity-row-text">
                <p><strong>Andrea Gómez</strong> te envió un mensaje</p>
              </div>
              <time className="activity-row-time">Hace 1 h</time>
            </div>

            <div className="activity-item-row">
              <span className="activity-bullet blue-bullet" />
              <div className="activity-row-icon"><FileText size={16} /></div>
              <div className="activity-row-text">
                <p>Se agregó un nuevo documento</p>
              </div>
              <time className="activity-row-time">Ayer, 4:20 p. m.</time>
            </div>

            <div className="activity-item-row">
              <span className="activity-bullet blue-bullet" />
              <div className="activity-row-icon"><Check size={16} /></div>
              <div className="activity-row-text">
                <p>Se completó la fase de diagnóstico</p>
              </div>
              <time className="activity-row-time">Ayer, 11:15 a. m.</time>
            </div>
          </div>
        </section>

        {/* Right Column: Próximo paso */}
        <section className="dashboard-panel-card next-step-panel warm-cream-panel" aria-labelledby="next-step-heading-d">
          <div className="next-step-top">
            <div className="next-step-icon-box">
              <ListChecks size={22} className="next-step-icon" />
            </div>
            <div>
              <span className="next-step-eyebrow">Próximo paso</span>
              <h3 id="next-step-heading-d" className="next-step-title">Revisar observaciones del contrato.</h3>
            </div>
          </div>

          <p className="next-step-desc">
            Tu abogado ha compartido comentarios sobre la cláusula de terminación.
          </p>

          <button
            type="button"
            className="button button-burgundy full-width-btn"
            onClick={() => onOpenCase(caseId)}
          >
            Ver documento <ArrowRight size={17} />
          </button>
        </section>
      </div>
    </div>
  );
}
