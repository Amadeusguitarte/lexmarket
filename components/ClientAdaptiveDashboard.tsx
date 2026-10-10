'use client';

import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  FileText,
  Check,
  Users,
  MessageCircle,
  FolderOpen,
  Calendar,
  Clock,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle2,
  Send,
  Compass,
  Lock,
  Plus,
  Eye,
  AlertCircle
} from 'lucide-react';
import type { Row } from './Forms';

export type DashboardMode = 'draft' | 'published' | 'empty' | 'in_progress';

interface ClientAdaptiveDashboardProps {
  loading?: boolean;
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
  loading,
  user,
  items,
  draftCase,
  onOpenCase,
  onContinueDraft,
  onCreateCase,
  onNavigate,
  onOpenChat
}: ClientAdaptiveDashboardProps) {
  if (loading) {
    return <DashboardSkeleton />;
  }

  // 1. D: In-progress case with lawyer
  const inProgressCase = items.find(
    (c) => c.status === 'engaged' || c.status === 'in_progress' || c.access_state === 'granted'
  );

  // 2. B: Published or under review case
  const publishedCase = items.find((c) => c.status === 'published' || c.status === 'review');

  // 3. A: Draft case in database or local draft in progress
  const draftItem = items.find((c) => c.status === 'draft');
  const hasLocalDraft = !!(draftCase?.title || draftCase?.summary);
  const activeDraft = draftItem || (hasLocalDraft ? draftCase : null);

  // Automatic detection based strictly on the user's real situation:
  let activeMode: DashboardMode = 'empty';
  if (inProgressCase) {
    activeMode = 'in_progress';
  } else if (publishedCase) {
    activeMode = 'published';
  } else if (activeDraft) {
    activeMode = 'draft';
  } else {
    activeMode = 'empty';
  }

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('cases');
    }
  };

  const handleCategoryClick = (category: string) => {
    onNavigate('cases');
  };

  return (
    <div className="client-landing-root">
      {/* 1. HERO SEARCH BANNER (COMMON TO ALL 4 STATES) */}
      <section className="client-hero-split-banner" aria-label="Búsqueda y bienvenida">
        <div className="hero-banner-left">
          <span className="hero-overline">TU PLATAFORMA LEGAL</span>
          <h1 className="hero-headline">¿En qué podemos ayudarte hoy?</h1>
          <p className="hero-subtext">
            Encuentra abogados, resuelve tus dudas y avanza tu caso, todo en un mismo lugar.
          </p>

          <form className="hero-search-wrapper" onSubmit={handleSearch}>
            <Search size={18} className="hero-search-icon" />
            <input
              type="text"
              className="hero-search-input"
              placeholder="Busca abogados, especialidades o temas legales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar abogados, especialidades o temas legales"
            />
            <button type="submit" className="hero-search-submit" aria-label="Buscar">
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="hero-category-chips">
            {[
              'Derecho civil',
              'Arrendamientos',
              'Derecho laboral',
              'Familia',
              'Contratos',
              'Vivienda',
              'Herencias'
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                className="hero-cat-chip"
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            ))}
            <button
              type="button"
              className="hero-cat-chip view-all-chip"
              onClick={() => onNavigate('cases')}
            >
              Ver todas →
            </button>
          </div>
        </div>

        <div className="hero-banner-right">
          <div className="hero-right-overlay">
            <h2 className="hero-right-title">
              Personas reales.<br />
              Soluciones reales.
            </h2>
            <p className="hero-right-sub">
              Conecta con abogados especializados en todo Colombia.
            </p>
          </div>
        </div>
      </section>

      {/* 2. CENTRAL STATUS SECTION (ADAPTS ACCORDING TO USER STATE) */}
      {activeMode === 'empty' && (
        <EmptyStateLandingArea
          onCreateCase={onCreateCase}
          onNavigate={onNavigate}
          onOpenChat={onOpenChat}
        />
      )}

      {activeMode === 'draft' && (
        <DraftStateLandingArea
          activeDraft={activeDraft}
          onContinueDraft={draftItem ? () => onOpenCase(draftItem.id) : onContinueDraft}
          onNavigate={onNavigate}
          onOpenChat={onOpenChat}
        />
      )}

      {activeMode === 'published' && (
        <PublishedStateLandingArea
          publishedCase={publishedCase || items[0] || null}
          onOpenCase={onOpenCase}
          onNavigate={onNavigate}
          onOpenChat={onOpenChat}
        />
      )}

      {activeMode === 'in_progress' && (
        <InProgressStateLandingArea
          inProgressCase={inProgressCase || items[0] || null}
          onOpenCase={onOpenCase}
          onNavigate={onNavigate}
          onOpenChat={onOpenChat}
        />
      )}

      {/* 3. RECURSOS PARA TI (COMMON ARTICLE CARDS ROW) */}
      <section className="legal-resources-section" aria-labelledby="resources-heading">
        <div className="section-header-row">
          <h3 id="resources-heading" className="section-title">Recursos para ti</h3>
          <button type="button" className="section-link-button" onClick={() => onNavigate('cases')}>
            Ver todos los artículos →
          </button>
        </div>

        <div className="resources-cards-grid">
          <article className="resource-card" onClick={() => onNavigate('cases')}>
            <div className="resource-thumb-box thumb-deposito">
              <span className="resource-tag">ARRENDAMIENTOS</span>
            </div>
            <div className="resource-info">
              <h4>¿Qué hacer si el arrendador no devuelve el depósito?</h4>
              <span className="resource-reading-time">6 min de lectura</span>
            </div>
          </article>

          <article className="resource-card" onClick={() => onNavigate('cases')}>
            <div className="resource-thumb-box thumb-contrato">
              <span className="resource-tag">CONTRATOS</span>
            </div>
            <div className="resource-info">
              <h4>Cómo revisar un contrato antes de firmarlo</h4>
              <span className="resource-reading-time">4 min de lectura</span>
            </div>
          </article>

          <article className="resource-card" onClick={() => onNavigate('cases')}>
            <div className="resource-thumb-box thumb-proceso">
              <span className="resource-tag">PROCESOS</span>
            </div>
            <div className="resource-info">
              <h4>¿Cuánto dura un proceso civil en Colombia?</h4>
              <span className="resource-reading-time">5 min de lectura</span>
            </div>
          </article>

          <article className="resource-card" onClick={() => onNavigate('cases')}>
            <div className="resource-thumb-box thumb-derechos">
              <span className="resource-tag">VIVIENDA</span>
            </div>
            <div className="resource-info">
              <h4>Derechos del arrendatario en Colombia</h4>
              <span className="resource-reading-time">7 min de lectura</span>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

/* =========================================================================================
 * OPTION 1: Usuario nuevo (sin casos)
 * ========================================================================================= */
function EmptyStateLandingArea({
  onCreateCase,
  onNavigate,
  onOpenChat
}: {
  onCreateCase: () => void;
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
  onOpenChat?: (caseId: string, lawyerId: string) => void;
}) {
  return (
    <>
      <div className="landing-status-split-row">
        {/* Left Status Banner */}
        <div className="landing-status-box status-empty-box">
          <div className="status-box-main">
            <div className="status-icon-circle coral-tint">
              <FileText size={20} className="coral-icon" />
            </div>
            <div className="status-box-copy">
              <h2 className="status-box-headline">Todavía no has publicado tu caso</h2>
              <p className="status-box-desc">
                Cuéntanos tu situación y te ayudamos a conectarte con los abogados más adecuados.
              </p>
              <button type="button" className="button button-burgundy" onClick={onCreateCase}>
                Empezar mi caso →
              </button>
            </div>
          </div>
          <div className="status-box-art">
            <img src="/intake-situation-desk.webp" alt="Expediente" className="status-art-img" />
          </div>
        </div>

        {/* Right Activity Banner */}
        <div className="landing-activity-box empty-activity-box">
          <div className="activity-box-header">
            <h3>Actividad reciente</h3>
          </div>
          <div className="empty-activity-content">
            <div className="empty-activity-icon-sq">
              <Clock size={20} />
            </div>
            <h4>Aún no tienes actividad</h4>
            <p>Tu actividad aparecerá aquí cuando comiences un caso.</p>
          </div>
        </div>
      </div>

      {/* Lawyers & Assistant Row */}
      <div className="lawyers-assistant-split-row">
        <div className="lawyers-column-content">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Abogados destacados</h3>
              <p className="section-subtitle">
                Profesionales verificados, con experiencia real en diferentes áreas del derecho.
              </p>
            </div>
            <button type="button" className="section-link-button" onClick={() => onNavigate('cases')}>
              Ver todos los abogados →
            </button>
          </div>

          <div className="lawyer-cards-grid">
            <LawyerCard
              name="Andrea Gómez"
              photo="/lawyers/valentina.png"
              rating="4.9 (27 reseñas)"
              tags={['Civil', 'Arrendamientos', 'Contratos']}
              location="Bogotá"
              price="Desde $150,000 COP"
              onAction={() => onNavigate('cases')}
            />
            <LawyerCard
              name="Carlos Restrepo"
              photo="/lawyers/camilo-restrepo.jpg"
              rating="4.8 (19 reseñas)"
              tags={['Contratos', 'Civil', 'Solución de conflictos']}
              location="Bogotá"
              price="Desde $120,000 COP"
              onAction={() => onNavigate('cases')}
            />
            <LawyerCard
              name="María Fernanda Díaz"
              photo="/lawyers/maria-fernanda.png"
              rating="4.9 (34 reseñas)"
              tags={['Vivienda', 'Arrendamientos', 'Inmobiliario']}
              location="Bogotá"
              price="Desde $180,000 COP"
              onAction={() => onNavigate('cases')}
            />
          </div>
        </div>

        <div className="assistant-column-content">
          <MatchAssistantWidget
            title="¿En qué necesitas ayuda?"
            chips={[
              '¿Cómo empiezo un caso?',
              '¿Qué documentos necesito?',
              '¿Cuánto puede costar?',
              '¿Qué abogado es mejor para mi caso?'
            ]}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </>
  );
}

/* =========================================================================================
 * OPTION 2: Borrador en progreso
 * ========================================================================================= */
function DraftStateLandingArea({
  activeDraft,
  onContinueDraft,
  onNavigate,
  onOpenChat
}: {
  activeDraft?: { title?: string; category?: string; city?: string; summary?: string } | null;
  onContinueDraft: () => void;
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
  onOpenChat?: (caseId: string, lawyerId: string) => void;
}) {
  return (
    <>
      <div className="landing-status-split-row">
        {/* Left Status Banner with 5-Step Stepper */}
        <div className="landing-status-box status-draft-stepper-box">
          <div className="status-box-main-col">
            <div className="status-badge-inline">
              <FileText size={16} className="coral-icon" />
              <span>Tienes un borrador en progreso</span>
            </div>
            <p className="status-box-desc">
              Retoma la información de tu caso y complétalo cuando quieras. Te guardamos tu avance.
            </p>

            {/* Horizontal Stepper: Situación, Detalles, Documentos, Revisión, Publicación */}
            <div className="horizontal-stepper-track">
              <div className="stepper-step completed">
                <div className="stepper-dot"><Check size={12} /></div>
                <span className="stepper-label">Situación</span>
              </div>
              <div className="stepper-line completed" />
              <div className="stepper-step completed">
                <div className="stepper-dot"><Check size={12} /></div>
                <span className="stepper-label">Detalles</span>
              </div>
              <div className="stepper-line completed" />
              <div className="stepper-step active">
                <div className="stepper-dot"><span className="inner-dot" /></div>
                <span className="stepper-label">Documentos</span>
              </div>
              <div className="stepper-line" />
              <div className="stepper-step">
                <div className="stepper-dot" />
                <span className="stepper-label">Revisión</span>
              </div>
              <div className="stepper-line" />
              <div className="stepper-step">
                <div className="stepper-dot" />
                <span className="stepper-label">Publicación</span>
              </div>
            </div>

            <div className="status-action-btns-row">
              <button type="button" className="button button-burgundy" onClick={onContinueDraft}>
                Continuar mi caso →
              </button>
              <button type="button" className="text-button text-link-quiet" onClick={onContinueDraft}>
                Ver borrador
              </button>
            </div>
          </div>
          <div className="status-box-art">
            <img src="/intake-situation-desk.webp" alt="Borrador" className="status-art-img" />
          </div>
        </div>

        {/* Right Activity Banner */}
        <div className="landing-activity-box">
          <div className="activity-box-header">
            <h3>Actividad reciente</h3>
          </div>
          <div className="activity-list-stack">
            <div className="activity-row-item">
              <div className="activity-row-icon-sq"><FolderOpen size={16} /></div>
              <div className="activity-row-text">
                <strong>Borrador guardado</strong>
                <p>Guardaste cambios en tu caso.</p>
              </div>
              <span className="activity-row-time">Hace 1 h</span>
            </div>
            <div className="activity-row-item">
              <div className="activity-row-icon-sq"><FileText size={16} /></div>
              <div className="activity-row-text">
                <strong>Documento adjuntado</strong>
                <p>Contrato_arrendamiento.pdf</p>
              </div>
              <span className="activity-row-time">Hace 3 h</span>
            </div>
            <div className="activity-row-item">
              <div className="activity-row-icon-sq"><CheckCircle2 size={16} /></div>
              <div className="activity-row-text">
                <strong>Información completada</strong>
                <p>Detalle de la situación</p>
              </div>
              <span className="activity-row-time">Hace 5 h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Lawyers & Assistant */}
      <div className="lawyers-assistant-split-row">
        <div className="lawyers-column-content">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Abogados recomendados para tu caso</h3>
              <p className="section-subtitle">
                Según la información de tu borrador, estos abogados pueden ayudarte.
              </p>
            </div>
            <button type="button" className="section-link-button" onClick={() => onNavigate('cases')}>
              Ver todos los abogados →
            </button>
          </div>

          <div className="lawyer-cards-grid">
            <LawyerCard
              name="Andrea Gómez"
              photo="/lawyers/valentina.png"
              rating="4.9 (27 reseñas)"
              tags={['Civil', 'Arrendamientos', 'Contratos']}
              location="Bogotá"
              price="Desde $150,000 COP"
              onAction={() => onNavigate('cases')}
            />
            <LawyerCard
              name="Carlos Restrepo"
              photo="/lawyers/camilo-restrepo.jpg"
              rating="4.8 (19 reseñas)"
              tags={['Contratos', 'Civil', 'Solución de conflictos']}
              location="Bogotá"
              price="Desde $120,000 COP"
              onAction={() => onNavigate('cases')}
            />
            <LawyerCard
              name="María Fernanda Díaz"
              photo="/lawyers/maria-fernanda.png"
              rating="4.9 (34 reseñas)"
              tags={['Vivienda', 'Arrendamientos', 'Inmobiliario']}
              location="Bogotá"
              price="Desde $180,000 COP"
              onAction={() => onNavigate('cases')}
            />
          </div>
        </div>

        <div className="assistant-column-content">
          <MatchAssistantWidget
            title="¿Necesitas ayuda para continuar?"
            chips={[
              '¿Qué información falta?',
              '¿Cómo describo mi caso?',
              '¿Qué documentos debo adjuntar?',
              '¿Cuándo estará listo para publicar?'
            ]}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </>
  );
}

/* =========================================================================================
 * OPTION 3: Caso publicado (recibiendo propuestas)
 * ========================================================================================= */
function PublishedStateLandingArea({
  publishedCase,
  onOpenCase,
  onNavigate,
  onOpenChat
}: {
  publishedCase: Row | null;
  onOpenCase: (caseId: string) => void;
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
  onOpenChat?: (caseId: string, lawyerId: string) => void;
}) {
  const caseTitle = publishedCase?.title || 'Incumplimiento de contrato de arrendamiento';
  const caseId = publishedCase?.id || 'case-1';

  return (
    <>
      <div className="landing-status-split-row">
        {/* Left Status Banner */}
        <div className="landing-status-box status-published-stepper-box">
          <div className="status-box-main-col">
            <span className="status-eyebrow-text">Tu caso más reciente</span>
            <div className="status-title-badge-row">
              <h2 className="status-case-name">{caseTitle}</h2>
              <span className="status-pill-green">● Publicado</span>
              <span className="status-pill-muted">3 abogados interesados</span>
            </div>

            {/* Stepper: Preparado, Publicado, Propuestas (3), Abogado elegido, En curso */}
            <div className="horizontal-stepper-track published-track">
              <div className="stepper-step completed">
                <div className="stepper-dot"><Check size={12} /></div>
                <span className="stepper-label">Preparado</span>
              </div>
              <div className="stepper-line completed" />
              <div className="stepper-step completed">
                <div className="stepper-dot"><Check size={12} /></div>
                <span className="stepper-label">Publicado</span>
              </div>
              <div className="stepper-line completed" />
              <div className="stepper-step active">
                <div className="stepper-dot-badge">3</div>
                <span className="stepper-label">Propuestas</span>
              </div>
              <div className="stepper-line" />
              <div className="stepper-step">
                <div className="stepper-dot" />
                <span className="stepper-label">Abogado elegido</span>
              </div>
              <div className="stepper-line" />
              <div className="stepper-step">
                <div className="stepper-dot" />
                <span className="stepper-label">En curso</span>
              </div>
            </div>

            <button type="button" className="button button-burgundy" onClick={() => onOpenCase(caseId)}>
              Ver mi caso →
            </button>
          </div>
        </div>

        {/* Right Activity Banner */}
        <div className="landing-activity-box">
          <div className="activity-box-header">
            <h3>Actividad reciente</h3>
          </div>
          <div className="activity-list-stack">
            <div className="activity-row-item">
              <div className="activity-row-icon-sq green-tint"><Users size={16} /></div>
              <div className="activity-row-text">
                <strong>1 propuesta nueva</strong>
                <p>Andrea Gómez envió una propuesta. Conócela y revísala.</p>
              </div>
              <span className="activity-row-time">Hace 2 h</span>
            </div>
            <div className="activity-row-item">
              <div className="activity-row-icon-sq"><FileText size={16} /></div>
              <div className="activity-row-text">
                <strong>Solicitud de documentos</strong>
                <p>Carlos Restrepo solicitó acceso a Contrato.pdf</p>
              </div>
              <span className="activity-row-time">Hace 4 h</span>
            </div>
            <div className="activity-row-item">
              <div className="activity-row-icon-sq"><Eye size={16} /></div>
              <div className="activity-row-text">
                <strong>Tu caso fue revisado</strong>
                <p>2 abogados más revisaron tu caso.</p>
              </div>
              <span className="activity-row-time">Hace 6 h</span>
            </div>
            <div className="activity-row-item">
              <div className="activity-row-icon-sq red-tint"><MessageCircle size={16} /></div>
              <div className="activity-row-text">
                <strong>Mensaje nuevo</strong>
                <p>María Fernanda te envió un mensaje.</p>
              </div>
              <span className="activity-row-time">Hace 15 h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Lawyers & Assistant */}
      <div className="lawyers-assistant-split-row">
        <div className="lawyers-column-content">
          <div className="section-header-row">
            <div>
              <h3 className="section-title">Abogados recomendados para tu caso</h3>
            </div>
            <button type="button" className="section-link-button" onClick={() => onNavigate('cases')}>
              Ver todos los abogados →
            </button>
          </div>

          <div className="lawyer-cards-grid">
            <LawyerCardWithActions
              name="Andrea Gómez"
              photo="/lawyers/valentina.png"
              rating="4.9 (27 reseñas)"
              tags={['Civil', 'Arrendamientos', 'Contratos']}
              location="Bogotá"
              price="Desde $150,000 COP"
              onViewProfile={() => onOpenCase(caseId)}
              onContact={() => onOpenChat ? onOpenChat(caseId, 'andrea') : onOpenCase(caseId)}
            />
            <LawyerCardWithActions
              name="Carlos Restrepo"
              photo="/lawyers/camilo-restrepo.jpg"
              rating="4.8 (19 reseñas)"
              tags={['Contratos', 'Civil', 'Solución de conflictos']}
              location="Bogotá"
              price="Desde $120,000 COP"
              onViewProfile={() => onOpenCase(caseId)}
              onContact={() => onOpenChat ? onOpenChat(caseId, 'carlos') : onOpenCase(caseId)}
            />
            <LawyerCardWithActions
              name="María Fernanda Díaz"
              photo="/lawyers/maria-fernanda.png"
              rating="4.9 (34 reseñas)"
              tags={['Vivienda', 'Arrendamientos', 'Inmobiliario']}
              location="Bogotá"
              price="Desde $180,000 COP"
              onViewProfile={() => onOpenCase(caseId)}
              onContact={() => onOpenChat ? onOpenChat(caseId, 'maria') : onOpenCase(caseId)}
            />
          </div>
        </div>

        <div className="assistant-column-content">
          <MatchAssistantWidget
            title="¿Tienes propuestas por revisar?"
            subtitle="Te ayudo a comparar propuestas, entender los honorarios y elegir con calma."
            chips={[
              '¿Cómo comparo las propuestas?',
              '¿Qué debo tener en cuenta?',
              '¿Puedo negociar el precio?',
              '¿Qué sigue después de elegir?'
            ]}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </>
  );
}

/* =========================================================================================
 * OPTION 4: Caso en curso (abogado elegido)
 * ========================================================================================= */
function InProgressStateLandingArea({
  inProgressCase,
  onOpenCase,
  onNavigate,
  onOpenChat
}: {
  inProgressCase: Row | null;
  onOpenCase: (caseId: string) => void;
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
  onOpenChat?: (caseId: string, lawyerId: string) => void;
}) {
  const caseTitle = inProgressCase?.title || 'Incumplimiento de contrato de arrendamiento';
  const caseId = inProgressCase?.id || 'case-active';

  return (
    <>
      {/* Top Banner: Tu caso en curso with full-width Stepper */}
      <div className="landing-status-box in-progress-full-card">
        <div className="in-progress-header-row">
          <div>
            <span className="status-eyebrow-text">Tu caso en curso</span>
            <h2 className="status-case-name">{caseTitle}</h2>
            <p className="status-assigned-sub">Abogado asignado: Andrea Gómez</p>
          </div>
          <button type="button" className="button button-burgundy" onClick={() => onOpenCase(caseId)}>
            Ver avance del caso →
          </button>
        </div>

        {/* Stepper to En curso */}
        <div className="horizontal-stepper-track in-progress-track">
          <div className="stepper-step completed">
            <div className="stepper-dot"><Check size={12} /></div>
            <span className="stepper-label">Preparado</span>
          </div>
          <div className="stepper-line completed" />
          <div className="stepper-step completed">
            <div className="stepper-dot"><Check size={12} /></div>
            <span className="stepper-label">Publicado</span>
          </div>
          <div className="stepper-line completed" />
          <div className="stepper-step completed">
            <div className="stepper-dot"><Check size={12} /></div>
            <span className="stepper-label">Propuestas</span>
          </div>
          <div className="stepper-line completed" />
          <div className="stepper-step completed">
            <div className="stepper-dot"><Check size={12} /></div>
            <span className="stepper-label">Abogado elegido</span>
          </div>
          <div className="stepper-line completed" />
          <div className="stepper-step active in-progress-node">
            <div className="stepper-dot"><span className="inner-dot" /></div>
            <span className="stepper-label">En curso</span>
          </div>
        </div>
      </div>

      {/* 3-Column Split: Lawyer & Checklist | Documents | Activity & Assistant */}
      <div className="in-progress-details-grid">
        {/* Left Column: Assigned Lawyer + Próximos Pasos */}
        <div className="details-col left-details-col">
          <div className="dashboard-panel-card lawyer-assigned-panel">
            <h3 className="panel-title">Tu abogado asignado</h3>
            <div className="assigned-lawyer-card-box">
              <img src="/lawyers/valentina.png" alt="Andrea Gómez" className="lawyer-avatar-img" />
              <div className="assigned-lawyer-text">
                <div className="lawyer-name-row">
                  <h4>Andrea Gómez</h4>
                  <span className="pill-en-curso">✓ En curso</span>
                </div>
                <div className="lawyer-rating-row">
                  <Star size={13} className="star-gold" />
                  <span>4.9 (27 reseñas)</span>
                </div>
                <p className="lawyer-specialties-txt">Civil · Arrendamientos · Contratos</p>
              </div>
            </div>

            <div className="assigned-actions-row">
              <button
                type="button"
                className="button outline small"
                onClick={() => onOpenChat ? onOpenChat(caseId, 'andrea') : onNavigate('messages')}
              >
                Enviar mensaje
              </button>
              <button type="button" className="button outline small" onClick={() => onOpenCase(caseId)}>
                Ver perfil
              </button>
              <button type="button" className="button outline small" onClick={() => onOpenCase(caseId)}>
                Agendar reunión
              </button>
            </div>
          </div>

          <div className="dashboard-panel-card next-steps-panel">
            <h3 className="panel-title">Próximos pasos</h3>
            <div className="checklist-stack">
              <div className="checklist-row">
                <div className="check-bullet red-bullet" />
                <span className="checklist-item-title">Enviar comprobante de pago</span>
                <span className="badge-status-coral">Pendiente</span>
                <span className="checklist-date">Antes del 15 oct</span>
              </div>
              <div className="checklist-row">
                <div className="check-bullet gray-bullet" />
                <span className="checklist-item-title">Revisar y aprobar demanda</span>
                <span className="badge-status-gray">En revisión</span>
                <span className="checklist-date">Estimado: 15 oct</span>
              </div>
              <div className="checklist-row">
                <div className="check-bullet blue-bullet" />
                <span className="checklist-item-title">Reunión de seguimiento</span>
                <span className="badge-status-blue">Programada</span>
                <span className="checklist-date">10 oct, 3:00 p.m.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Documentos del caso */}
        <div className="details-col middle-details-col">
          <div className="dashboard-panel-card case-documents-panel">
            <div className="panel-header-with-link">
              <h3 className="panel-title">Documentos del caso</h3>
              <button type="button" className="text-button" onClick={() => onOpenCase(caseId)}>
                Ver todos →
              </button>
            </div>

            <div className="documents-list-stack">
              <div className="document-entry-row">
                <FileText size={16} className="doc-icon" />
                <span className="doc-filename">Contrato de arrendamiento.pdf</span>
                <span className="badge-status-green">Aprobado</span>
              </div>
              <div className="document-entry-row">
                <FileText size={16} className="doc-icon" />
                <span className="doc-filename">Comprobante de pago.pdf</span>
                <span className="badge-status-orange">Pendiente</span>
              </div>
              <div className="document-entry-row">
                <FileText size={16} className="doc-icon" />
                <span className="doc-filename">Poder firmado.pdf</span>
                <span className="badge-status-orange">Pendiente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actividad reciente + MatchAsistente */}
        <div className="details-col right-details-col">
          <div className="landing-activity-box in-progress-activity">
            <div className="activity-box-header">
              <h3>Actividad reciente</h3>
            </div>
            <div className="activity-list-stack">
              <div className="activity-row-item">
                <div className="activity-row-icon-sq red-tint"><MessageCircle size={16} /></div>
                <div className="activity-row-text">
                  <strong>Nuevo mensaje</strong>
                  <p>Andrea Gómez te envió un mensaje.</p>
                </div>
                <span className="activity-row-time">Hace 1 h</span>
              </div>
              <div className="activity-row-item">
                <div className="activity-row-icon-sq"><FileText size={16} /></div>
                <div className="activity-row-text">
                  <strong>Documento solicitado</strong>
                  <p>Lista de documentos requeridos</p>
                </div>
                <span className="activity-row-time">Hace 3 h</span>
              </div>
              <div className="activity-row-item">
                <div className="activity-row-icon-sq"><CheckCircle2 size={16} /></div>
                <div className="activity-row-text">
                  <strong>Documento enviado</strong>
                  <p>Comprobante de pago.pdf</p>
                </div>
                <span className="activity-row-time">Hace 1 día</span>
              </div>
              <div className="activity-row-item">
                <div className="activity-row-icon-sq"><Calendar size={16} /></div>
                <div className="activity-row-text">
                  <strong>Próxima cita</strong>
                  <p>Reunión virtual · 10 oct, 3:00 p.m.</p>
                </div>
                <span className="activity-row-time">Hace 1 día</span>
              </div>
            </div>
          </div>

          <MatchAssistantWidget
            title="¿En qué te puedo apoyar hoy?"
            chips={[
              '¿Qué sigue en mi caso?',
              '¿Qué documentos faltan?',
              '¿Cómo va el proceso?',
              '¿Puedo solicitar algo más al abogado?'
            ]}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </>
  );
}

/* =========================================================================================
 * HELPER COMPONENTS: LawyerCard, MatchAssistantWidget, DashboardSkeleton
 * ========================================================================================= */
function LawyerCard({
  name,
  photo,
  rating,
  tags,
  location,
  price,
  onAction
}: {
  name: string;
  photo: string;
  rating: string;
  tags: string[];
  location: string;
  price: string;
  onAction: () => void;
}) {
  return (
    <div className="lawyer-profile-card">
      <div className="lawyer-card-top">
        <img src={photo} alt={name} className="lawyer-photo-circle" />
        <div className="lawyer-title-info">
          <div className="lawyer-name-verified">
            <h4>{name}</h4>
            <span className="verified-pill">✓ Verificado</span>
          </div>
          <div className="rating-row">
            <Star size={13} className="star-gold" />
            <span>{rating}</span>
          </div>
        </div>
      </div>

      <div className="lawyer-tags-row">
        {tags.map((t) => (
          <span key={t} className="lawyer-spec-tag">{t}</span>
        ))}
      </div>

      <div className="lawyer-footer-row">
        <span className="lawyer-city">📍 {location}</span>
        <span className="lawyer-price">{price}</span>
      </div>
    </div>
  );
}

function LawyerCardWithActions({
  name,
  photo,
  rating,
  tags,
  location,
  price,
  onViewProfile,
  onContact
}: {
  name: string;
  photo: string;
  rating: string;
  tags: string[];
  location: string;
  price: string;
  onViewProfile: () => void;
  onContact: () => void;
}) {
  return (
    <div className="lawyer-profile-card has-actions">
      <div className="lawyer-card-top">
        <img src={photo} alt={name} className="lawyer-photo-circle" />
        <div className="lawyer-title-info">
          <div className="lawyer-name-verified">
            <h4>{name}</h4>
            <span className="verified-pill">✓ Verificado</span>
          </div>
          <div className="rating-row">
            <Star size={13} className="star-gold" />
            <span>{rating}</span>
          </div>
        </div>
      </div>

      <div className="lawyer-tags-row">
        {tags.map((t) => (
          <span key={t} className="lawyer-spec-tag">{t}</span>
        ))}
      </div>

      <div className="lawyer-footer-row">
        <span className="lawyer-city">📍 {location}</span>
        <span className="lawyer-price">{price}</span>
      </div>

      <div className="lawyer-actions-btns">
        <button type="button" className="button button-burgundy small full-width-btn" onClick={onViewProfile}>
          Ver perfil
        </button>
        <button type="button" className="button outline small full-width-btn" onClick={onContact}>
          Contactar
        </button>
      </div>
    </div>
  );
}

function MatchAssistantWidget({
  title,
  subtitle,
  chips,
  onNavigate
}: {
  title: string;
  subtitle?: string;
  chips: string[];
  onNavigate: (view: 'welcome' | 'messages' | 'cases' | 'documents' | 'profile') => void;
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleChipClick = (c: string) => {
    setQuestion(c);
    if (c.includes('empiezo') || c.includes('falta')) {
      setAnswer('Para iniciar o continuar, solo ingresa a tu caso y responde las preguntas guía.');
    } else if (c.includes('documentos')) {
      setAnswer('Adjuntar documentos es opcional, pero puedes incluir contratos o comunicaciones clave.');
    } else if (c.includes('costar') || c.includes('precio')) {
      setAnswer('Los honorarios se pactan libremente con el abogado según el alcance acordado.');
    } else {
      setAnswer('Puedes comparar los perfiles de los abogados y agendar una llamada inicial.');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      setAnswer('Gracias por tu consulta. Puedes conversar directamente con los abogados o en tu caso.');
    }
  };

  return (
    <div className="match-assistant-card" aria-label="Asistente de MatchJurídico">
      <div className="assistant-header-row">
        <div className="assistant-brand-badge">
          <Sparkles size={16} className="coral-icon" />
          <span className="assistant-name">MatchAsistente</span>
          <span className="beta-badge">Beta</span>
        </div>
      </div>

      <h4 className="assistant-title">{title}</h4>
      {subtitle && <p className="assistant-sub">{subtitle}</p>}

      <div className="assistant-chips-stack">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            className="assistant-prompt-pill"
            onClick={() => handleChipClick(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {answer && (
        <div className="assistant-answer-bubble">
          <p>{answer}</p>
        </div>
      )}

      <form className="assistant-input-form" onSubmit={handleSend}>
        <input
          type="text"
          className="assistant-text-input"
          placeholder="Escribe tu pregunta..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="assistant-send-btn" aria-label="Enviar pregunta">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

/* =========================================================================================
 * SKELETON: Anti-Flicker Skeleton matching Hero & Layout
 * ========================================================================================= */
export function DashboardSkeleton() {
  return (
    <div className="client-landing-root dashboard-skeleton-root" aria-busy="true" aria-label="Cargando espacio">
      {/* Skeleton Hero Banner */}
      <div className="skeleton-hero-banner" />

      {/* Skeleton Status Split */}
      <div className="landing-status-split-row">
        <div className="skeleton-status-box" />
        <div className="skeleton-activity-box" />
      </div>

      {/* Skeleton Lawyers & Assistant */}
      <div className="lawyers-assistant-split-row">
        <div className="skeleton-lawyers-col" />
        <div className="skeleton-assistant-box" />
      </div>
    </div>
  );
}
