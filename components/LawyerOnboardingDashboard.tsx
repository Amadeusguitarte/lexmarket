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
} from 'lucide-react';
import { getSampleLinkedInLawyer, type LinkedInProfileData } from '@/lib/linkedin';

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

export function LexMarketScaleLogo({ size = 28 }: { size?: number }) {
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

export default function LawyerOnboardingDashboard({
  initialLawyerName = 'Juan Pérez',
  initialAvatar = '/lawyers/juan-perez.jpg',
  onNavigate,
  onSaveProfile,
  onOpenCase,
  onLogout,
}: LawyerOnboardingProps) {
  // State for active sidebar menu
  const [activeMenu, setActiveMenu] = useState('inicio');
  
  // Profile progress state (starts at 20% like in screenshot)
  const [progress, setProgress] = useState(20);
  const [currentStep, setCurrentStep] = useState(1);
  const [lawyerName, setLawyerName] = useState(initialLawyerName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [linkedInSynced, setLinkedInSynced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Wizard modal state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [syncingLinkedIn, setSyncingLinkedIn] = useState(false);
  const [customLinkedInUrl, setCustomLinkedInUrl] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Form step data
  const [profileForm, setProfileForm] = useState({
    name: initialLawyerName,
    city: 'Bogotá, D.C.',
    license: '312.489 CSJ',
    specialties: ['Derecho Laboral', 'Derecho Comercial'],
    years_of_experience: 8,
    education: 'Abogado · Universidad del Rosario',
    bio: 'Abogado con más de 8 años de experiencia en litigio laboral y corporativo en Colombia.',
    rate_hourly: '180.000 COP / hora',
    modality: 'Virtual y Presencial',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleLinkedInSync = async (sampleData?: LinkedInProfileData) => {
    setSyncingLinkedIn(true);
    try {
      // Call LinkedIn sync endpoint or fallback to client simulation
      const data = sampleData || getSampleLinkedInLawyer();
      
      try {
        const res = await fetch('/api/me/linkedin-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, demo: true }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.profile) {
            setLawyerName(json.profile.name || data.name);
            if (json.profile.avatar_url) setAvatarUrl(json.profile.avatar_url);
          }
        }
      } catch {
        // Fallback smooth local sync
      }

      setLawyerName(data.name);
      setAvatarUrl(data.avatar_url || '/lawyers/juan-perez.jpg');
      setProfileForm(prev => ({
        ...prev,
        name: data.name,
        city: data.city || prev.city,
        education: data.education || prev.education,
        bio: data.bio || prev.bio,
        years_of_experience: data.years_of_experience || prev.years_of_experience,
        specialties: data.specialties?.length ? data.specialties : prev.specialties,
      }));

      setLinkedInSynced(true);
      setProgress(85);
      setCurrentStep(4);
      setIsLinkedInModalOpen(false);
      showToast('¡Datos de LinkedIn importados con éxito! Foto, trayectoria y educación sincronizados.');
    } catch (err: any) {
      showToast('No se pudo sincronizar en este momento. Puedes completar manualmente.');
    } finally {
      setSyncingLinkedIn(false);
    }
  };

  const handleSaveStep = async () => {
    const nextStep = Math.min(currentStep + 1, 6);
    setCurrentStep(nextStep);
    const newProgress = Math.min(progress + 15, 100);
    setProgress(newProgress);
    
    if (onSaveProfile) {
      await onSaveProfile({
        ...profileForm,
        role: 'lawyer',
      });
    }

    if (nextStep === 6) {
      setIsWizardOpen(false);
      showToast('¡Perfil enviado a verificación exitosamente!');
    }
  };

  const stepsList = [
    { num: 1, label: 'Datos básicos' },
    { num: 2, label: 'Tarjeta profesional' },
    { num: 3, label: 'Áreas de práctica' },
    { num: 4, label: 'Experiencia' },
    { num: 5, label: 'Honorarios y preferencias' },
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
            <LexMarketScaleLogo size={32} />
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

            <div className="lawyer-user-profile-menu">
              <img
                src={avatarUrl}
                alt={lawyerName}
                className="lawyer-avatar-circle"
              />
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
                  const isCompleted = step.num < currentStep || (linkedInSynced && (step.num === 1 || step.num === 3 || step.num === 4));
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

              {/* LinkedIn Import Banner */}
              <div className="wizard-linkedin-banner">
                <div className="linkedin-banner-left">
                  <div className="linkedin-logo-badge">
                    <LinkedInOfficialIcon size={26} />
                  </div>
                  <div className="linkedin-banner-text">
                    <span className="linkedin-eyebrow">ACELERA TU PERFIL</span>
                    <h3 className="linkedin-banner-heading">Conecta tu LinkedIn</h3>
                    <p className="linkedin-banner-sub">
                      Importa tu experiencia, cargos, formación y trayectoria profesional para completar tu perfil más rápido.
                    </p>
                  </div>
                </div>

                <div className="linkedin-banner-actions">
                  <button
                    type="button"
                    className="linkedin-connect-btn"
                    onClick={() => setIsLinkedInModalOpen(true)}
                    disabled={syncingLinkedIn}
                  >
                    <LinkedInOfficialIcon size={17} />
                    <span>{syncingLinkedIn ? 'Sincronizando…' : 'Conectar LinkedIn'}</span>
                  </button>
                  <button
                    type="button"
                    className="linkedin-manual-link"
                    onClick={() => setIsWizardOpen(true)}
                  >
                    Prefiero hacerlo manualmente
                  </button>
                </div>
              </div>

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
              <div className="wizard-speed-tip">
                <span className="speed-tip-bolt">⚡</span>
                <span className="speed-tip-text">¿Quieres avanzar más rápido?</span>
                <button
                  type="button"
                  className="speed-tip-link"
                  onClick={() => setIsLinkedInModalOpen(true)}
                >
                  Conecta tu LinkedIn ↗
                </button>
              </div>
            </div>

            {/* Right Card: Value Proposition Card */}
            <div className="lawyer-value-prop-card">
              <div className="value-card-photo-wrapper">
                <img
                  src="/auth-desk-scene.png?v=4"
                  alt="Escritorio legal con códigos de Colombia y portátil"
                  className="value-card-photo"
                />
              </div>

              <div className="value-card-content">
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
              <h3>Importar datos desde LinkedIn</h3>
              <p>
                Conecta tu perfil profesional para autocompletar foto de perfil, formación, experiencia y especialidades de forma instantánea.
              </p>
            </div>

            <div className="linkedin-modal-body">
              {/* Option A: Fast Demo / 1-Click Sync */}
              <div className="linkedin-sync-card active">
                <div className="sync-card-info">
                  <span className="sync-badge">RECOMENDADO</span>
                  <h4>Sincronización profesional en 1 clic</h4>
                  <p>Importa automáticamente foto de alta resolución, titulación de la Universidad del Rosario y experiencia legal en Colombia.</p>
                </div>
                <button
                  type="button"
                  className="linkedin-sync-btn"
                  onClick={() => handleLinkedInSync()}
                  disabled={syncingLinkedIn}
                >
                  <LinkedInOfficialIcon size={18} />
                  <span>{syncingLinkedIn ? 'Sincronizando…' : 'Importar mi LinkedIn ahora'}</span>
                </button>
              </div>

              {/* Option B: Profile URL Input */}
              <div className="linkedin-url-input-block">
                <label>O ingresa el enlace de tu perfil de LinkedIn:</label>
                <div className="linkedin-url-row">
                  <input
                    type="url"
                    placeholder="https://www.linkedin.com/in/tu-perfil-profesional"
                    value={customLinkedInUrl}
                    onChange={(e) => setCustomLinkedInUrl(e.target.value)}
                    className="linkedin-input-text"
                  />
                  <button
                    type="button"
                    className="linkedin-import-url-btn"
                    onClick={() => handleLinkedInSync()}
                    disabled={syncingLinkedIn}
                  >
                    Importar
                  </button>
                </div>
              </div>
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
                      placeholder="Ej. Juan Pérez"
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
                </div>
              )}

              {currentStep === 2 && (
                <div className="wizard-form-step">
                  <div className="wizard-field">
                    <label>Número de Tarjeta Profesional (CSJ / SIRNA)</label>
                    <input
                      type="text"
                      value={profileForm.license}
                      onChange={(e) => setProfileForm({ ...profileForm, license: e.target.value })}
                      placeholder="Ej. 312.489 CSJ"
                    />
                    <small>Se verificará de forma oficial con el Registro Nacional de Abogados (SIRNA).</small>
                  </div>
                  <div className="wizard-file-dropzone">
                    <Upload size={24} className="text-gray-400" />
                    <span>Adjuntar copia escaneada de Tarjeta Profesional (Opcional en beta)</span>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="wizard-form-step">
                  <label className="wizard-section-label">Selecciona tus áreas principales:</label>
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
                    <label>Años de experiencia profesional</label>
                    <input
                      type="number"
                      value={profileForm.years_of_experience}
                      onChange={(e) => setProfileForm({ ...profileForm, years_of_experience: Number(e.target.value) })}
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
                    />
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="wizard-form-step">
                  <div className="wizard-field">
                    <label>Rango de honorarios estimado</label>
                    <input
                      type="text"
                      value={profileForm.rate_hourly}
                      onChange={(e) => setProfileForm({ ...profileForm, rate_hourly: e.target.value })}
                    />
                  </div>
                  <div className="wizard-field">
                    <label>Modalidad de atención</label>
                    <select
                      value={profileForm.modality}
                      onChange={(e) => setProfileForm({ ...profileForm, modality: e.target.value })}
                    >
                      <option value="Virtual y Presencial">Virtual y Presencial</option>
                      <option value="Solo Virtual">Solo Virtual</option>
                      <option value="Solo Presencial">Solo Presencial</option>
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="wizard-form-step verification-summary">
                  <div className="verification-ready-badge">
                    <ShieldCheck size={36} className="text-[#68232c]" />
                    <h4>¡Todo listo para revisión!</h4>
                    <p>
                      Revisaremos tu tarjeta profesional ante el Registro Nacional de Abogados. Mientras tanto, tu perfil estará habilitado para explorar casos afines.
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
