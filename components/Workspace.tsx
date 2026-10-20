'use client';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ChevronRight,
  CircleHelp,
  Compass,
  Crown,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  FileText,
  MessageCircle,
  Home,
} from 'lucide-react';
import { api } from '@/lib/browser';
import { categories, statusLabels } from '@/lib/shared';
import { Brand } from './Landing';
import { CaseForm, Field, Modal, ProfileForm, type Row } from './Forms';
import CaseIntake from './CaseIntake';
import { importIntake } from '@/lib/import-intake';
import CaseView from './CaseView';
import Avatar from './Avatar';
import { safeAvatar } from '@/lib/avatar';
import AdminPanel from './AdminPanel';
import Notifications from './Notifications';
import Messenger, { type ChatTarget } from './Messenger';
import LawyerSidebar from './LawyerSidebar';
import LawyerOnboardingDashboard from './LawyerOnboardingDashboard';
import LawyerHomeDashboard from './LawyerHomeDashboard';
import ClientAdaptiveDashboard from './ClientAdaptiveDashboard';
import { calculateProfileProgress, getFirstIncompleteStep } from '@/lib/lawyer-profile';
import { draftStore } from '@/lib/intake';

export type Run = (fn: () => Promise<void>) => Promise<void>;
export type WorkProps = {
  me: Row;
  session: Session;
  run: Run;
  busy: boolean;
  onNotice: (s: string) => void;
  onInfo: (s: string) => void;
  onRefreshMe: () => Promise<void>;
  onLogout: () => void;
  onChat?: (caseId: string, lawyerId: string) => void;
  onGoToProfile?: (step?: number) => void;
  initialCaseId?: string;
  initialView?: string;
};

export default function Workspace(props: WorkProps) {
  const { me, run, busy, onNotice } = props,
    p = me.profile,
    isLawyer = p.role === 'lawyer';
  const [view, setView] = useState(props.initialCaseId ? 'cases' : (props.initialView || 'welcome')),
    [caseId, setCaseId] = useState(props.initialCaseId || ''),
    [items, setItems] = useState<Row[]>(() => {
      if (typeof window !== 'undefined') {
        try {
          const cached = sessionStorage.getItem('lexmarket.user_cases');
          if (cached) return JSON.parse(cached);
        } catch {}
      }
      return [];
    }),
    [initialLoaded, setInitialLoaded] = useState(false),
    [draftLoading, setDraftLoading] = useState(true),
    [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [create, setCreate] = useState(false),
    [query, setQuery] = useState(''),
    [category, setCategory] = useState(''),
    [revision, setRevision] = useState(0),
    [admin, setAdmin] = useState<Row | null>(null);
  const [chatOpen, setChatOpen] = useState(false),
    [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const [draftCase, setDraftCase] = useState<{
    title?: string;
    category?: string;
    city?: string;
    summary?: string;
    stage?: string;
  } | null>(null);
  const googleAvatar = safeAvatar(props.session.user.user_metadata?.avatar_url || props.session.user.user_metadata?.picture);
  const avatar = p.avatar_url !== undefined && p.avatar_url !== null ? (p.avatar_url === '' ? '' : p.avatar_url) : (googleAvatar || '');

  const [profileTargetStep, setProfileTargetStep] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedStep = localStorage.getItem('lexmarket.lawyer_current_step');
        if (savedStep) return parseInt(savedStep, 10) || 1;
      } catch {}
    }
    return 1;
  });
  const [unreadMsgCount, setUnreadMsgCount] = useState<number>(0);

  function openChat(cId: string, lawyerId: string) {
    setChatTarget({ case_id: cId, lawyer_id: lawyerId });
    setChatOpen(true);
  }

  const handleGoToProfile = (step?: number) => {
    if (typeof step === 'number' && step >= 1 && step <= 6) {
      setProfileTargetStep(step);
    } else {
      setProfileTargetStep(getFirstIncompleteStep(p));
    }
    navigate('profile');
  };

  useEffect(() => {
    if (isLawyer) {
      api('chats')
        .then((d) => {
          if (d?.items && Array.isArray(d.items)) {
            const unread = d.items.reduce((acc: number, item: any) => acc + (item.unread || 0), 0);
            setUnreadMsgCount(unread);
          }
        })
        .catch(() => {});
    }
  }, [isLawyer, view]);

  useEffect(() => {
    let active = true;
    setLoadError('');
    if (view === 'profile' || view === 'configuracion' || view === 'pagos' || view === 'messages') {
      setLoading(false);
      return;
    }
    setLoading(true);
    api(view === 'admin' ? 'admin' : view === 'marketplace' ? 'marketplace' : view === 'propuestas' ? 'proposals' : 'cases')
      .then((data) => {
        if (!active) return;
        if (view === 'admin') setAdmin(data);
        else {
          setItems(data?.items || []);
          try {
            sessionStorage.setItem('lexmarket.user_cases', JSON.stringify(data?.items || []));
          } catch {}
        }
        setInitialLoaded(true);
      })
      .catch((e) => {
        if (active) setLoadError(e.message);
        setInitialLoaded(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [view, revision, p.verification]);

  useEffect(() => {
    let active = true;
    draftStore('read')
      .then((d) => {
        if (!active) return;
        if (d?.data) {
          setDraftCase({ title: d.data.title, category: d.data.category, city: d.data.city, summary: d.data.summary });
        } else {
          setDraftCase(null);
        }
      })
      .catch(() => {
        if (active) setDraftCase(null);
      })
      .finally(() => {
        if (active) setDraftLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision, view]);

  function getPathForView(v: string, cid?: string) {
    if (cid) return `/casos/${cid}`;
    if (v === 'cases') return '/mis-casos';
    if (v === 'messages') return '/mensajes';
    if (v === 'propuestas') return '/propuestas';
    if (v === 'marketplace') return '/casos';
    if (v === 'profile') return isLawyer ? '/dashboard/perfil' : '/mi-perfil';
    if (v === 'configuracion') return '/configuracion';
    if (v === 'pagos') return '/pagos';
    if (v === 'admin') return '/admin';
    return isLawyer ? '/dashboard' : '/explorar';
  }

  function navigate(v: string, newCaseId: string = '') {
    if (v === 'messages') setChatOpen(false);
    setView(v);
    setCaseId(newCaseId);
    setQuery('');
    setCategory('');
    if (typeof window !== 'undefined') {
      const targetPath = getPathForView(v, newCaseId);
      if (window.location.pathname !== targetPath || window.location.hash) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentPath = getPathForView(view, caseId);
    if (window.location.pathname !== currentPath || window.location.hash) {
      window.history.replaceState(null, '', currentPath);
    }
    const onPop = () => {
      const path = window.location.pathname;
      if (path.startsWith('/casos/')) {
        const cid = path.replace('/casos/', '');
        setCaseId(cid);
        setView('cases');
      } else if (path === '/mis-casos') {
        setCaseId('');
        setView('cases');
      } else if (path === '/mensajes') {
        setCaseId('');
        setView('messages');
      } else if (path === '/propuestas') {
        setCaseId('');
        setView('propuestas');
      } else if (path === '/mi-perfil' || path === '/perfil' || path === '/dashboard/perfil') {
        setCaseId('');
        setView('profile');
      } else if (path === '/configuracion') {
        setCaseId('');
        setView('configuracion');
      } else if (path === '/pagos') {
        setCaseId('');
        setView('pagos');
      } else if (path === '/casos') {
        setCaseId('');
        setView('marketplace');
      } else if (path === '/admin') {
        setCaseId('');
        setView('admin');
      } else {
        setCaseId('');
        setView('welcome');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const filtered = items.filter(
    (c) =>
      (!category || c.category === category) &&
      [c.title, c.city, c.summary].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );

  if (isLawyer && view === 'welcome' && !caseId) {
    return (
      <LawyerHomeDashboard
        initialLawyerName={p.name}
        initialAvatar={avatar || ''}
        initialProfile={p}
        unreadMessages={unreadMsgCount}
        onNavigate={(route) => {
          if (route === 'inicio') navigate('welcome');
          else if (route === 'casos') navigate('marketplace');
          else if (route === 'propuestas') navigate('propuestas');
          else if (route === 'mis-casos') navigate('cases');
          else if (route === 'mensajes') navigate('messages');
          else if (route === 'pagos') navigate('pagos');
          else if (route === 'perfil') handleGoToProfile(profileTargetStep);
          else if (route === 'configuracion') navigate('configuracion');
          else if (route === 'admin') navigate('admin');
          else if (route === 'help') props.onInfo('help');
          else navigate('welcome');
        }}
        onOpenCase={(cId) => {
          setCaseId(cId);
          setView('marketplace');
        }}
        onGoToProfile={(step?: number) => {
          handleGoToProfile(step);
        }}
        onLogout={props.onLogout}
      />
    );
  }

  if (isLawyer && view === 'profile' && !caseId) {
    return (
      <LawyerOnboardingDashboard
        initialLawyerName={p.name}
        initialAvatar={avatar || ''}
        initialProfile={p}
        initialLinkedInSynced={Boolean(
          (p.linkedin_url && p.linkedin_url.trim().length > 0) ||
          (typeof window !== 'undefined' &&
            localStorage.getItem('lexmarket.lawyer_onboarding_reset') !== 'true' &&
            (localStorage.getItem('lexmarket.lawyer_linkedin_connected') === 'true' ||
              localStorage.getItem('lexmarket.lawyer_onboarding_state')?.includes('"linkedInSynced":true')))
        )}
        targetStep={profileTargetStep}
        activeMenu="perfil"
        onNavigate={(route) => {
          if (route === 'inicio') navigate('welcome');
          else if (route === 'casos') navigate('marketplace');
          else if (route === 'propuestas') navigate('propuestas');
          else if (route === 'mis-casos') navigate('cases');
          else if (route === 'mensajes') navigate('messages');
          else if (route === 'pagos') navigate('pagos');
          else if (route === 'perfil') navigate('profile');
          else if (route === 'configuracion') navigate('configuracion');
          else if (route === 'admin') navigate('admin');
          else if (route === 'help') props.onInfo('help');
          else navigate('welcome');
        }}
        onSaveProfile={async (data) => {
          await api('me', 'PUT', data);
          await props.onRefreshMe();
          onNotice('Tu perfil profesional ha sido actualizado.');
        }}
        onLogout={props.onLogout}
      />
    );
  }

  const lawyerActiveMenu =
    view === 'welcome' && !caseId
      ? 'inicio'
      : view === 'marketplace'
      ? 'casos'
      : view === 'propuestas'
      ? 'propuestas'
      : view === 'messages'
      ? 'mensajes'
      : view === 'cases'
      ? 'mis-casos'
      : view === 'pagos'
      ? 'pagos'
      : view === 'profile'
      ? 'perfil'
      : view === 'configuracion'
      ? 'configuracion'
      : view === 'admin'
      ? 'admin'
      : '';

  return (
    <div className={`app-shell ${isLawyer ? 'lawyer-shell' : ''}`}>
      {isLawyer ? (
        <LawyerSidebar
          activeMenu={lawyerActiveMenu}
          unreadMessages={unreadMsgCount}
          onNavigate={(route) => {
            if (route === 'inicio') navigate('welcome');
            else if (route === 'casos') navigate('marketplace');
            else if (route === 'propuestas') navigate('propuestas');
            else if (route === 'mis-casos') navigate('cases');
            else if (route === 'mensajes') navigate('messages');
            else if (route === 'pagos') navigate('pagos');
            else if (route === 'perfil') handleGoToProfile(profileTargetStep);
            else if (route === 'configuracion') navigate('configuracion');
            else if (route === 'admin') navigate('admin');
            else if (route === 'help') props.onInfo('help');
          }}
          isAdmin={Boolean(me.admin)}
          onHelp={() => props.onInfo('help')}
        />
      ) : (
        <aside className="sidebar">
          <a href="/" className="sidebar-brand" aria-label="Inicio">
            <Brand />
          </a>
          <div className="workspace-label">TU ESPACIO</div>
          <nav aria-label="Tu espacio">
            {[
              { id: 'welcome', label: 'Explorar', icon: Compass },
              { id: 'cases', label: 'Mis casos', icon: FolderOpen },
              { id: 'messages', label: 'Mensajes', icon: MessageCircle },
              { id: 'find_lawyers', label: 'Encontrar abogados', icon: Users },
              { id: 'legal_resources', label: 'Recursos legales', icon: FileText },
              { id: 'profile', label: 'Mi perfil', icon: Settings },
              ...(me.admin ? [{ id: 'admin', label: 'Administración', icon: ShieldCheck }] : []),
            ].map((n) => (
              <button
                key={n.id}
                className={view === n.id && !caseId ? 'selected' : ''}
                onClick={() => {
                  if (n.id === 'find_lawyers') {
                    window.location.href = '/abogados';
                  } else if (n.id === 'legal_resources') {
                    if (view !== 'welcome' || caseId) navigate('welcome');
                    setTimeout(() => {
                      document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 120);
                  } else {
                    navigate(n.id);
                  }
                }}
              >
                <n.icon size={19} />
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button type="button" className="sidebar-premium-card" onClick={() => props.onInfo('premium')}>
              <Crown size={18} className="premium-crown" />
              <span className="premium-text-box">
                <strong>Accede a beneficios Premium</strong>
                <small>Prioriza tus casos, recibe recomendaciones y más.</small>
              </span>
              <ChevronRight size={15} className="premium-arrow" />
            </button>
            <button onClick={() => props.onInfo('help')}>
              <CircleHelp size={18} />¿Te ayudamos?
            </button>
            <div className="account">
              <Avatar name={p.name} url={avatar} />
              <div>
                <b>{p.name}</b>
                <small>Cuenta personal</small>
              </div>
              <button aria-label="Cerrar sesión" onClick={props.onLogout}>
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </aside>
      )}

      <div className={'workspace' + (!isLawyer && view === 'welcome' && !caseId ? ' is-landing' : '')}>
        <header className="workspace-top">
          <span className="workspace-top-hint">
            <span className="tiny-dot" /> {isLawyer ? 'Espacio profesional' : 'Un paso a la vez'}
          </span>
          <div className="workspace-top-right">
            {!isLawyer && (
              <button type="button" className="lp-top-cta" onClick={() => setCreate(true)}>
                <Plus size={15} />Empezar mi caso
              </button>
            )}
            <Notifications
              userId={props.session.user.id}
              onSelect={(n) => {
                if (n.lawyer_id && n.case_id) openChat(n.case_id, n.lawyer_id);
                else if (n.case_id) navigate('cases', n.case_id);
                else navigate('profile');
              }}
            />
            <div
              className="header-user-avatar"
              onClick={() => navigate('profile')}
              style={{ cursor: 'pointer' }}
              title={isLawyer ? 'Perfil profesional' : 'Mi perfil'}
            >
              <Avatar name={p.name} url={avatar} />
            </div>
            <button className="icon-button" aria-label="Ayuda" onClick={() => props.onInfo('help')}>
              <CircleHelp size={19} />
            </button>
          </div>
        </header>

        <main className="workspace-main">
          {caseId ? (
            <CaseView
              {...props}
              onChat={openChat}
              id={caseId}
              onGoToProfile={handleGoToProfile}
              onBack={() => {
                navigate(isLawyer ? 'marketplace' : 'cases', '');
                setRevision((n) => n + 1);
              }}
            />
          ) : (
            <>
              {view === 'propuestas' ? (
                <div className="lawyer-proposals-container" style={{ padding: '12px 16px' }}>
                  <div className="page-heading">
                    <div>
                      <span className="overline">SEGUIMIENTO DE POSTULACIONES</span>
                      <h1>Mis propuestas</h1>
                      <p>
                        Revisa el estado de las propuestas que has enviado a clientes y continúa las conversaciones activas.
                      </p>
                    </div>
                  </div>
                  {items.length === 0 ? (
                    <div className="editorial-empty-state" style={{ background: '#ffffff', border: '1px solid #ebdccc', borderRadius: '18px', padding: '48px 28px', textAlign: 'center', margin: '24px 0' }}>
                      <div className="empty-state-icon" style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f5eee5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#722f37' }}>
                        <FileText size={28} />
                      </div>
                      <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#1e191a', marginBottom: '8px' }}>
                        Todavía no has enviado ninguna propuesta
                      </h3>
                      <p style={{ color: '#6a5e60', fontSize: '14px', maxWidth: '440px', margin: '0 auto 20px', lineHeight: '1.5' }}>
                        Encuentra casos que coincidan con tu experiencia y postúlate para conectar con clientes.
                      </p>
                      <button
                        type="button"
                        className="button button-burgundy"
                        onClick={() => navigate('marketplace')}
                      >
                        Explorar casos disponibles →
                      </button>
                    </div>
                  ) : (
                    <div className="proposals-list-table">
                      {items.map((propItem: any) => (
                        <div key={propItem.id} className="proposal-row-item">
                          <div className="proposal-info">
                            <h4 className="proposal-case-title">{propItem.case?.title || propItem.case_title || 'Asunto legal'}</h4>
                            <span className="proposal-date">
                              Enviada el {propItem.created_at ? new Date(propItem.created_at).toLocaleDateString('es-CO') : 'Reciente'}
                              {propItem.fee ? ` · Honorarios: $${propItem.fee}` : ''}
                            </span>
                          </div>
                          <div className="proposal-status-col">
                            <span className={`proposal-status-pill ${propItem.status || 'sent'}`}>
                              {propItem.status === 'accepted' ? '✓ Aceptada' : propItem.status === 'viewed' ? 'Vista por cliente' : propItem.status === 'replied' ? 'Cliente respondió' : 'Enviada'}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="proposal-action-btn"
                            onClick={() => {
                              if (propItem.case_id) navigate('marketplace', propItem.case_id);
                            }}
                          >
                            Ver caso →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : view === 'messages' ? (
                <Messenger
                  mode="page"
                  userId={props.session.user.id}
                  open
                  target={chatTarget}
                  onOpen={() => {}}
                  onClose={() => {}}
                  onSelect={setChatTarget}
                  onCase={(id) => navigate('cases', id)}
                />
              ) : view === 'welcome' ? (
                <ClientAdaptiveDashboard
                  loading={!initialLoaded && items.length === 0 && draftLoading}
                  user={{
                    id: props.session.user.id,
                    name: p.name,
                    email: props.session.user.email,
                    avatar_url: avatar,
                  }}
                  items={items}
                  draftCase={draftCase}
                  onOpenCase={(id) => navigate('cases', id)}
                  onContinueDraft={() => setCreate(true)}
                  onCreateCase={() => setCreate(true)}
                  onNavigate={(dest) => {
                    if (dest === 'documents') navigate('cases');
                    else navigate(dest);
                  }}
                  onOpenChat={openChat}
                />
              ) : view === 'profile' ? (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="overline">
                        {isLawyer ? 'HABILITACIÓN Y TRAYECTORIA' : 'LAS PERSONAS DETRÁS DE CADA CASO'}
                      </span>
                      <h1>{isLawyer ? 'Perfil profesional' : 'Tu perfil'}</h1>
                      <p>
                        {isLawyer
                          ? 'Una presentación completa y verificada genera más confianza ante tus clientes.'
                          : 'Una buena presentación también abre puertas.'}
                      </p>
                    </div>
                    {isLawyer && <span className="tag">{statusLabels[p.verification]}</span>}
                  </div>
                  <section className="panel narrow">
                    <div className="profile-photo-manager">
                      <div className="profile-avatar-preview">
                        <Avatar name={p.name} url={avatar} large />
                      </div>
                      <div className="profile-avatar-details">
                        <div className="profile-avatar-title">Foto de perfil</div>
                        <p className="profile-avatar-hint">
                          {avatar
                            ? 'Esta imagen identifica tu cuenta y tus conversaciones.'
                            : isLawyer
                            ? 'Una foto profesional transmite confianza a tus clientes. Te recomendamos subir una fotografía clara y formal.'
                            : 'Tu perfil se muestra anónimo, identificado únicamente con tu inicial.'}
                        </p>
                        <div className="profile-avatar-actions">
                          <label
                            className="button small outline profile-upload-label"
                            style={{ cursor: 'pointer', margin: 0 }}
                          >
                            <span>Subir foto</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              hidden
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 2 * 1024 * 1024) {
                                  onNotice('La foto debe pesar menos de 2 MB.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const base64 = reader.result as string;
                                  void run(async () => {
                                    await api('me', 'PUT', { ...p, avatar_url: base64 });
                                    try {
                                      const raw = localStorage.getItem('lexmarket.lawyer_onboarding_state');
                                      if (raw) {
                                        const parsed = JSON.parse(raw);
                                        parsed.avatarUrl = base64;
                                        if (parsed.profileForm) parsed.profileForm.avatar_url = base64;
                                        localStorage.setItem('lexmarket.lawyer_onboarding_state', JSON.stringify(parsed));
                                      }
                                    } catch {}
                                    await props.onRefreshMe();
                                    onNotice('Foto de perfil actualizada.');
                                  });
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          {avatar ? (
                            isLawyer ? (
                              <button
                                type="button"
                                className="text-button profile-anon-btn"
                                onClick={() =>
                                  void run(async () => {
                                    await api('me', 'PUT', { ...p, avatar_url: '' });
                                    try {
                                      const raw = localStorage.getItem('lexmarket.lawyer_onboarding_state');
                                      if (raw) {
                                        const parsed = JSON.parse(raw);
                                        parsed.avatarUrl = '';
                                        if (parsed.profileForm) parsed.profileForm.avatar_url = '';
                                        localStorage.setItem('lexmarket.lawyer_onboarding_state', JSON.stringify(parsed));
                                      }
                                    } catch {}
                                    await props.onRefreshMe();
                                    onNotice('Foto de perfil eliminada.');
                                  })
                                }
                              >
                                Eliminar foto
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="text-button profile-anon-btn"
                                onClick={() =>
                                  void run(async () => {
                                    await api('me', 'PUT', { ...p, avatar_url: '' });
                                    await props.onRefreshMe();
                                    onNotice('Tu foto ha sido removida. Ahora tu perfil es anónimo.');
                                  })
                                }
                              >
                                Dejar anónimo
                              </button>
                            )
                          ) : googleAvatar ? (
                            <button
                              type="button"
                              className="text-button profile-google-btn"
                              onClick={() =>
                                void run(async () => {
                                  await api('me', 'PUT', { ...p, avatar_url: googleAvatar });
                                  await props.onRefreshMe();
                                  onNotice('Foto de Google restablecida.');
                                })
                              }
                            >
                              Usar foto de Google
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <ProfileForm
                      initial={p}
                      busy={busy}
                      onSave={(data) =>
                        run(async () => {
                          await api('me', 'PUT', data);
                          await props.onRefreshMe();
                          onNotice('Tu perfil está actualizado.');
                        })
                      }
                    />
                    {p.verification_note && (
                      <p className="notice-panel">Nota de verificación: {p.verification_note}</p>
                    )}
                  </section>
                </>
              ) : view === 'configuracion' ? (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="overline">AJUSTES DE TU CUENTA</span>
                      <h1>Configuración</h1>
                      <p>Gestiona los accesos de tu cuenta, seguridad y preferencias de notificaciones.</p>
                    </div>
                    {isLawyer && <span className="tag">{statusLabels[p.verification]}</span>}
                  </div>

                  <section className="panel narrow">
                    <h2>Cuenta y seguridad</h2>
                    <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
                      Información de tu inicio de sesión y estado de verificación.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px 0',
                          borderBottom: '1px solid var(--line)',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Nombre registrado</span>
                        <b style={{ fontSize: '13px' }}>{p.name}</b>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px 0',
                          borderBottom: '1px solid var(--line)',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Correo electrónico</span>
                        <b style={{ fontSize: '13px' }}>{props.session.user.email}</b>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px 0',
                          borderBottom: '1px solid var(--line)',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Tipo de usuario</span>
                        <b style={{ fontSize: '13px' }}>{isLawyer ? 'Abogado profesional' : 'Cliente'}</b>
                      </div>
                      {isLawyer && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '12px 0',
                            borderBottom: '1px solid var(--line)',
                          }}
                        >
                          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Estado de habilitación CSJ</span>
                          <b
                            style={{
                              fontSize: '13px',
                              color: p.verification === 'verified' ? '#2e7d32' : '#8c4e00',
                            }}
                          >
                            {statusLabels[p.verification] || 'Pendiente'}
                          </b>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
                      <button type="button" className="button outline" onClick={() => navigate('profile')}>
                        {isLawyer ? 'Editar perfil profesional' : 'Editar perfil'} <ArrowRight size={16} />
                      </button>
                      <button
                        type="button"
                        className="button"
                        style={{ background: '#722f37', borderColor: '#722f37', color: '#fff' }}
                        onClick={props.onLogout}
                      >
                        <LogOut size={16} /> Cerrar sesión
                      </button>
                    </div>
                  </section>

                  <section className="panel narrow">
                    <h2>Notificaciones y alertas</h2>
                    <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '18px' }}>
                      Personaliza cómo y cuándo te informamos sobre novedades en MatchJurídico.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span>Avisarme cuando se publique un caso relevante en mis áreas</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span>Notificaciones instantáneas de mensajes y propuestas</span>
                      </label>
                    </div>
                  </section>
                </>
              ) : view === 'pagos' ? (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="overline">HONORARIOS Y GESTIÓN FINANCIERA</span>
                      <h1>Pagos y transacciones</h1>
                      <p>Control transparente de tus honorarios con custodia protegida de MatchJurídico.</p>
                    </div>
                  </div>

                  <div className="stat-grid" style={{ marginBottom: '24px' }}>
                    <div>
                      <span>Honorarios acordados</span>
                      <b>$0 COP</b>
                    </div>
                    <div>
                      <span>En custodia protegida</span>
                      <b>$0 COP</b>
                    </div>
                    <div>
                      <span>Saldo disponible para retiro</span>
                      <b>$0 COP</b>
                    </div>
                  </div>

                  <section className="panel narrow">
                    <h2>Garantía de custodia segura</h2>
                    <p style={{ fontSize: '13.5px', lineHeight: '1.7', color: '#4a4344' }}>
                      En MatchJurídico los clientes depositan los honorarios acordados en custodia antes de iniciar el trabajo legal.
                      Una vez completadas las etapas o el servicio, los fondos se transfieren a tu cuenta bancaria registrada, garantizando pagos seguros y sin disputas.
                    </p>
                    <div style={{ marginTop: '20px' }}>
                      <button type="button" className="button" onClick={() => navigate('marketplace')}>
                        Explorar casos disponibles <ArrowRight size={17} />
                      </button>
                    </div>
                  </section>
                </>
              ) : view === 'admin' ? (
                <AdminPanel
                  data={admin}
                  loading={loading}
                  busy={busy}
                  run={run}
                  onRefresh={() => setRevision((n) => n + 1)}
                  onNotice={onNotice}
                />
              ) : (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="overline">
                        {view === 'marketplace'
                          ? 'ENCUENTRA DÓNDE PUEDES APORTAR'
                          : isLawyer
                          ? 'TUS CONVERSACIONES Y PROPUESTAS'
                          : 'QUÉ BUENO VERTE POR AQUÍ'}
                      </span>
                      <h1>
                        {view === 'marketplace'
                          ? 'Explora casos'
                          : isLawyer
                          ? 'Mis oportunidades'
                          : `Hola, ${p.name.split(' ')[0]}.`}
                      </h1>
                      <p>
                        {view === 'marketplace'
                          ? 'Una primera mirada para encontrar tu próximo encargo.'
                          : isLawyer
                          ? 'Retoma los asuntos en los que has mostrado interés.'
                          : 'Este es el lugar para lo que sigue.'}
                      </p>
                    </div>
                    {!isLawyer && (
                      <button className="button" onClick={() => setCreate(true)}>
                        <Plus size={18} />Compartir un caso
                      </button>
                    )}
                  </div>
                  {isLawyer && p.verification !== 'verified' ? (
                    <div className="verification-card">
                      <ShieldCheck size={35} />
                      <h2>Vamos a conocerte mejor.</h2>
                      <p>
                        Tu perfil está {p.verification === 'rejected' ? 'pendiente de ajustes' : 'en revisión'}. En
                        cuanto comprobemos tu habilitación, podrás explorar casos y enviar propuestas.
                      </p>
                      {p.verification_note && <p>{p.verification_note}</p>}
                      <button className="button outline" onClick={() => navigate('profile')}>
                        Revisar mi perfil <ArrowRight size={17} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {view === 'cases' && (
                        <div className="stat-grid">
                          <div>
                            <span>En tu espacio</span>
                            <b>{items.length}</b>
                          </div>
                          <div>
                            <span>{isLawyer ? 'Con acceso' : 'Recibiendo propuestas'}</span>
                            <b>
                              {
                                items.filter((c) =>
                                  isLawyer ? c.access_state === 'granted' : c.status === 'published'
                                ).length
                              }
                            </b>
                          </div>
                          <div>
                            <span>En acompañamiento</span>
                            <b>{items.filter((c) => c.status === 'engaged').length}</b>
                          </div>
                        </div>
                      )}
                      <div className="list-toolbar">
                        <div className="search">
                          <Search size={18} />
                          <input
                            aria-label="Buscar casos"
                            placeholder="Busca por asunto o ciudad"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                        </div>
                        <select
                          aria-label="Filtrar especialidad"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">Todas las áreas</option>
                          {categories.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                        <button className="text-button" onClick={() => setRevision((n) => n + 1)}>
                          Actualizar
                        </button>
                      </div>
                      {loading ? (
                        <div className="skeleton-list" aria-label="Cargando casos">
                          <div />
                          <div />
                          <div />
                        </div>
                      ) : filtered.length ? (
                        <div className="case-grid">
                          {filtered.map((c) => (
                            <button
                              key={c.id || c.case_id}
                              className="case-card"
                              onClick={() => navigate(view === 'marketplace' ? 'marketplace' : 'cases', c.id || c.case_id)}
                            >
                              <div className="split">
                                <span className="tag soft">{c.category}</span>
                                {c.urgency === 'urgent' && <span className="urgency">Solicita atención pronta</span>}
                              </div>
                              <h3>{c.title}</h3>
                              {c.summary && <p>{c.summary}</p>}
                              <span className="case-location">{c.city} · Colombia</span>
                              <div className="case-card-bottom">
                                <span>{view === 'marketplace' ? c.service : statusLabels[c.access_state || c.status]}</span>
                                <ArrowRight size={18} />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <Empty
                          title={
                            query || category
                              ? 'No encontramos coincidencias'
                              : view === 'marketplace'
                              ? 'Los próximos casos aparecerán aquí'
                              : isLawyer
                              ? 'Aquí empiezan tus oportunidades'
                              : 'Hagamos espacio para tu siguiente paso'
                          }
                          text={
                            query || category
                              ? 'Prueba con otra búsqueda o especialidad.'
                              : view === 'marketplace'
                              ? 'Vuelve pronto para conocer nuevos asuntos.'
                              : isLawyer
                              ? 'Explora los casos y solicita acceso a los que te interesen.'
                              : 'Comparte tu asunto y reúne lo que has preparado. Puedes completar los detalles a tu ritmo.'
                          }
                          action={
                            !isLawyer ? (
                              <button className="button" onClick={() => setCreate(true)}>
                                Crear mi primer espacio <ArrowRight size={17} />
                              </button>
                            ) : undefined
                          }
                        />
                      )}
                    </>
                  )}
                </>
              )}
              {loadError && (
                <div className="notice-panel error" role="alert">
                  {loadError}
                  <button className="text-button" onClick={() => setRevision((n) => n + 1)}>
                    Reintentar
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {create && (
        <CaseIntake
          signedIn
          onClose={() => setCreate(false)}
          onGoToDashboard={(id) => {
            setCreate(false);
            if (id) navigate('cases', id);
            else navigate('cases');
          }}
          onReady={async (data) => {
            const id = await importIntake(props.session.user.id, onNotice, data);
            navigate('cases', id);
            setRevision((n) => n + 1);
            return id;
          }}
        />
      )}
      {(view !== 'messages' || caseId) && (
        <Messenger
          onAll={() => navigate('messages')}
          userId={props.session.user.id}
          open={chatOpen}
          target={chatTarget}
          onOpen={() => setChatOpen(true)}
          onClose={() => setChatOpen(false)}
          onSelect={setChatTarget}
          onCase={(id) => {
            setChatOpen(false);
            navigate('cases', id);
          }}
        />
      )}
    </div>
  );
}

export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <FolderOpen size={31} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
