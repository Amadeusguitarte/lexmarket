'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Bookmark,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  Inbox,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Send,
  X,
  FileCheck2,
} from 'lucide-react';
import LawyerSidebar from './LawyerSidebar';
import Toast from './Toast';
import {
  calculateProfileProgress,
  getFirstIncompleteStep,
  getPendingSteps,
  getLawyerProfileState,
  LAWYER_STEPS,
  type LawyerProfileData,
} from '@/lib/lawyer-profile';

export interface LawyerHomeDashboardProps {
  initialLawyerName?: string;
  lawyerName?: string;
  initialAvatar?: string;
  avatarUrl?: string;
  initialProfile?: any;
  profile?: any;
  initialCases?: any[];
  cases?: any[];
  onNavigate?: (route: string) => void;
  onOpenCase?: (caseId: string) => void;
  onGoToProfile?: (step?: number) => void;
  onLogout?: () => void;
  unreadMessages?: number;
}

interface CaseItem {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  city: string;
  modality?: string;
  published_at?: string;
  budget_cop?: string;
  urgency?: 'alta' | 'media' | 'normal';
  proposals_count?: number;
  summary?: string;
  is_curated?: boolean;
}

interface ProposalItem {
  id: string;
  case_id: string;
  case_title: string;
  status: 'sent' | 'viewed' | 'replied' | 'in_conversation' | 'accepted' | 'rejected' | 'pending';
  amount?: string;
  submitted_at: string;
  note?: string;
}

interface ActiveCaseItem {
  id: string;
  title: string;
  client_name: string;
  status: string;
  next_action: string;
  pending_messages: number;
  pending_docs: number;
  next_date?: string;
}

interface ActivityEvent {
  id: string;
  title: string;
  desc?: string;
  time: string;
  type: 'proposal_view' | 'message' | 'new_case' | 'proposal_accepted' | 'review' | 'system';
  target_route?: string;
  target_id?: string;
}

function getInitials(name?: string) {
  if (!name || name === 'Abogado' || name.trim() === '') return 'AB';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const CURATED_CASES_FALLBACK: CaseItem[] = [
  {
    id: 'curated-civil-1',
    title: 'Incumplimiento de contrato de arrendamiento comercial',
    category: 'Derecho Civil',
    subcategory: 'Arrendamientos y restitución',
    city: 'Bogotá, D.C.',
    modality: 'Remoto',
    published_at: 'Hace 34 min',
    budget_cop: '$800.000 – $1.200.000 COP',
    urgency: 'media',
    proposals_count: 2,
    summary: 'Arrendador busca representación para proceso de restitución de inmueble comercial por mora de 3 cánones y restitución de servicios públicos.',
    is_curated: true,
  },
  {
    id: 'curated-laboral-1',
    title: 'Despido injustificado y liquidación laboral ejecutiva',
    category: 'Derecho Laboral',
    subcategory: 'Indemnizaciones y fueros',
    city: 'Medellín, Antioquia',
    modality: 'Híbrido',
    published_at: 'Hace 1 hora',
    budget_cop: '$1.500.000 – $2.200.000 COP',
    urgency: 'alta',
    proposals_count: 1,
    summary: 'Colaborador con 5 años de antigüedad despedido sin justa causa legal comprobable. Cuenta con soportes contables y comunicaciones.',
    is_curated: true,
  },
  {
    id: 'curated-comercial-1',
    title: 'Disolución societaria y partición de activos SAS',
    category: 'Derecho Comercial',
    subcategory: 'Corporativo y societario',
    city: 'Cali, Valle del Cauca',
    modality: 'Presencial',
    published_at: 'Hace 3 horas',
    budget_cop: '$2.500.000 – $4.000.000 COP',
    urgency: 'normal',
    proposals_count: 3,
    summary: 'Diferencia patrimonial entre 2 socios con participación paritaria (50/50) sobre inventario de maquinaria y patentes.',
    is_curated: true,
  },
  {
    id: 'curated-tributario-1',
    title: 'Defensa en pliego de cargos sancionatorio DIAN',
    category: 'Derecho Tributario',
    subcategory: 'Fiscal y aduanero',
    city: 'Remoto nacional',
    modality: 'Remoto',
    published_at: 'Hace 5 horas',
    budget_cop: '$1.800.000 – $3.000.000 COP',
    urgency: 'alta',
    proposals_count: 0,
    summary: 'Notificación de emplazamiento para corregir declaración de IVA año gravable 2023 con presunta inexactitud en compras exentas.',
    is_curated: true,
  },
];

export default function LawyerHomeDashboard(props: LawyerHomeDashboardProps) {
  const {
    initialLawyerName = '',
    lawyerName: propLawyerName,
    initialAvatar = '',
    avatarUrl: propAvatarUrl,
    initialProfile,
    profile: propProfile,
    initialCases,
    cases: propCases,
    onNavigate,
    onOpenCase,
    onGoToProfile,
    onLogout,
    unreadMessages = 0,
  } = props;

  const resolvedInitialProfile = propProfile || initialProfile || {};
  const [profile, setProfile] = useState<LawyerProfileData>(() => resolvedInitialProfile);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [loadingCases, setLoadingCases] = useState(false);
  const [cases, setCases] = useState<CaseItem[]>(() => {
    if (propCases && Array.isArray(propCases) && propCases.length > 0) return propCases;
    if (initialCases && Array.isArray(initialCases) && initialCases.length > 0) return initialCases;
    return CURATED_CASES_FALLBACK;
  });
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [activeCases, setActiveCases] = useState<ActiveCaseItem[]>([]);
  const [savedCases, setSavedCases] = useState<Set<string>>(() => new Set());
  const [assistantModalOpen, setAssistantModalOpen] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantHistory, setAssistantHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [blockedCaseTarget, setBlockedCaseTarget] = useState<CaseItem | null>(null);

  // Sync profile if initialProfile or propProfile changes
  useEffect(() => {
    if (propProfile || initialProfile) {
      setProfile(propProfile || initialProfile);
    }
  }, [propProfile, initialProfile]);

  const lawyerName =
    propLawyerName ||
    (profile.name && profile.name !== 'Juan Pérez' && profile.name !== 'Abogado' ? profile.name : undefined) ||
    (initialLawyerName && initialLawyerName !== 'Juan Pérez' && initialLawyerName !== 'Abogado' ? initialLawyerName : undefined) ||
    'Abogado';

  const avatarUrl = propAvatarUrl || profile.avatar_url || initialAvatar || '';
  const firstName = lawyerName.split(' ')[0] || 'Abogado';

  // Profile calculations
  const progress = calculateProfileProgress(profile);
  const profileState = getLawyerProfileState(profile);
  const isVerified = profileState === 'PROFILE_VERIFIED' || profileState === 'verified' || profile.verification === 'verified';
  const pendingSteps = getPendingSteps(profile);
  const firstIncomplete = getFirstIncompleteStep(profile);

  // Load cases and proposals from backend
  useEffect(() => {
    let active = true;
    setLoadingCases(true);

    // Fetch marketplace listings
    fetch('/api/marketplace')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('no listings'))))
      .then((data) => {
        if (!active) return;
        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          const mapped: CaseItem[] = data.items.slice(0, 8).map((it: any) => ({
            id: it.id,
            title: it.title || 'Asunto legal sin título',
            category: it.category || 'General',
            subcategory: it.subcategory || it.sub_category || 'Consulta legal',
            city: it.city || 'Colombia',
            modality: it.modality || (it.city?.toLowerCase().includes('remoto') ? 'Remoto' : 'Híbrido'),
            published_at: it.created_at ? new Date(it.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : 'Reciente',
            budget_cop: it.budget || it.budget_range || (it.min_rate ? `$${it.min_rate} COP` : 'A convenir'),
            urgency: it.urgency || 'normal',
            proposals_count: typeof it.proposals_count === 'number' ? it.proposals_count : 0,
            summary: it.summary || it.description || '',
            is_curated: false,
          }));
          setCases(mapped);
        } else {
          setCases(CURATED_CASES_FALLBACK);
        }
      })
      .catch(() => {
        if (active) setCases(CURATED_CASES_FALLBACK);
      })
      .finally(() => {
        if (active) setLoadingCases(false);
      });

    // Fetch proposals
    fetch('/api/proposals')
      .then((res) => (res.ok ? res.json() : Promise.resolve({ items: [] })))
      .then((data) => {
        if (!active) return;
        if (data?.items && Array.isArray(data.items)) {
          const mappedProposals: ProposalItem[] = data.items.map((it: any) => ({
            id: it.id,
            case_id: it.case_id,
            case_title: it.case?.title || 'Asunto legal',
            status: it.status || 'sent',
            amount: it.amount || it.fee,
            submitted_at: it.created_at ? new Date(it.created_at).toLocaleDateString('es-CO') : 'Reciente',
            note: it.message || it.summary,
          }));
          setProposals(mappedProposals);
        }
      })
      .catch(() => {});

    // Fetch hired active cases
    fetch('/api/cases')
      .then((res) => (res.ok ? res.json() : Promise.resolve({ items: [] })))
      .then((data) => {
        if (!active) return;
        if (data?.items && Array.isArray(data.items)) {
          const activeHired = data.items
            .filter((c: any) => c.status === 'hired' || c.status === 'in_progress' || c.status === 'accepted')
            .map((c: any) => ({
              id: c.id,
              title: c.title,
              client_name: c.client_name || 'Cliente particular',
              status: 'En curso',
              next_action: c.next_action || 'Revisar documentación aportada',
              pending_messages: c.unread_messages || 0,
              pending_docs: c.new_docs || 0,
              next_date: c.deadline || 'Sin fecha límite inmediata',
            }));
          setActiveCases(activeHired);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Filter cases by search query and intelligent matching
  const hasSpecialties = Array.isArray(profile.specialties) && profile.specialties.length > 0;
  const filteredCases = cases.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query) ||
      (c.subcategory && c.subcategory.toLowerCase().includes(query)) ||
      c.city.toLowerCase().includes(query)
    );
  });

  // Sort: prioritize specialties if lawyer has them configured
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (!hasSpecialties) return 0;
    const aMatch = profile.specialties!.some((s: string) =>
      a.category.toLowerCase().includes(s.toLowerCase()) ||
      (a.subcategory && a.subcategory.toLowerCase().includes(s.toLowerCase()))
    );
    const bMatch = profile.specialties!.some((s: string) =>
      b.category.toLowerCase().includes(s.toLowerCase()) ||
      (b.subcategory && b.subcategory.toLowerCase().includes(s.toLowerCase()))
    );
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  // Recent activity sample events
  const activityEvents: ActivityEvent[] = [
    {
      id: 'act-1',
      title: 'Nuevo caso en tu área',
      desc: 'Incumplimiento de contrato de arrendamiento en Bogotá',
      time: 'Hace 34 min',
      type: 'new_case',
      target_route: 'casos',
    },
    {
      id: 'act-2',
      title: 'Oportunidad recomendada',
      desc: 'Despido injustificado en Medellín disponible para propuesta',
      time: 'Hace 1 hora',
      type: 'new_case',
      target_route: 'casos',
    },
    {
      id: 'act-3',
      title: 'Verificación de credenciales',
      desc: profile.verification === 'verified'
        ? 'Tarjeta profesional CSJ validada ante el Consejo Superior'
        : 'Sube tu tarjeta profesional para activar propuestas ilimitadas',
      time: 'Hoy',
      type: 'system',
      target_route: 'perfil',
    },
  ];

  // Proposal Status Pill Helper
  const renderProposalStatus = (status: ProposalItem['status']) => {
    switch (status) {
      case 'accepted':
        return <span className="proposal-status-pill accepted">✓ Aceptada</span>;
      case 'in_conversation':
        return <span className="proposal-status-pill conversation">En conversación</span>;
      case 'replied':
        return <span className="proposal-status-pill replied">Cliente respondió</span>;
      case 'viewed':
        return <span className="proposal-status-pill viewed">Vista por el cliente</span>;
      case 'rejected':
        return <span className="proposal-status-pill rejected">No seleccionada</span>;
      case 'sent':
      default:
        return <span className="proposal-status-pill sent">Enviada</span>;
    }
  };

  const handleOpenCase = (c: CaseItem) => {
    if (onOpenCase) {
      onOpenCase(c.id);
    } else {
      onNavigate?.('casos');
    }
  };

  const handleAttemptProposal = (c: CaseItem) => {
    if (profile.verification === 'verified') {
      if (onOpenCase) onOpenCase(c.id);
      else onNavigate?.('casos');
      return;
    }
    // Blocked: Show Verification Guard Modal
    setBlockedCaseTarget(c);
    setVerificationModalOpen(true);
  };

  const handleProceedToProfileFromModal = () => {
    if (blockedCaseTarget) {
      try {
        localStorage.setItem('lexmarket.returnToCaseId', blockedCaseTarget.id);
      } catch {}
    }
    setVerificationModalOpen(false);
    if (onGoToProfile) {
      onGoToProfile(firstIncomplete);
    } else {
      onNavigate?.('perfil');
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setToastMessage('Caso retirado de guardados');
      } else {
        next.add(id);
        setToastMessage('Caso guardado en tus favoritos');
      }
      return next;
    });
  };

  // MatchAsistente Real Contextual Query
  const handleAssistantQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    setAssistantPrompt(trimmed);
    setAssistantInput('');
    setAssistantModalOpen(true);
    setAssistantBusy(true);

    const updatedHistory = [...assistantHistory, { role: 'user' as const, content: trimmed }];
    setAssistantHistory(updatedHistory);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          history: assistantHistory.slice(-6),
          context: {
            role: 'lawyer',
            lawyerName,
            lawyerSpecialties: profile?.specialties || [],
            pendingMessages: unreadMessages,
            caseTitle: cases[0]?.title,
            caseCategory: cases[0]?.category,
            caseSummary: cases[0]?.summary,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Error al conectar con MatchAsistente');
      }

      const data = await res.json();
      const reply = data.reply || 'Sin respuesta disponible en este momento.';
      setAssistantResponse(reply);
      setAssistantHistory([...updatedHistory, { role: 'assistant' as const, content: reply }]);
    } catch {
      const fallbackMsg = 'Hubo una dificultad de conexión con MatchAsistente. Intenta de nuevo en unos segundos.';
      setAssistantResponse(fallbackMsg);
      setAssistantHistory([...updatedHistory, { role: 'assistant' as const, content: fallbackMsg }]);
    } finally {
      setAssistantBusy(false);
    }
  };

  return (
    <div className="lawyer-dashboard-shell">
      {/* Toast Notification */}
      <Toast
        className="lawyer-dash-toast"
        message={toastMessage}
        duration={3200}
        onClose={() => setToastMessage('')}
        portal={false}
      />

      {/* Sidebar */}
      <LawyerSidebar
        activeMenu="inicio"
        unreadMessages={unreadMessages}
        onNavigate={(route) => {
          if (route === 'inicio') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (route === 'perfil') {
            if (onGoToProfile) onGoToProfile(firstIncomplete);
            else onNavigate?.('perfil');
          } else {
            onNavigate?.(route);
          }
        }}
        isAdmin={Boolean(profile.admin)}
        onHelp={() => onNavigate?.('help')}
      />

      {/* Main Container */}
      <div className="lawyer-dash-main-area">
        {/* Topbar */}
        <header className="lawyer-dash-topbar">
          <div className="lawyer-search-box">
            <Search size={18} className="lawyer-search-icon" />
            <input
              type="text"
              placeholder="Buscar casos, áreas de práctica, ciudades o palabras clave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lawyer-search-input"
            />
          </div>

          <div className="lawyer-topbar-right">
            <button
              type="button"
              className="lawyer-bell-btn"
              aria-label="Notificaciones"
              onClick={() => setToastMessage('No tienes notificaciones pendientes')}
            >
              <Bell size={20} strokeWidth={1.9} />
              {unreadMessages > 0 && <span className="lawyer-bell-badge">{unreadMessages}</span>}
            </button>

            <div
              className="lawyer-user-profile-menu"
              onClick={() => {
                if (onGoToProfile) onGoToProfile(firstIncomplete);
                else onNavigate?.('perfil');
              }}
              title="Ir a tu perfil profesional"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={lawyerName} className="lawyer-avatar-circle" />
              ) : (
                <div className="lawyer-avatar-circle lawyer-avatar-fallback">
                  {getInitials(lawyerName)}
                </div>
              )}
              <div className="lawyer-user-names">
                <span className="lawyer-user-fullname">{lawyerName}</span>
                <span className="lawyer-user-role-label">
                  {profile.verification === 'verified' ? 'Abogado verificado' : 'Abogado'}
                </span>
              </div>
              <ChevronDown size={16} className="lawyer-chevron-icon" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="lawyer-dash-content">
          {/* Adaptive Hero Greeting */}
          <section className="lawyer-welcome-hero">
            <h1 className="lawyer-welcome-title dashboard-greeting-title">
              Hola, {firstName}.
            </h1>
            <p className="lawyer-welcome-desc">
              {profileState === 'PROFILE_VERIFIED' || profileState === 'verified'
                ? 'Esto está pasando hoy en tu práctica. Explora las oportunidades disponibles y gestiona tus clientes.'
                : 'Hay oportunidades esperando por profesionales como tú. Completa tu perfil profesional para enviar propuestas y conectar con clientes.'}
            </p>
          </section>

          {/* Compact Profile Status Module (~20-25% of height) */}
          {profileState === 'PROFILE_VERIFIED' || profileState === 'verified' ? (
            <div className="lawyer-profile-compact-banner verified-state">
              <div className="banner-left">
                <div className="verified-badge-icon">
                  <CheckCircle2 size={22} className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="banner-title flex items-center gap-2">
                    ✓ Perfil verificado
                    <span className="verified-tag">✓ Habilitado</span>
                  </h3>
                  <p className="banner-subtitle">
                    Disponible para recibir nuevos casos. Tu tarjeta profesional CSJ está validada y estás habilitado para enviar propuestas ilimitadas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="banner-cta-btn secondary"
                onClick={() => {
                  if (onGoToProfile) onGoToProfile(1);
                  else onNavigate?.('perfil');
                }}
              >
                Ver mi perfil →
              </button>
            </div>
          ) : profileState === 'submitted' ? (
            <div className="lawyer-profile-compact-banner submitted-state">
              <div className="banner-left">
                <div className="submitted-badge-icon">
                  <Clock size={22} className="text-amber-700" />
                </div>
                <div>
                  <h3 className="banner-title flex items-center gap-2">
                    Tu perfil está siendo verificado
                    <span className="submitted-tag">En proceso</span>
                  </h3>
                  <p className="banner-subtitle">
                    Hemos recibido tu información y tarjeta profesional. Te avisaremos apenas nuestro equipo culmine la validación ante el CSJ.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="banner-cta-btn secondary"
                onClick={() => {
                  if (onGoToProfile) onGoToProfile(6);
                  else onNavigate?.('perfil');
                }}
              >
                Consultar estado →
              </button>
            </div>
          ) : (
            <div className="lawyer-profile-compact-banner in-progress-state">
              <div className="banner-top-row">
                <div className="banner-info">
                  <div className="banner-title-row">
                    <h3 className="banner-title">Completa tu perfil profesional</h3>
                    <span className="banner-progress-pill">{progress}% completado</span>
                  </div>
                  <p className="banner-subtitle">
                    Completa tu experiencia, áreas de práctica y verificación para poder enviar propuestas y conectar con clientes.
                  </p>
                </div>

                <button
                  type="button"
                  className="banner-cta-btn primary"
                  onClick={() => {
                    if (onGoToProfile) onGoToProfile(firstIncomplete);
                    else onNavigate?.('perfil');
                  }}
                >
                  {progress <= 15 ? 'Comenzar perfil →' : 'Continuar perfil →'}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="banner-progress-bar-track">
                <div
                  className="banner-progress-bar-fill"
                  style={{ width: `${Math.max(12, progress)}%` }}
                />
              </div>

              {/* Pending Steps Row */}
              <div className="banner-pending-steps-row">
                <span className="pending-steps-label">
                  {pendingSteps.length > 0
                    ? `${pendingSteps.length} paso${pendingSteps.length > 1 ? 's' : ''} pendiente${pendingSteps.length > 1 ? 's' : ''}:`
                    : 'Pasos finalizados:'}
                </span>
                <div className="pending-steps-chips">
                  {pendingSteps.map((step, idx) => (
                    <button
                      key={step.num}
                      type="button"
                      className="pending-step-chip"
                      onClick={() => {
                        if (onGoToProfile) onGoToProfile(step.num);
                        else onNavigate?.('perfil');
                      }}
                    >
                      <span>{step.short}</span>
                      {idx < pendingSteps.length - 1 && <span className="chip-dot">·</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Responsive Dashboard Layout */}
          <div className="lawyer-dashboard-content-grid">
            {/* Main Editorial Column */}
            <div className="lawyer-main-column">
              {/* SECTION: CASOS QUE ENCAJAN CONTIGO */}
              <section className="dashboard-editorial-section">
                <div className="editorial-section-header">
                  <div>
                    <h2 className="editorial-section-title">
                      {isVerified
                        ? 'Casos que encajan contigo'
                        : hasSpecialties
                        ? 'Casos en tus áreas de práctica'
                        : 'Casos recientes'}
                    </h2>
                    <p className="editorial-section-subtitle">
                      {isVerified
                        ? 'Oportunidades seleccionadas según tus áreas de práctica, modalidad y ubicación.'
                        : hasSpecialties
                        ? 'Oportunidades correspondientes a las especialidades que seleccionaste.'
                        : 'Oportunidades legales activas recientemente publicadas por clientes en Colombia.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="editorial-see-all-btn"
                    onClick={() => onNavigate?.('casos')}
                  >
                    <span>Explorar todos</span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                {/* Editorial List of Cases */}
                <div className="editorial-cases-list">
                  {sortedCases.slice(0, 4).map((c) => {
                    const isBookmarked = savedCases.has(c.id);
                    return (
                      <article
                        key={c.id}
                        className="editorial-case-row"
                        onClick={() => handleOpenCase(c)}
                      >
                        <div className="case-row-main">
                          <div className="case-row-meta-top">
                            <span className="case-category-badge">{c.category}</span>
                            {c.subcategory && (
                              <span className="case-subcategory-badge">· {c.subcategory}</span>
                            )}
                            <span className="case-time-ago">
                              <Clock size={13} className="inline mr-1" />
                              {c.published_at}
                            </span>
                            {c.urgency === 'alta' && (
                              <span className="case-urgency-badge">
                                <Flame size={12} className="inline mr-1" /> Urgente
                              </span>
                            )}
                          </div>

                          <h3 className="case-row-title">{c.title}</h3>

                          <p className="case-row-summary">{c.summary}</p>

                          <div className="case-row-meta-bottom">
                            <span className="case-location-chip">
                              <MapPin size={14} className="inline mr-1 text-[#8f8284]" />
                              {c.city}
                              {c.modality ? ` · ${c.modality}` : ''}
                            </span>

                            {c.budget_cop && (
                              <span className="case-budget-chip">
                                Presupuesto: <strong>{c.budget_cop}</strong>
                              </span>
                            )}

                            {typeof c.proposals_count === 'number' && (
                              <span className="case-proposals-count">
                                {c.proposals_count === 0
                                  ? 'Sé el primero en postularte'
                                  : `${c.proposals_count} propuesta${c.proposals_count > 1 ? 's' : ''}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="case-row-actions">
                          <button
                            type="button"
                            className={`case-bookmark-icon-btn ${isBookmarked ? 'saved' : ''}`}
                            onClick={(e) => toggleBookmark(c.id, e)}
                            title={isBookmarked ? 'Guardado' : 'Guardar caso'}
                          >
                            <Bookmark size={18} fill={isBookmarked ? '#722f37' : 'none'} />
                          </button>

                          <button
                            type="button"
                            className="case-row-cta-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAttemptProposal(c);
                            }}
                          >
                            <span>Ver caso</span>
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* SECTION: TUS PROPUESTAS */}
              <section className="dashboard-editorial-section proposals-section">
                <div className="editorial-section-header">
                  <div>
                    <h2 className="editorial-section-title">Tus propuestas</h2>
                    <p className="editorial-section-subtitle">
                      Seguimiento en tiempo real a las propuestas enviadas a clientes.
                    </p>
                  </div>
                </div>

                {proposals.length === 0 ? (
                  <div className="editorial-empty-state">
                    <div className="empty-state-icon">
                      <Inbox size={32} strokeWidth={1.5} />
                    </div>
                    <h4 className="empty-state-title">Aún no has enviado propuestas</h4>
                    <p className="empty-state-desc">
                      Explora casos activos y encuentra oportunidades que encajen con tu experiencia para iniciar contacto con clientes.
                    </p>
                    <button
                      type="button"
                      className="empty-state-cta"
                      onClick={() => onNavigate?.('casos')}
                    >
                      Explorar casos disponibles →
                    </button>
                  </div>
                ) : (
                  <div className="proposals-list-table">
                    {proposals.slice(0, 5).map((p) => (
                      <div key={p.id} className="proposal-row-item">
                        <div className="proposal-info">
                          <h4 className="proposal-case-title">{p.case_title}</h4>
                          <span className="proposal-date">Enviada el {p.submitted_at}</span>
                        </div>
                        <div className="proposal-status-col">
                          {renderProposalStatus(p.status)}
                        </div>
                        <button
                          type="button"
                          className="proposal-action-btn"
                          onClick={() => {
                            if (onOpenCase) onOpenCase(p.case_id);
                            else onNavigate?.('casos');
                          }}
                        >
                          Ver propuesta →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION: CASOS ACTIVOS (Only shown if active hired cases exist) */}
              {activeCases.length > 0 && (
                <section className="dashboard-editorial-section active-cases-section">
                  <div className="editorial-section-header">
                    <div>
                      <h2 className="editorial-section-title">Casos activos</h2>
                      <p className="editorial-section-subtitle">
                        Asuntos legales en curso con clientes contratados.
                      </p>
                    </div>
                  </div>

                  <div className="active-cases-grid">
                    {activeCases.map((ac) => (
                      <div key={ac.id} className="active-case-card">
                        <div className="active-case-top">
                          <span className="active-status-badge">● {ac.status}</span>
                          <span className="active-client-label">Cliente: {ac.client_name}</span>
                        </div>
                        <h4 className="active-case-name">{ac.title}</h4>
                        <div className="active-case-action-box">
                          <span className="action-box-title">Próxima acción:</span>
                          <p className="action-box-desc">{ac.next_action}</p>
                        </div>
                        <div className="active-case-footer">
                          <div className="footer-badges">
                            {ac.pending_messages > 0 && (
                              <span className="footer-chip msg">
                                <MessageSquare size={13} /> {ac.pending_messages} nuevo(s)
                              </span>
                            )}
                            {ac.pending_docs > 0 && (
                              <span className="footer-chip doc">
                                <FileText size={13} /> {ac.pending_docs} doc(s)
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="enter-case-btn"
                            onClick={() => {
                              if (onOpenCase) onOpenCase(ac.id);
                              else onNavigate?.('mis-casos');
                            }}
                          >
                            Entrar al caso →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Column: Actividad Reciente & MatchAsistente */}
            <aside className="lawyer-side-column lawyer-dash-aside">
              {/* MatchAsistente AI Card */}
              <div className="match-assistant-card">
                <div className="assistant-card-header">
                  <div className="assistant-sparkle-icon">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="assistant-card-title">MatchAsistente</h4>
                    <span className="assistant-card-badge">Inteligencia Jurídica</span>
                  </div>
                </div>
                <p className="assistant-card-desc">
                  Tu copiloto para resumir expedientes, redactar propuestas atractivas y organizar tu día.
                </p>

                <div className="assistant-quick-prompts">
                  <button
                    type="button"
                    className="quick-prompt-btn"
                    onClick={() => handleAssistantQuery('¿Cómo preparar una propuesta ganadora?')}
                  >
                    <span>Preparar una propuesta</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="quick-prompt-btn"
                    onClick={() => handleAssistantQuery('¿Qué tengo pendiente hoy en mi práctica?')}
                  >
                    <span>¿Qué tengo pendiente hoy?</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="quick-prompt-btn"
                    onClick={() => handleAssistantQuery('Resume este caso para propuesta comercial')}
                  >
                    <span>Resumir un caso</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('cardAssistantQuery') as HTMLInputElement;
                    if (input?.value?.trim()) {
                      handleAssistantQuery(input.value.trim());
                      input.value = '';
                    }
                  }}
                  className="assistant-card-input-row"
                >
                  <input
                    name="cardAssistantQuery"
                    type="text"
                    className="assistant-card-input"
                    placeholder="Consulta libre o borrador..."
                  />
                  <button type="submit" className="assistant-card-submit-btn" title="Preguntar a la IA">
                    <Send size={13} />
                  </button>
                </form>
              </div>

              {/* Actividad Reciente */}
              <div className="recent-activity-card">
                <h4 className="activity-card-title">Actividad reciente</h4>
                <div className="activity-timeline">
                  {activityEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="activity-item"
                      onClick={() => {
                        if (ev.target_route === 'perfil') {
                          if (onGoToProfile) onGoToProfile(firstIncomplete);
                          else onNavigate?.('perfil');
                        } else if (ev.target_route) {
                          onNavigate?.(ev.target_route);
                        }
                      }}
                    >
                      <div className="activity-bullet" />
                      <div className="activity-body">
                        <strong className="activity-title">{ev.title}</strong>
                        {ev.desc && <p className="activity-desc">{ev.desc}</p>}
                        <span className="activity-time">{ev.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Lawyer Guarantee Pill */}
              <div className="security-guarantee-box">
                <div className="security-icon-circle">
                  <ShieldCheck size={20} className="text-[#722f37]" />
                </div>
                <div className="security-text">
                  <h5>Ecosistema Seguro</h5>
                  <p>
                    Tus pagos y honorarios son custodiados en escrow hasta la culminación de cada hito profesional.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* Verification Guard Modal (Shown when unverified lawyer tries to send proposal) */}
      {verificationModalOpen && (
        <div
          className="lawyer-modal-backdrop"
          onClick={() => setVerificationModalOpen(false)}
        >
          <div
            className="lawyer-modal-content verification-guard-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lawyer-modal-close"
              onClick={() => setVerificationModalOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="guard-modal-icon">
              <ShieldCheck size={42} strokeWidth={1.8} />
            </div>

            <h3 className="guard-modal-title">Completa tu perfil para enviar propuestas</h3>
            <p className="guard-modal-desc">
              Antes de contactar clientes necesitamos validar tu información profesional y tu tarjeta profesional CSJ.
            </p>

            <div className="guard-progress-box">
              <div className="guard-progress-header">
                <span>Tu progreso</span>
                <strong>{progress}%</strong>
              </div>
              <div className="guard-progress-track">
                <div
                  className="guard-progress-fill"
                  style={{ width: `${Math.max(12, progress)}%` }}
                />
              </div>
              <span className="guard-next-step">
                Siguiente paso requerido: <strong>{LAWYER_STEPS[firstIncomplete - 1]?.label || 'Completar perfil'}</strong>
              </span>
            </div>

            <div className="guard-modal-actions">
              <button
                type="button"
                className="guard-btn-primary"
                onClick={handleProceedToProfileFromModal}
              >
                Continuar mi perfil →
              </button>
              <button
                type="button"
                className="guard-btn-secondary"
                onClick={() => setVerificationModalOpen(false)}
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MatchAsistente Interactive Modal */}
      {assistantModalOpen && (
        <div
          className="lawyer-modal-backdrop"
          onClick={() => setAssistantModalOpen(false)}
        >
          <div
            className="lawyer-modal-content assistant-dialog-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lawyer-modal-close"
              onClick={() => setAssistantModalOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="assistant-modal-header">
              <div className="assistant-modal-logo">
                <Sparkles size={24} />
              </div>
              <div>
                <h3>MatchAsistente</h3>
                <span>Copiloto de análisis jurídico</span>
              </div>
            </div>

            <div className="assistant-modal-body">
              {assistantHistory.length > 0 ? (
                assistantHistory.map((item, idx) =>
                  item.role === 'user' ? (
                    <div key={idx} className="assistant-prompt-bubble">
                      <small>Tu consulta:</small>
                      <p>"{item.content}"</p>
                    </div>
                  ) : (
                    <div key={idx} className="assistant-response-bubble">
                      <small>Respuesta jurídica:</small>
                      <p style={{ whiteSpace: 'pre-line' }}>{item.content}</p>
                    </div>
                  )
                )
              ) : (
                <>
                  <div className="assistant-prompt-bubble">
                    <small>Tu consulta:</small>
                    <p>"{assistantPrompt}"</p>
                  </div>
                  {assistantResponse && (
                    <div className="assistant-response-bubble">
                      <small>Respuesta jurídica:</small>
                      <p style={{ whiteSpace: 'pre-line' }}>{assistantResponse}</p>
                    </div>
                  )}
                </>
              )}

              {assistantBusy && (
                <div className="assistant-loading-box">
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p>Analizando precedentes y estructurando recomendación…</p>
                </div>
              )}
            </div>

            <form
              className="assistant-modal-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (assistantInput.trim() && !assistantBusy) {
                  handleAssistantQuery(assistantInput);
                }
              }}
            >
              <input
                type="text"
                className="assistant-modal-input"
                placeholder="Escribe una pregunta de seguimiento o consulta..."
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                disabled={assistantBusy}
              />
              <button
                type="submit"
                className="assistant-modal-send-btn"
                disabled={assistantBusy || !assistantInput.trim()}
                title="Enviar consulta"
              >
                <Send size={15} />
              </button>
            </form>

            <div className="assistant-modal-footer">
              {assistantHistory.length > 1 && (
                <button
                  type="button"
                  className="assistant-clear-btn"
                  onClick={() => {
                    setAssistantHistory([]);
                    setAssistantPrompt('');
                    setAssistantResponse('');
                  }}
                  disabled={assistantBusy}
                >
                  Nueva consulta
                </button>
              )}
              <button
                type="button"
                className="assistant-close-btn"
                onClick={() => setAssistantModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
