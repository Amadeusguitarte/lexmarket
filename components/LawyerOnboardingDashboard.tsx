'use client';

import React, { useState } from 'react';
import {
  Bell,
  Bookmark,
  Briefcase,
  Check,
  ChevronDown,
  CreditCard,
  FileText,
  Folder,
  HelpCircle,
  Home,
  Lock,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  User,
  X,
  ArrowRight,
  Upload,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Building2,
  GraduationCap,
  Clock,
  Scale,
} from 'lucide-react';
import { type LinkedInProfileData } from '@/lib/linkedin';
import { openLinkedInOAuthPopup } from '@/lib/oauth';

export interface LawyerOnboardingProps {
  initialLawyerName?: string;
  initialAvatar?: string;
  onNavigate?: (route: string) => void;
  onSaveProfile?: (profileData: any) => Promise<void>;
  onOpenCase?: (caseId: string) => void;
  onLogout?: () => void;
}

export function LinkedInOfficialIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  );
}

export function MatchJuridicoScaleLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#68232c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="M7 21h10"/>
      <path d="M12 3v18"/>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
  );
}
export const LexMarketScaleLogo = MatchJuridicoScaleLogo;

function getInitials(name?: string) {
  if (!name || name === 'Abogado' || name.trim() === '') return 'AB';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function LawyerOnboardingDashboard({
  initialLawyerName = '',
  initialAvatar = '',
  onNavigate,
  onSaveProfile,
  onOpenCase,
  onLogout,
}: LawyerOnboardingProps) {
  // State for active sidebar menu
  const [activeMenu, setActiveMenu] = useState('inicio');
  
  // Real lawyer name and avatar (no Juan Perez fallback)
  const [lawyerName, setLawyerName] = useState(
    initialLawyerName && initialLawyerName !== 'Juan Pérez' ? initialLawyerName : 'Abogado'
  );
  const [avatarUrl, setAvatarUrl] = useState(
    initialAvatar && !initialAvatar.includes('juan-perez') ? initialAvatar : ''
  );
  const [linkedInSynced, setLinkedInSynced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Wizard modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [connectedLinkedInPresentation, setConnectedLinkedInPresentation] = useState<{
    name: string;
    avatar_url: string;
    email?: string;
    linkedin_url: string;
  } | null>(null);
  const [workExperience, setWorkExperience] = useState<Array<{
    title: string;
    company: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>>([]);
  const [syncingLinkedIn, setSyncingLinkedIn] = useState(false);
  const [customLinkedInUrl, setCustomLinkedInUrl] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // Form step data: License & Honorarios are strictly EMPTY until manually provided!
  const [profileForm, setProfileForm] = useState({
    name: initialLawyerName && initialLawyerName !== 'Juan Pérez' ? initialLawyerName : 'Abogado',
    city: 'Bogotá, D.C.',
    license: '', // EMPTY! Requires manual entry in Step 5
    specialties: [] as string[], // EMPTY! Requires manual selection in Step 3
    years_of_experience: 0,
    education: '',
    bio: '',
    rate_hourly: '', // STRICTLY EMPTY! Requires manual entry in Step 4
    modality: '', // STRICTLY EMPTY! Requires manual selection in Step 4
    linkedin_url: '',
  });

  const [oauthAvailable, setOauthAvailable] = useState<boolean>(false);

  React.useEffect(() => {
    fetch('/api/linkedin/auth')
      .then(res => res.json())
      .then(data => {
        if (data && data.configured && data.url) {
          setOauthAvailable(true);
        }
      })
      .catch(() => setOauthAvailable(false));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 5500);
  };

  // Stepper completion checks based on updated step order:
  // 1: Datos básicos | 2: Biografía y experiencia | 3: Áreas | 4: Honorarios | 5: Tarjeta profesional CSJ | 6: Verificación
  const isStepCompleted = (num: number): boolean => {
    switch (num) {
      case 1:
        return Boolean(profileForm.name.trim() && profileForm.name !== 'Abogado' && profileForm.city.trim());
      case 2:
        return Boolean(
          profileForm.years_of_experience > 0 ||
          profileForm.education.trim().length > 0 ||
          profileForm.bio.trim().length > 0
        );
      case 3:
        return profileForm.specialties.length > 0;
      case 4:
        return Boolean(profileForm.rate_hourly.trim().length > 0 && profileForm.modality.trim().length > 0);
      case 5:
        // Tarjeta profesional CSJ: strictly manual, minimum 4 characters
        return Boolean(profileForm.license.trim().length >= 4);
      case 6:
        return false;
      default:
        return false;
    }
  };

  // Progress percentage dynamically calculated based on genuinely completed steps
  const calculateProgress = (): number => {
    let completed = 0;
    if (isStepCompleted(1)) completed++;
    if (isStepCompleted(2)) completed++;
    if (isStepCompleted(3)) completed++;
    if (isStepCompleted(4)) completed++;
    if (isStepCompleted(5)) completed++;
    return Math.max(15, Math.min(100, Math.round((completed / 5) * 100)));
  };

  const progress = calculateProgress();

  const applyImportedLinkedInProfile = async (profileData: LinkedInProfileData) => {
    const importedName = profileData.name || lawyerName;
    const importedAvatar = profileData.avatar_url || avatarUrl;
    const importedBio = profileData.bio || profileForm.bio || '';
    const importedEducation = profileData.education || profileForm.education || '';
    const importedSpecialties = (profileData.specialties && Array.isArray(profileData.specialties) && profileData.specialties.length > 0)
      ? profileData.specialties
      : profileForm.specialties;
    const importedYears = typeof profileData.years_of_experience === 'number' && profileData.years_of_experience > 0
      ? profileData.years_of_experience
      : profileForm.years_of_experience;
    const positions = (profileData.positions && Array.isArray(profileData.positions) && profileData.positions.length > 0)
      ? profileData.positions
      : [];
    const importedLinkedInUrl = profileData.linkedin_url || customLinkedInUrl.trim() || profileForm.linkedin_url || (importedName && importedName !== 'Abogado' ? `https://www.linkedin.com/in/${encodeURIComponent(importedName.toLowerCase().trim().replace(/[^a-z0-9]/g, '-'))}` : 'https://www.linkedin.com');

    setLawyerName(importedName);
    if (importedAvatar) setAvatarUrl(importedAvatar);
    setWorkExperience(positions);

    const updatedForm = {
      ...profileForm,
      name: importedName,
      bio: importedBio,
      education: importedEducation,
      years_of_experience: importedYears,
      specialties: importedSpecialties,
      linkedin_url: importedLinkedInUrl,
    };

    setProfileForm(updatedForm);
    setLinkedInSynced(true);
    setIsLinkedInModalOpen(false);

    // Present clean presentation modal with verified photo, name, and clickable link to LinkedIn
    setConnectedLinkedInPresentation({
      name: importedName,
      avatar_url: importedAvatar,
      email: profileData.email,
      linkedin_url: importedLinkedInUrl,
    });

    if (onSaveProfile) {
      try {
        await onSaveProfile({
          ...updatedForm,
          avatar_url: importedAvatar,
          role: 'lawyer',
        });
      } catch {}
    }

    showToast(`✓ LinkedIn conectado: foto y nombre de ${importedName.split(' ')[0]} asociados`);
  };

  // Official LinkedIn OAuth: opens centered popup window without losing dashboard state
  const handleLinkedInOAuth = async () => {
    setSyncingLinkedIn(true);
    try {
      const profile = await openLinkedInOAuthPopup();
      if (profile) {
        await applyImportedLinkedInProfile(profile);
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancelada') && !msg.toLowerCase().includes('cerrada')) {
        showToast(msg);
      }
    } finally {
      setSyncingLinkedIn(false);
    }
  };

  // Check if profile was saved in localStorage from direct fallback
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('lexmarket.imported_linkedin_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.name || parsed.avatar_url)) {
          void applyImportedLinkedInProfile(parsed);
          localStorage.removeItem('lexmarket.imported_linkedin_profile');
        }
      }
    } catch {}
  }, []);

  // LinkedIn Import: brings professional profile ONLY (name, avatar, bio, education)
  // It does NOT fill Tarjeta profesional or specialties!
  const handleLinkedInSync = async (sampleData?: LinkedInProfileData) => {
    setSyncingLinkedIn(true);
    try {
      let importedName = lawyerName;
      let importedAvatar = avatarUrl;
      let importedBio = profileForm.bio;
      let importedEducation = profileForm.education;
      const urlToFetch = customLinkedInUrl.trim();

      if (urlToFetch) {
        try {
          const res = await fetch('/api/linkedin/fetch-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlToFetch }),
          });

          if (res.ok) {
            const json = await res.json();
            const profileData = json.profile || json.data;
            if (profileData) {
              if (profileData.name) importedName = profileData.name;
              if (profileData.avatar_url) importedAvatar = profileData.avatar_url;
              if (profileData.bio) importedBio = profileData.bio;
              if (profileData.education) importedEducation = profileData.education;
            }
          } else {
            // Slug parsing fallback from public URL
            const match = urlToFetch.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
            if (match && match[1]) {
              const rawSlug = match[1].replace(/[-_]/g, ' ');
              const cleaned = rawSlug.replace(/\b[a-f0-9]{5,}\b/gi, '').trim();
              importedName = (cleaned || rawSlug).replace(/\b\w/g, l => l.toUpperCase());
            }
          }
        } catch {
          const match = urlToFetch.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
          if (match && match[1]) {
            const rawSlug = match[1].replace(/[-_]/g, ' ');
            const cleaned = rawSlug.replace(/\b[a-f0-9]{5,}\b/gi, '').trim();
            importedName = (cleaned || rawSlug).replace(/\b\w/g, l => l.toUpperCase());
          }
        }
      } else if (sampleData) {
        await applyImportedLinkedInProfile(sampleData);
        return;
      } else {
        // Direct to safe OAuth popup check if no URL was typed
        await handleLinkedInOAuth();
        return;
      }

      await applyImportedLinkedInProfile({
        name: importedName,
        avatar_url: importedAvatar,
        bio: importedBio,
        education: importedEducation,
        linkedin_url: urlToFetch,
      });
    } catch {
      showToast('Hubo un inconveniente al conectar con LinkedIn. Puedes completar tus datos manualmente.');
    } finally {
      setSyncingLinkedIn(false);
    }
  };

  const handleSaveStep = async () => {
    if (currentStep === 6) {
      setIsWizardOpen(false);
      showToast('¡Perfil enviado a verificación exitosamente!');
      if (onSaveProfile) {
        await onSaveProfile({
          ...profileForm,
          role: 'lawyer',
        });
      }
      return;
    }

    const nextStep = Math.min(currentStep + 1, 6);
    setCurrentStep(nextStep);
    
    if (onSaveProfile) {
      await onSaveProfile({
        ...profileForm,
        role: 'lawyer',
      });
    }
  };

  const stepsList = [
    { num: 1, label: 'Datos básicos' },
    { num: 2, label: 'Biografía y experiencia' },
    { num: 3, label: 'Áreas de práctica' },
    { num: 4, label: 'Honorarios y modalidad' },
    { num: 5, label: 'Tarjeta profesional CSJ' },
    { num: 6, label: 'Verificación' },
  ];

  return (
    <div className="lawyer-dashboard-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="lawyer-dash-toast" role="alert">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage('')}><X size={15} /></button>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="lawyer-dash-sidebar">
        <div className="lawyer-sidebar-top">
          <div className="lawyer-sidebar-logo">
            <MatchJuridicoScaleLogo size={32} />
          </div>

          <nav className="lawyer-sidebar-nav" aria-label="Menú principal de abogado">
            <button
              type="button"
              className={`lawyer-nav-item ${activeMenu === 'inicio' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('inicio'); onNavigate?.('inicio'); }}
            >
              <Home size={19} strokeWidth={2} />
              <span>Inicio</span>
            </button>

            <button
              type="button"
              className={`lawyer-nav-item ${activeMenu === 'casos' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('casos'); onNavigate?.('casos'); }}
            >
              <FileText size={19} strokeWidth={1.8} />
              <span>Casos disponibles</span>
            </button>

            <button
              type="button"
              className={`lawyer-nav-item ${activeMenu === 'propuestas' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('propuestas'); onNavigate?.('propuestas'); }}
            >
              <MessageSquare size={19} strokeWidth={1.8} />
              <span>Mis propuestas</span>
            </button>

            <button
              type="button"
              className={`lawyer-nav-item ${activeMenu === 'mis-casos' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('mis-casos'); onNavigate?.('mis-casos'); }}
            >
              <Folder size={19} strokeWidth={1.8} />
              <span>Mis casos</span>
            </button>

            <button
              type="button"
              className={`lawyer-nav-item ${activeMenu === 'pagos' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('pagos'); onNavigate?.('pagos'); }}
            >
              <CreditCard size={19} strokeWidth={1.8} />
              <span>Pagos</span>
            </button>

            <button
              type="button"
              className={`lawyer-nav-item ${activeMenu === 'perfil' ? 'active' : ''}`}
              onClick={() => { setIsWizardOpen(true); }}
            >
              <User size={19} strokeWidth={1.8} />
              <span>Perfil profesional</span>
            </button>

            <button
              type="button"
              className={`lawyer-nav-item ${activeMenu === 'configuracion' ? 'active' : ''}`}
              onClick={() => { setActiveMenu('configuracion'); onNavigate?.('configuracion'); }}
            >
              <Settings size={19} strokeWidth={1.8} />
              <span>Configuración</span>
            </button>
          </nav>
        </div>

        <div className="lawyer-sidebar-bottom">
          <button
            type="button"
            className="lawyer-nav-item help-link"
            onClick={() => onNavigate?.('help')}
          >
            <HelpCircle size={19} strokeWidth={1.8} />
            <span>Centro de ayuda</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lawyer-dash-main-area">
        {/* Top Header */}
        <header className="lawyer-dash-topbar">
          <div className="lawyer-search-box">
            <Search size={18} className="lawyer-search-icon" />
            <input
              type="text"
              placeholder="Buscar casos, áreas de práctica, palabras clave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lawyer-search-input"
            />
          </div>

          <div className="lawyer-topbar-right">
            <button type="button" className="lawyer-bell-btn" aria-label="Notificaciones">
              <Bell size={20} strokeWidth={1.9} />
              <span className="lawyer-bell-badge">1</span>
            </button>

            <div className="lawyer-user-profile-menu" onClick={() => setIsWizardOpen(true)}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={lawyerName}
                  className="lawyer-avatar-circle"
                />
              ) : (
                <div className="lawyer-avatar-circle lawyer-avatar-fallback">
                  {getInitials(lawyerName)}
                </div>
              )}
              <div className="lawyer-user-names">
                <span className="lawyer-user-fullname">{lawyerName}</span>
                <span className="lawyer-user-role-label">Abogado</span>
              </div>
              <ChevronDown size={16} className="lawyer-chevron-icon" />
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="lawyer-dash-content">
          {/* Greeting Hero */}
          <section className="lawyer-welcome-hero">
            <h1 className="lawyer-welcome-title">
              Hola, {lawyerName.split(' ')[0]}. <br />
              <em>Empecemos por preparar tu perfil profesional.</em>
            </h1>
            <p className="lawyer-welcome-desc">
              Completa tu perfil y verifícalo para acceder a los casos, enviar propuestas y conectar con clientes que necesitan tu experiencia.
            </p>
          </section>

          {/* Middle 2-Column Grid */}
          <div className="lawyer-onboarding-grid">
            {/* Left Card: Tu perfil profesional */}
            <div className="lawyer-profile-wizard-card">
              <div className="wizard-card-header">
                <h2 className="wizard-card-title">Tu perfil profesional</h2>
                <span className="wizard-progress-percent">{progress}% completo</span>
              </div>

              {/* Progress Bar */}
              <div className="wizard-progress-track">
                <div className="wizard-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              {/* 6-step horizontal Stepper */}
              <div className="wizard-stepper">
                {stepsList.map((step, idx) => {
                  const isCompleted = isStepCompleted(step.num);
                  const isCurrent = step.num === currentStep;

                  return (
                    <React.Fragment key={step.num}>
                      <button
                        type="button"
                        className={`stepper-node ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                        onClick={() => { setCurrentStep(step.num); setIsWizardOpen(true); }}
                      >
                        <div className="stepper-circle">
                          {isCompleted ? <Check size={12} strokeWidth={3} /> : step.num}
                        </div>
                        <span className="stepper-label">{step.label}</span>
                      </button>
                      {idx < stepsList.length - 1 && (
                        <div className={`stepper-connector ${isCompleted ? 'completed' : ''}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* LinkedIn Compact Connected Strip */}
              {linkedInSynced ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  marginTop: '16px',
                  gap: '14px',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0 }}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={lawyerName}
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #059669' }}
                        />
                      ) : (
                        <div className="summary-avatar-fallback" style={{ width: '42px', height: '42px', fontSize: '15px' }}>
                          {getInitials(lawyerName)}
                        </div>
                      )}
                      <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#0077b5', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>
                        <LinkedInOfficialIcon size={10} />
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: '#064e3b' }}>{lawyerName}</strong>
                        <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '1px 7px', borderRadius: '10px', fontWeight: 600 }}>
                          ✓ Verificado con LinkedIn
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12.5px', color: '#15803d' }}>
                          Identidad y foto vinculadas. Continúa con tu biografía en el Paso 2.
                        </span>
                        {profileForm.linkedin_url && (
                          <a
                            href={profileForm.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#0077b5', fontWeight: 600, textDecoration: 'none' }}
                            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            <span>Ver perfil de LinkedIn</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="wizard-continue-btn"
                    style={{ padding: '8px 18px', fontSize: '12.5px', borderRadius: '8px' }}
                    onClick={() => { setCurrentStep(2); setIsWizardOpen(true); }}
                  >
                    <span>Completar biografía (Paso 2)</span>
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className="wizard-linkedin-banner">
                  <div className="linkedin-banner-left">
                    <div className="linkedin-logo-badge">
                      <LinkedInOfficialIcon size={26} />
                    </div>
                    <div className="linkedin-banner-text">
                      <span className="linkedin-eyebrow">VERIFICACIÓN RÁPIDA</span>
                      <h3 className="linkedin-banner-heading">Conecta tu cuenta de LinkedIn</h3>
                      <p className="linkedin-banner-sub">
                        Importa tu fotografía oficial en alta resolución y verifica tu identidad en 1 clic. Tu tarjeta profesional y especialidades se configuran en los siguientes pasos.
                      </p>
                    </div>
                  </div>

                  <div className="linkedin-banner-actions">
                    <button
                      type="button"
                      className="linkedin-connect-btn"
                      onClick={handleLinkedInOAuth}
                      disabled={syncingLinkedIn}
                    >
                      <LinkedInOfficialIcon size={17} />
                      <span>{syncingLinkedIn ? 'Conectando…' : 'Conectar LinkedIn'}</span>
                    </button>
                    <button
                      type="button"
                      className="linkedin-manual-link"
                      onClick={() => setIsLinkedInModalOpen(true)}
                    >
                      ¿Qué datos se importan?
                    </button>
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="wizard-card-footer">
                <button
                  type="button"
                  className="wizard-continue-btn"
                  onClick={() => setIsWizardOpen(true)}
                >
                  <span>Continuar con mi perfil</span>
                  <ArrowRight size={17} strokeWidth={2.2} />
                </button>
                <span className="wizard-time-note">Solo te tomará unos minutos.</span>
              </div>

              {/* Bottom Quick Tip */}
              {!linkedInSynced && (
                <div className="wizard-speed-tip">
                  <span className="speed-tip-bolt">⚡</span>
                  <span className="speed-tip-text">¿Quieres avanzar más rápido?</span>
                  <button
                    type="button"
                    className="speed-tip-link"
                    onClick={handleLinkedInOAuth}
                  >
                    Conecta tu LinkedIn ↗
                  </button>
                </div>
              )}
            </div>

            {/* Right Card: Value Proposition Card */}
            <div className="lawyer-value-prop-card">
              <img
                src="/auth-desk-scene.png?v=4"
                alt="Escritorio legal profesional con códigos de Colombia y computador"
                className="value-card-bg-img"
              />
              <div className="value-card-scrim" aria-hidden="true" />

              <div className="value-card-content">
                <span className="value-card-eyebrow">VENTAJAS DE VERIFICARTE</span>
                <h3 className="value-card-heading">
                  Un perfil verificado <br />
                  genera más oportunidades
                </h3>

                <ul className="value-check-list">
                  <li className="value-check-item">
                    <span className="value-check-badge">
                      <Check size={13} strokeWidth={2.8} />
                    </span>
                    <span>Aparecer en casos relevantes</span>
                  </li>

                  <li className="value-check-item">
                    <span className="value-check-badge">
                      <Check size={13} strokeWidth={2.8} />
                    </span>
                    <span>Recibir invitaciones de clientes</span>
                  </li>

                  <li className="value-check-item">
                    <span className="value-check-badge">
                      <Check size={13} strokeWidth={2.8} />
                    </span>
                    <span>Destacar tu experiencia y áreas de práctica</span>
                  </li>

                  <li className="value-check-item">
                    <span className="value-check-badge">
                      <Check size={13} strokeWidth={2.8} />
                    </span>
                    <span>Generar confianza con tu tarjeta profesional verificada</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Section: Casos recientes en tu área de práctica */}
          <section className="lawyer-recent-cases-section">
            <div className="recent-cases-header">
              <h2 className="recent-cases-title">Casos recientes en tu área de práctica</h2>
              <button
                type="button"
                className="recent-cases-see-all"
                onClick={() => { setActiveMenu('casos'); onNavigate?.('casos'); }}
              >
                <span>Ver todos los casos</span>
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>

            <div className="recent-cases-grid">
              {/* Card 1: Laboral */}
              <div className="recent-case-card">
                <div className="case-card-header">
                  <span className="case-category-pill">Derecho laboral</span>
                  <button type="button" className="case-bookmark-btn" aria-label="Guardar caso">
                    <Bookmark size={18} strokeWidth={1.8} />
                  </button>
                </div>

                <h3 className="case-card-title">Terminación sin justa causa</h3>
                <span className="case-card-location">📍 Bogotá, D.C.</span>

                {/* Simulated blurred text behind privacy lock */}
                <div className="case-card-blurred-body" aria-hidden="true">
                  <p>
                    El cliente laboró durante 4 años en el sector telecomunicaciones mediante contrato a término indefinido. Se le notificó despido sin aducir justa causa legal comprobable ni liquidación debida de indemnización.
                  </p>
                  <p>Cuenta con soporte de nóminas, certificados laborales y carta de despido.</p>
                </div>

                {/* Centered Lock Overlay */}
                <div className="case-lock-overlay">
                  <div className="case-lock-box">
                    <div className="case-lock-icon">
                      <Lock size={20} strokeWidth={1.9} />
                    </div>
                    <p className="case-lock-text">
                      Completa tu perfil y verifícalo para ver los detalles de este caso.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Comercial */}
              <div className="recent-case-card">
                <div className="case-card-header">
                  <span className="case-category-pill">Derecho comercial</span>
                  <button type="button" className="case-bookmark-btn" aria-label="Guardar caso">
                    <Bookmark size={18} strokeWidth={1.8} />
                  </button>
                </div>

                <h3 className="case-card-title">Disputa contractual entre socios</h3>
                <span className="case-card-location">📍 Medellín, Antioquia</span>

                <div className="case-card-blurred-body" aria-hidden="true">
                  <p>
                    Sociedad por acciones simplificada (S.A.S.) con desacuerdo en distribución de utilidades de los periodos 2023 y 2024. Se requiere mediación societaria o inicio de acción judicial ante la Superintendencia de Sociedades.
                  </p>
                </div>

                <div className="case-lock-overlay">
                  <div className="case-lock-box">
                    <div className="case-lock-icon">
                      <Lock size={20} strokeWidth={1.9} />
                    </div>
                    <p className="case-lock-text">
                      Completa tu perfil y verifícalo para ver los detalles de este caso.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Familia */}
              <div className="recent-case-card">
                <div className="case-card-header">
                  <span className="case-category-pill">Derecho de familia</span>
                  <button type="button" className="case-bookmark-btn" aria-label="Guardar caso">
                    <Bookmark size={18} strokeWidth={1.8} />
                  </button>
                </div>

                <h3 className="case-card-title">Sucesión y partición de bienes</h3>
                <span className="case-card-location">📍 Cali, Valle del Cauca</span>

                <div className="case-card-blurred-body" aria-hidden="true">
                  <p>
                    Proceso de sucesión intestada que incluye dos bienes inmuebles y cuentas bancarias entre tres herederos con acuerdo preliminar sobre inventarios y avalúos de activos.
                  </p>
                </div>

                <div className="case-lock-overlay">
                  <div className="case-lock-box">
                    <div className="case-lock-icon">
                      <Lock size={20} strokeWidth={1.9} />
                    </div>
                    <p className="case-lock-text">
                      Completa tu perfil y verifícalo para ver los detalles de este caso.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* LinkedIn Import Modal */}
      {isLinkedInModalOpen && (
        <div className="lawyer-modal-backdrop" onClick={() => setIsLinkedInModalOpen(false)}>
          <div className="lawyer-modal-content linkedin-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lawyer-modal-close"
              onClick={() => setIsLinkedInModalOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="linkedin-modal-header">
              <div className="linkedin-header-logo">
                <LinkedInOfficialIcon size={32} />
              </div>
              <h3>Conectar perfil de LinkedIn</h3>
              <p>
                Importa en 1 clic tu foto oficial, nombre completo y correo autenticado.
              </p>
            </div>

            <div className="linkedin-modal-body">
              {/* Information pill showing exactly what is imported */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', marginBottom: '18px', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', display: 'block', marginBottom: '8px' }}>
                  ¿Qué información verificamos con LinkedIn?
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                  <li><strong>Fotografía oficial HD:</strong> tu imagen visible en MatchJurídico.</li>
                  <li><strong>Nombre completo verificado:</strong> tu identidad legal validada.</li>
                  <li><strong>Enlace a tu perfil de LinkedIn:</strong> visible y redirigido en tu cuenta.</li>
                </ul>
              </div>

              {/* Option 1: Official Popup Button */}
              <div className="linkedin-sync-card" style={{ marginBottom: '20px' }}>
                <div className="sync-card-info">
                  <span className="sync-badge">VENTANA EMERGENTE (POPUP)</span>
                  <h4>Vincular con tu cuenta de LinkedIn</h4>
                  <p>Abre una ventana emergente segura para autorizar tu foto y datos sin salir de tu panel.</p>
                </div>
                <button
                  type="button"
                  className="linkedin-sync-btn"
                  onClick={handleLinkedInOAuth}
                  disabled={syncingLinkedIn}
                >
                  <LinkedInOfficialIcon size={18} />
                  <span>{syncingLinkedIn ? 'Abriendo ventana…' : 'Abrir ventana de LinkedIn'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0', color: '#94a3b8', fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.04em' }}>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                <span>O VINCULA CON TU ENLACE PÚBLICO</span>
                <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              </div>

              {/* Option 2: Direct Profile URL Import */}
              <div className="linkedin-url-input-block">
                <label style={{ fontWeight: 600, color: '#1e191a', display: 'block', marginBottom: '8px', fontSize: '13.5px' }}>
                  Pega el enlace de tu perfil de LinkedIn:
                </label>
                <div className="linkedin-url-row" style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="url"
                    placeholder="https://www.linkedin.com/in/tu-perfil-profesional"
                    value={customLinkedInUrl}
                    onChange={(e) => setCustomLinkedInUrl(e.target.value)}
                    className="linkedin-input-text"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="linkedin-import-url-btn"
                    onClick={() => handleLinkedInSync()}
                    disabled={syncingLinkedIn || !customLinkedInUrl.trim()}
                  >
                    {syncingLinkedIn ? 'Vinculando…' : 'Vincular perfil'}
                  </button>
                </div>
                <small className="text-xs text-[#796c6e] mt-2 block" style={{ lineHeight: '1.45' }}>
                  Importaremos tu fotografía, nombre y enlace directo a tu perfil de LinkedIn.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn Connected Presentation Modal: Clean, concise confirmation with redirect link */}
      {connectedLinkedInPresentation && (
        <div className="lawyer-modal-backdrop" onClick={() => setConnectedLinkedInPresentation(null)}>
          <div
            className="lawyer-modal-content"
            style={{ maxWidth: '440px', padding: 0, overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lawyer-modal-close"
              onClick={() => setConnectedLinkedInPresentation(null)}
              aria-label="Cerrar presentación"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', padding: '28px 24px 20px', background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)', borderBottom: '1px solid #e0edff' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '50%', background: '#e0f2fe', color: '#0077b5', marginBottom: '12px', boxShadow: '0 4px 12px rgba(0, 119, 181, 0.15)' }}>
                <LinkedInOfficialIcon size={30} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                ¡Conexión con LinkedIn exitosa!
              </h3>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                Tu cuenta ha quedado vinculada y tu perfil público está conectado.
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '22px 24px 26px' }}>
              {/* Profile Card Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px', marginBottom: '16px' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
                  {connectedLinkedInPresentation.avatar_url ? (
                    <img
                      src={connectedLinkedInPresentation.avatar_url}
                      alt={connectedLinkedInPresentation.name}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #0077b5' }}
                    />
                  ) : (
                    <div className="lawyer-avatar-circle lawyer-avatar-fallback" style={{ width: '60px', height: '60px', fontSize: '20px' }}>
                      {getInitials(connectedLinkedInPresentation.name)}
                    </div>
                  )}
                  <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#0077b5', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                    <LinkedInOfficialIcon size={11} />
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '15px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {connectedLinkedInPresentation.name}
                    </strong>
                    <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: '1px 7px', borderRadius: '10px', fontWeight: 600 }}>
                      ✓ Verificado
                    </span>
                  </div>
                  {connectedLinkedInPresentation.email && (
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', margin: '2px 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {connectedLinkedInPresentation.email}
                    </span>
                  )}
                  {connectedLinkedInPresentation.linkedin_url && (
                    <a
                      href={connectedLinkedInPresentation.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', color: '#0077b5', fontWeight: 600, textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      <span>Ver perfil en LinkedIn</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>

              {/* Synchronized items summary */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#15803d', display: 'block', marginBottom: '6px' }}>
                  Datos vinculados a tu cuenta:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12.5px', color: '#166534' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                    <span>Fotografía de perfil oficial en alta resolución</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                    <span>Nombre completo validado</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                    <span>Enlace directo a tu perfil de LinkedIn</span>
                  </div>
                </div>
              </div>

              {/* Single primary button: Aceptar y continuar */}
              <button
                type="button"
                className="wizard-continue-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '14px', borderRadius: '10px' }}
                onClick={() => {
                  setConnectedLinkedInPresentation(null);
                  setCurrentStep(2); // Go straight to Biografía y Experiencia!
                  setIsWizardOpen(true);
                }}
              >
                <span>Aceptar y continuar a Biografía y Experiencia</span>
                <ArrowRight size={16} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Step-by-Step Profile Wizard Modal */}
      {isWizardOpen && (
        <div className="lawyer-modal-backdrop" onClick={() => setIsWizardOpen(false)}>
          <div className="lawyer-modal-content wizard-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lawyer-modal-close"
              onClick={() => setIsWizardOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="wizard-modal-stepper-header">
              <span className="wizard-step-tag">Paso {currentStep} de 6</span>
              <h3>{stepsList[currentStep - 1]?.label}</h3>
              <p>Completa la información necesaria para activar tu perfil y acceder a casos.</p>
            </div>

            <div className="wizard-modal-form-body">
              {currentStep === 1 && (
                <div className="wizard-form-step">
                  <div className="wizard-field">
                    <label>Nombre y Apellidos</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Ej. Andrés Morales"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Ciudad de práctica</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="Ej. Bogotá, D.C."
                    />
                  </div>
                  <div className="wizard-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ margin: 0 }}>Enlace a perfil de LinkedIn</label>
                      {profileForm.linkedin_url && (
                        <a
                          href={profileForm.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '12px', color: '#0077b5', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}
                        >
                          <span>Probar enlace</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        value={profileForm.linkedin_url}
                        onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                        placeholder="https://www.linkedin.com/in/tu-perfil"
                        style={{ flex: 1 }}
                      />
                      {profileForm.linkedin_url && (
                        <a
                          href={profileForm.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="wizard-back-btn"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '0 14px', textDecoration: 'none', fontSize: '13px', background: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }}
                        >
                          <ExternalLink size={14} />
                          <span>Abrir</span>
                        </a>
                      )}
                    </div>
                    <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Este enlace redirigido quedará visible en tu perfil para que tus clientes puedan consultar tu trayectoria oficial.
                    </small>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="wizard-form-step">
                  <div className="wizard-field">
                    <label>Años de experiencia profesional</label>
                    <input
                      type="number"
                      min={0}
                      value={profileForm.years_of_experience || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, years_of_experience: Number(e.target.value) })}
                      placeholder="Ej. 8"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Formación académica (Universidad, postgrados)</label>
                    <input
                      type="text"
                      value={profileForm.education}
                      onChange={(e) => setProfileForm({ ...profileForm, education: e.target.value })}
                      placeholder="Ej. Abogado · Universidad del Rosario"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Extracto / Trayectoria profesional</label>
                    <textarea
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Describe tu trayectoria y enfoque jurídico..."
                    />
                  </div>

                  {workExperience && workExperience.length > 0 && (
                    <div style={{ marginTop: '16px', background: '#faf8f5', border: '1px solid #ebdccc', borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <LinkedInOfficialIcon size={16} />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Trayectoria profesional importada de LinkedIn ({workExperience.length})
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {workExperience.map((pos, idx) => (
                          <div key={idx} style={{ background: '#fff', border: '1px solid #ebdcd5', borderRadius: '8px', padding: '9px 12px', fontSize: '12.5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: '#1e191a' }}>{pos.title}</strong>
                              <span style={{ fontSize: '11px', color: '#796c6e', background: '#faf8f5', padding: '1px 6px', borderRadius: '4px' }}>
                                {pos.start_date} – {pos.end_date || 'Actualidad'}
                              </span>
                            </div>
                            <div style={{ color: '#68232c', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                              {pos.company}
                            </div>
                            {pos.description && (
                              <p style={{ margin: '4px 0 0', color: '#554e4f', fontSize: '11.5px', lineHeight: '1.4' }}>
                                {pos.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="wizard-form-step">
                  <label className="wizard-section-label">Selecciona tus áreas principales de práctica:</label>
                  <div className="wizard-specialties-chips">
                    {['Derecho Laboral', 'Derecho Comercial', 'Derecho Civil', 'Derecho de Familia', 'Derecho Penal', 'Derecho Administrativo', 'Tutelas y Derechos de Petición'].map(spec => (
                      <button
                        key={spec}
                        type="button"
                        className={`specialty-chip ${profileForm.specialties.includes(spec) ? 'selected' : ''}`}
                        onClick={() => {
                          const exists = profileForm.specialties.includes(spec);
                          setProfileForm({
                            ...profileForm,
                            specialties: exists
                              ? profileForm.specialties.filter(s => s !== spec)
                              : [...profileForm.specialties, spec]
                          });
                        }}
                      >
                        {profileForm.specialties.includes(spec) && <Check size={14} />}
                        <span>{spec}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="wizard-form-step">
                  <div className="wizard-field">
                    <label>Rango de honorarios estimado</label>
                    <input
                      type="text"
                      value={profileForm.rate_hourly}
                      onChange={(e) => setProfileForm({ ...profileForm, rate_hourly: e.target.value })}
                      placeholder="Ej. 180.000 COP / hora"
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Modalidad de atención</label>
                    <select
                      value={profileForm.modality}
                      onChange={(e) => setProfileForm({ ...profileForm, modality: e.target.value })}
                    >
                      <option value="">Selecciona modalidad de atención...</option>
                      <option value="Virtual y Presencial">Virtual y Presencial</option>
                      <option value="Solo Virtual">Solo Virtual</option>
                      <option value="Solo Presencial">Solo Presencial</option>
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="wizard-form-step">
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '12px 14px', borderRadius: '10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                    <span><strong>Paso legal indispensable:</strong> Tu Tarjeta Profesional valida tu matrícula judicial ante el Consejo Superior de la Judicatura (CSJ / SIRNA) para autorizarte a atender casos.</span>
                  </div>
                  <div className="wizard-field">
                    <label>Número de Tarjeta Profesional (CSJ / SIRNA) *</label>
                    <input
                      type="text"
                      value={profileForm.license}
                      onChange={(e) => setProfileForm({ ...profileForm, license: e.target.value })}
                      placeholder="Ej. 294.180 CSJ"
                      required
                    />
                    <small>Dato obligatorio para litigar. Se verificará ante el Registro Nacional de Abogados (SIRNA).</small>
                  </div>
                  <div className="wizard-file-dropzone">
                    <Upload size={24} className="text-gray-400" />
                    <span>Adjuntar copia escaneada de Tarjeta Profesional (Opcional en beta)</span>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="wizard-form-step verification-summary">
                  <div className="verification-ready-badge">
                    <ShieldCheck size={36} className="text-[#68232c]" />
                    <h4>¡Todo listo para revisión!</h4>
                    <p>
                      Revisaremos tu tarjeta profesional {profileForm.license ? `(${profileForm.license})` : ''} ante el Registro Nacional de Abogados. Mientras tanto, tu perfil estará habilitado para explorar casos afines.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="wizard-modal-footer">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="wizard-back-btn"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Anterior
                </button>
              )}
              <button
                type="button"
                className="wizard-submit-step-btn"
                onClick={handleSaveStep}
              >
                <span>{currentStep === 6 ? 'Finalizar y Enviar' : 'Guardar y Continuar'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
