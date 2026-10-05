import React from 'react';
(globalThis as any).React = React;
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile, writeFile } from 'node:fs/promises';
import Landing from '../components/Landing';
import AuthModal from '../components/AuthModal';
import LawyerOnboardingDashboard from '../components/LawyerOnboardingDashboard';

const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

const landingMarkup = renderToStaticMarkup(
  React.createElement(Landing, {
    onStart: () => {},
    onLawyer: () => {},
    onLogin: () => {},
    onInfo: () => {},
  })
);

const authMarkup = renderToStaticMarkup(
  React.createElement(AuthModal, {
    authMode: 'signup',
    role: 'client',
    googleReady: true,
    busy: false,
    authReady: true,
    onClose: () => {},
    onModeChange: () => {},
    onInfo: () => {},
    onSubmit: () => {},
    onContinueGoogle: () => {},
  })
);

const lawyerMarkup = renderToStaticMarkup(
  React.createElement(LawyerOnboardingDashboard, {
    initialLawyerName: 'Abogado',
    initialAvatar: '',
  })
);

const markup = `
<div id="lawyer-dashboard-view" class="preview-switch-view" style="display:none">
  ${lawyerMarkup}
</div>
<div id="landing-view" class="preview-switch-view">
  ${landingMarkup}
  ${authMarkup}
</div>
<div class="preview-nav-floater" style="position:fixed;bottom:18px;left:18px;z-index:99999;display:flex;gap:8px;background:rgba(255,255,255,0.96);backdrop-filter:blur(10px);padding:8px 12px;border-radius:28px;box-shadow:0 8px 30px rgba(0,0,0,0.18);border:1px solid #ebdccc;">
  <a href="#landing" id="btn-show-landing" style="font-size:12px;font-weight:600;padding:6px 14px;border-radius:18px;text-decoration:none;color:#4a4344;background:#f3ede5;display:inline-flex;align-items:center;">Landing Principal</a>
  <a href="#registro" id="btn-show-registro" style="font-size:12px;font-weight:600;padding:6px 14px;border-radius:18px;text-decoration:none;color:#4a4344;background:#f3ede5;display:inline-flex;align-items:center;">Modal Registro</a>
  <a href="#abogado" id="btn-show-abogado" style="font-size:12px;font-weight:700;padding:6px 14px;border-radius:18px;text-decoration:none;color:#ffffff;background:#68232c;display:inline-flex;align-items:center;gap:6px;">⚖️ Dashboard Abogado</a>
</div>
`;

const script = `
const examples = {
  'Una tutela': 'Revisar y presentar mi tutela',
  'Un asunto laboral': 'Revisar una reclamación laboral',
  'Una reclamación': 'Dar el siguiente paso con mi reclamación',
  'Un contrato': 'Revisar y ajustar un contrato'
};

document.querySelectorAll('.example-pill').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.example-pill').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    const title = document.querySelector('.dossier-card h2, .tu-caso-overlay h2');
    if (title) title.textContent = examples[button.textContent.trim()];
  });
});

// Interactive Sequential Steps Animation
(function() {
  const cards = Array.from(document.querySelectorAll('.how-steps-grid .step-card'));
  const dots = Array.from(document.querySelectorAll('.how-step-indicators .step-dot-btn'));
  const beam = document.querySelector('.how-timeline-beam');
  const wrapper = document.querySelector('.how-interactive-wrapper');
  if (!cards.length) return;

  let currentStep = 0;
  let isPaused = false;
  let interval = null;

  function setStep(idx) {
    currentStep = idx;
    cards.forEach((card, i) => {
      if (i === idx) {
        card.classList.add('active-step');
        card.setAttribute('aria-pressed', 'true');
      } else {
        card.classList.remove('active-step');
        card.setAttribute('aria-pressed', 'false');
      }
    });

    dots.forEach((dot, i) => {
      if (i === idx) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    if (beam && cards.length > 1) {
      beam.style.left = ((idx / (cards.length - 1)) * 100) + '%';
    }
  }

  function startCycle() {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      if (!isPaused) {
        setStep((currentStep + 1) % cards.length);
      }
    }, 4000);
  }

  function stopCycle() {
    if (interval) clearInterval(interval);
    interval = null;
  }

  cards.forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      setStep(idx);
    });
    card.addEventListener('mouseenter', () => {
      setStep(idx);
      isPaused = true;
    });
    card.addEventListener('mouseleave', () => {
      isPaused = false;
    });
  });

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      setStep(idx);
    });
  });

  if (wrapper) {
    wrapper.addEventListener('mouseenter', () => { isPaused = true; });
    wrapper.addEventListener('mouseleave', () => { isPaused = false; });
  }

  // Observer to start at step 01 as soon as scrolled into view
  const section = document.getElementById('como-funciona');
  if (section && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setStep(0);
          startCycle();
        } else {
          stopCycle();
          setStep(0);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(section);
  } else {
    setStep(0);
    startCycle();
  }
})();

// Wire up Auth Modal preview (strictly scoped to landing view)
(function() {
  const authDialog = document.querySelector('.auth-editorial-dialog');
  const closeBtn = document.querySelector('.auth-editorial-close');
  if (closeBtn && authDialog) {
    closeBtn.addEventListener('click', () => authDialog.close());
  }

  // Open auth modal ONLY on clicking 'Entrar' or related buttons inside #landing-view
  document.querySelectorAll('#landing-view button:not(.example-pill):not(.step-dot-btn):not(.lawyer-btn):not(.fees-cta-link)').forEach(button => {
    button.addEventListener('click', (e) => {
      const text = button.textContent?.trim().toLowerCase() || '';
      if (text.includes('entrar') || text.includes('cuenta') || text.includes('empezar') || text.includes('acceder')) {
        e.preventDefault();
        e.stopPropagation();
        if (authDialog && typeof authDialog.showModal === 'function') {
          authDialog.showModal();
          return;
        }
      }
    });
  });

  const previewClose = document.getElementById('preview-close');
  if (previewClose) {
    previewClose.onclick = () => document.getElementById('preview-info')?.close();
  }

  // Interactive role card toggling in preview
  const roleCards = document.querySelectorAll('.auth-role-card');
  const authSubtitle = document.querySelector('.auth-editorial-subtitle');
  roleCards.forEach(card => {
    card.addEventListener('click', () => {
      roleCards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
        const badge = c.querySelector('.auth-role-check-badge');
        if (badge) badge.remove();
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      if (!card.querySelector('.auth-role-check-badge')) {
        const badge = document.createElement('span');
        badge.className = 'auth-role-check-badge';
        badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
        card.prepend(badge);
      }
      if (authSubtitle) {
        const titleText = card.querySelector('.auth-role-title')?.textContent?.trim() || '';
        if (titleText.includes('abogado')) {
          authSubtitle.textContent = 'Conéctate con clientes verificados, accede a expedientes estructurados y asegura tus honorarios por etapas.';
        } else {
          authSubtitle.textContent = 'Guarda tu caso, organiza tu información y conéctate con abogados verificados cuando estés listo.';
        }
      }
    });
  });

  // View switcher between Landing and Lawyer Dashboard
  function updatePreviewView() {
    const hash = window.location.hash;
    const lawyerView = document.getElementById('lawyer-dashboard-view');
    const landingView = document.getElementById('landing-view');
    const authDialog = document.getElementById('auth-editorial-modal');
    const btnLanding = document.getElementById('btn-show-landing');
    const btnRegistro = document.getElementById('btn-show-registro');
    const btnAbogado = document.getElementById('btn-show-abogado');

    if (hash === '#abogado' || hash === '#abogado-dashboard') {
      if (lawyerView) lawyerView.style.display = 'block';
      if (landingView) landingView.style.display = 'none';
      if (authDialog && authDialog.open) authDialog.close();

      if (btnAbogado) { btnAbogado.style.background = '#68232c'; btnAbogado.style.color = '#ffffff'; }
      if (btnLanding) { btnLanding.style.background = '#f3ede5'; btnLanding.style.color = '#4a4344'; }
      if (btnRegistro) { btnRegistro.style.background = '#f3ede5'; btnRegistro.style.color = '#4a4344'; }
    } else {
      if (lawyerView) lawyerView.style.display = 'none';
      if (landingView) landingView.style.display = 'block';

      if (hash === '#registro' || hash === '#auth') {
        if (btnRegistro) { btnRegistro.style.background = '#68232c'; btnRegistro.style.color = '#ffffff'; }
        if (btnLanding) { btnLanding.style.background = '#f3ede5'; btnLanding.style.color = '#4a4344'; }
        if (btnAbogado) { btnAbogado.style.background = '#f3ede5'; btnAbogado.style.color = '#4a4344'; }
        setTimeout(() => {
          if (authDialog && typeof authDialog.showModal === 'function') {
            authDialog.showModal();
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          }
        }, 120);
      } else {
        if (btnLanding) { btnLanding.style.background = '#68232c'; btnLanding.style.color = '#ffffff'; }
        if (btnRegistro) { btnRegistro.style.background = '#f3ede5'; btnRegistro.style.color = '#4a4344'; }
        if (btnAbogado) { btnAbogado.style.background = '#f3ede5'; btnAbogado.style.color = '#4a4344'; }
        if (authDialog && authDialog.open) authDialog.close();
      }
    }
  }

  window.addEventListener('hashchange', updatePreviewView);
  updatePreviewView();
})();

// Lawyer Onboarding Dashboard interactive controls in preview
(function() {
  const lawyerRoot = document.getElementById('lawyer-dashboard-view');
  if (!lawyerRoot) return;

  function showToast(msg) {
    let toast = lawyerRoot.querySelector('.lawyer-dash-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'lawyer-dash-toast';
      lawyerRoot.prepend(toast);
    }
    toast.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-big text-emerald-600"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg><span>' + msg + '</span><button type="button" class="toast-close-x" style="background:none;border:none;cursor:pointer;color:#796c6e;font-size:16px;">✕</button>';
    toast.querySelector('.toast-close-x')?.addEventListener('click', () => toast.remove());
    setTimeout(() => { if (toast && toast.parentElement) toast.remove(); }, 6000);
  }

  // Open LinkedIn Modal
  lawyerRoot.querySelectorAll('.linkedin-connect-btn, .speed-tip-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLinkedInModal();
    });
  });

  // Open Wizard Modal
  lawyerRoot.querySelectorAll('.wizard-continue-btn, .linkedin-manual-link, .lawyer-user-profile-menu').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openWizardModal(1);
    });
  });

  // Stepper clicks
  lawyerRoot.querySelectorAll('.stepper-node').forEach((node, idx) => {
    node.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openWizardModal(idx + 1);
    });
  });

  function openLinkedInModal() {
    const existing = lawyerRoot.querySelector('.linkedin-modal-backdrop-custom');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'lawyer-modal-backdrop linkedin-modal-backdrop-custom';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(20,16,17,0.65);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    backdrop.innerHTML = \`
      <div class="lawyer-modal-content linkedin-modal-box" style="background:#fff;border-radius:20px;width:100%;max-width:540px;padding:32px;box-shadow:0 24px 60px rgba(0,0,0,0.25);position:relative;">
        <button type="button" class="lawyer-modal-close" style="position:absolute;top:20px;right:20px;background:none;border:none;cursor:pointer;font-size:20px;color:#796c6e;">✕</button>
        <div class="linkedin-modal-header" style="text-align:center;margin-bottom:24px;">
          <div style="color:#0077b5;margin-bottom:12px;display:flex;justify-content:center;">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
          </div>
          <h3 style="font-family:Georgia,serif;font-size:22px;color:#1e191a;margin:0 0 8px;">Conectar perfil de LinkedIn</h3>
          <p style="font-size:13.5px;color:#6a5e60;line-height:1.5;margin:0;">
            Importa tu fotografía, titular y biografía profesional. Los datos regulatorios como tu <strong>Tarjeta Profesional (CSJ)</strong> se ingresan manualmente en el siguiente paso.
          </p>
        </div>
        <div class="linkedin-modal-body" style="display:flex;flex-direction:column;gap:18px;">
          <div style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:13.5px;font-weight:600;color:#1e191a;">Pega el enlace de tu perfil de LinkedIn:</label>
            <div style="display:flex;gap:10px;">
              <input type="url" id="linkedin-preview-url" placeholder="https://www.linkedin.com/in/tu-perfil-profesional" style="flex:1;padding:11px 14px;border:1px solid #ebdccc;border-radius:10px;font-size:13.5px;box-sizing:border-box;" />
              <button type="button" id="btn-linkedin-preview-fetch" style="background:#0077b5;color:#fff;border:none;padding:11px 22px;border-radius:10px;font-size:13.5px;font-weight:600;cursor:pointer;white-space:nowrap;">Vincular perfil</button>
            </div>
            <small style="font-size:12px;color:#796c6e;line-height:1.45;">Extraeremos tu nombre, fotografía y titular público. Tu tarjeta profesional (CSJ) se ingresa manualmente por requisito legal.</small>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;font-size:13px;color:#475569;">
            <div style="width:32px;height:32px;border-radius:8px;background:#e0f2fe;color:#0284c7;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
            </div>
            <div style="flex:1;">
              <strong style="display:block;color:#1e293b;margin-bottom:2px;">Inicio de sesión oficial en 1 clic</strong>
              <span style="font-size:12px;color:#64748b;">Actualmente disponible vinculando el enlace de tu perfil arriba.</span>
            </div>
          </div>
        </div>
      </div>
    \`;

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
    });

    backdrop.querySelector('.lawyer-modal-close')?.addEventListener('click', () => backdrop.remove());

    const doImport = (name) => {
      const importedName = name || 'Carlos Mendoza';
      const welcomeTitle = lawyerRoot.querySelector('.lawyer-welcome-title');
      if (welcomeTitle) {
        welcomeTitle.innerHTML = 'Hola, ' + importedName.split(' ')[0] + '. <br><em>Empecemos por preparar tu perfil profesional.</em>';
      }
      const topbarName = lawyerRoot.querySelector('.lawyer-user-fullname');
      if (topbarName) topbarName.textContent = importedName;

      // Update initials in avatar circle
      const avatarFallback = lawyerRoot.querySelector('.lawyer-avatar-fallback');
      if (avatarFallback) {
        const initials = importedName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        avatarFallback.textContent = initials;
      }

      backdrop.remove();

      // Progress advances to 35%, Step 1 completed, Step 2 remains unchecked!
      const progFill = lawyerRoot.querySelector('.wizard-progress-fill');
      const progText = lawyerRoot.querySelector('.wizard-progress-percent');
      if (progFill) progFill.style.width = '35%';
      if (progText) progText.textContent = '35% completo';

      const step1 = lawyerRoot.querySelectorAll('.stepper-node')[0];
      if (step1) {
        step1.classList.add('completed');
        step1.querySelector('.stepper-circle').innerHTML = '✓';
      }

      showToast('Perfil de LinkedIn importado con éxito (nombre, titular y foto). Ahora ingresa tu Tarjeta Profesional (CSJ) en el Paso 2.');
      openWizardModal(2, importedName);
    };

    backdrop.querySelector('.btn-linkedin-oauth-trigger')?.addEventListener('click', () => {
      showToast('LinkedIn OAuth en vivo requiere configurar LINKEDIN_CLIENT_ID en Railway. Puedes pegar tu enlace público abajo.');
      backdrop.querySelector('#linkedin-preview-url')?.focus();
    });

    backdrop.querySelector('#btn-linkedin-preview-fetch')?.addEventListener('click', () => {
      const urlInput = backdrop.querySelector('#linkedin-preview-url');
      const url = urlInput ? urlInput.value.trim() : '';
      let importedName = 'Carlos Mendoza';
      if (url) {
        const match = url.match(/linkedin\\.com\\/in\\/([a-zA-Z0-9_-]+)/i);
        if (match && match[1]) {
          importedName = match[1].replace(/[-_]/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
        }
      }
      doImport(importedName);
    });

    lawyerRoot.appendChild(backdrop);
  }

  function openWizardModal(stepNum, name) {
    const existing = lawyerRoot.querySelector('.wizard-modal-backdrop-custom');
    if (existing) existing.remove();

    const steps = [
      'Datos básicos',
      'Tarjeta profesional',
      'Áreas de práctica',
      'Experiencia',
      'Honorarios y preferencias',
      'Verificación'
    ];

    const currentName = name || lawyerRoot.querySelector('.lawyer-user-fullname')?.textContent || 'Abogado';

    const backdrop = document.createElement('div');
    backdrop.className = 'lawyer-modal-backdrop wizard-modal-backdrop-custom';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(20,16,17,0.65);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    backdrop.innerHTML = \`
      <div class="lawyer-modal-content wizard-modal-box" style="background:#fff;border-radius:20px;width:100%;max-width:560px;padding:32px;box-shadow:0 24px 60px rgba(0,0,0,0.25);position:relative;">
        <button type="button" class="lawyer-modal-close" style="position:absolute;top:20px;right:20px;background:none;border:none;cursor:pointer;font-size:20px;color:#796c6e;">✕</button>
        <div class="wizard-modal-stepper-header" style="margin-bottom:20px;">
          <span class="wizard-step-tag" style="font-size:12px;font-weight:700;color:#68232c;text-transform:uppercase;letter-spacing:0.06em;">Paso \${stepNum} de 6</span>
          <h3 style="font-family:Georgia,serif;font-size:22px;color:#1e191a;margin:4px 0 6px;">\${steps[stepNum-1]}</h3>
          <p style="font-size:13px;color:#6a5e60;margin:0;">Completa la información necesaria para activar tu perfil y acceder a casos.</p>
        </div>
        <div class="wizard-modal-form-body" style="display:flex;flex-direction:column;gap:16px;">
          \${stepNum === 1 ? \`
            <div style="display:flex;flex-direction:column;gap:6px;">
              <label style="font-size:13px;font-weight:600;color:#2b2526;">Nombre y Apellidos</label>
              <input type="text" id="modal-field-name" value="\${currentName}" style="padding:10px 14px;border:1px solid #ebdccc;border-radius:10px;font-size:14px;width:100%;box-sizing:border-box;" />
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              <label style="font-size:13px;font-weight:600;color:#2b2526;">Ciudad de práctica</label>
              <input type="text" id="modal-field-city" value="Bogotá, D.C." style="padding:10px 14px;border:1px solid #ebdccc;border-radius:10px;font-size:14px;width:100%;box-sizing:border-box;" />
            </div>
          \` : stepNum === 2 ? \`
            <div style="display:flex;flex-direction:column;gap:6px;">
              <label style="font-size:13px;font-weight:600;color:#2b2526;">Número de Tarjeta Profesional (CSJ / SIRNA) *</label>
              <input type="text" id="modal-field-license" placeholder="Ej. 294.180 CSJ" style="padding:10px 14px;border:1px solid #ebdccc;border-radius:10px;font-size:14px;width:100%;box-sizing:border-box;" />
              <small style="font-size:11.5px;color:#796c6e;">Dato obligatorio para litigar. Se verificará ante el Registro Nacional de Abogados (SIRNA).</small>
            </div>
            <div style="border:1.5px dashed #ebdccc;border-radius:12px;padding:20px;text-align:center;color:#796c6e;font-size:13px;background:#fbf8f3;">
              Adjuntar copia escaneada de Tarjeta Profesional (Opcional en beta)
            </div>
          \` : \`
            <div style="padding:16px;background:#fbf8f3;border-radius:12px;font-size:13.5px;color:#4a4344;">
              Completa los datos de esta etapa para avanzar en la activación de tu perfil profesional.
            </div>
          \`}
        </div>
        <div class="wizard-modal-footer" style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;">
          \${stepNum > 1 ? '<button type="button" class="modal-btn-prev button outline" style="padding:9px 18px;border-radius:20px;font-size:13px;">Anterior</button>' : ''}
          <button type="button" class="modal-btn-next button" style="background:#68232c;color:#fff;padding:9px 22px;border-radius:20px;font-size:13px;border:none;cursor:pointer;">Guardar y Continuar →</button>
        </div>
      </div>
    \`;

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
    });

    backdrop.querySelector('.lawyer-modal-close')?.addEventListener('click', () => backdrop.remove());

    backdrop.querySelector('.modal-btn-prev')?.addEventListener('click', () => {
      backdrop.remove();
      openWizardModal(stepNum - 1);
    });

    backdrop.querySelector('.modal-btn-next')?.addEventListener('click', () => {
      if (stepNum === 2) {
        const licInput = backdrop.querySelector('#modal-field-license');
        const licVal = licInput ? licInput.value.trim() : '';
        if (licVal.length < 4) {
          alert('Por favor ingresa un número válido de tarjeta profesional (mínimo 4 caracteres).');
          return;
        }
        // Step 2 completed!
        const step2 = lawyerRoot.querySelectorAll('.stepper-node')[1];
        if (step2) {
          step2.classList.add('completed');
          step2.querySelector('.stepper-circle').innerHTML = '✓';
        }
        const progFill = lawyerRoot.querySelector('.wizard-progress-fill');
        const progText = lawyerRoot.querySelector('.wizard-progress-percent');
        if (progFill) progFill.style.width = '60%';
        if (progText) progText.textContent = '60% completo';
        showToast('Tarjeta Profesional registrada con éxito. Avanzando a Áreas de práctica.');
      }
      backdrop.remove();
      if (stepNum < 6) {
        openWizardModal(stepNum + 1);
      } else {
        showToast('¡Perfil enviado a verificación exitosamente!');
      }
    });

    lawyerRoot.appendChild(backdrop);
  }
})();

// Smart Header Hide on Scroll Down / Reveal on Scroll Up
(function() {
  const headerWrapper = document.querySelector('.public-header-wrapper');
  if (!headerWrapper) return;

  let lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  let ticking = false;

  function evaluateHeader(isScrollEvent) {
    const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
    const diff = currentScrollY - lastScrollY;

    if (currentScrollY <= 25) {
      headerWrapper.classList.remove('header-hidden');
      headerWrapper.classList.remove('header-scrolled');
    } else {
      headerWrapper.classList.add('header-scrolled');

      if (!isScrollEvent) {
        if (currentScrollY > 80) {
          headerWrapper.classList.add('header-hidden');
        } else {
          headerWrapper.classList.remove('header-hidden');
        }
      } else if (currentScrollY < maxScrollY - 20) {
        if (Math.abs(diff) > 8) {
          if (diff > 0 && currentScrollY > 80) {
            headerWrapper.classList.add('header-hidden');
          } else if (diff < 0) {
            headerWrapper.classList.remove('header-hidden');
          }
        }
      }
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        evaluateHeader(true);
      });
      ticking = true;
    }
  }, { passive: true });

  evaluateHeader(false);
  window.addEventListener('DOMContentLoaded', function() { evaluateHeader(false); });
  window.addEventListener('load', function() { evaluateHeader(false); });
  window.addEventListener('pageshow', function() { evaluateHeader(false); });
  window.addEventListener('hashchange', function() {
    setTimeout(function() { evaluateHeader(false); }, 50);
  });
  setTimeout(function() { evaluateHeader(false); }, 60);
  setTimeout(function() { evaluateHeader(false); }, 200);
})();
`;

const adjustedMarkup = markup
  .replace(/src="\/(?!\/)([^"]+)"/g, 'src="../public/$1"')
  .replace(
    /(<header class="public-header-wrapper[^"]*">)/,
    '$1<script>(function(){try{var h=document.querySelector(".public-header-wrapper");var y=window.scrollY||document.documentElement.scrollTop||0;if(h&&y>80){h.classList.add("header-hidden","header-scrolled");}else if(h&&y>25){h.classList.add("header-scrolled");}}catch(e){}})();</script>'
  );

const html =
  '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LexMarket · Vista de diseño</title><style>' +
  css +
  '</style></head><body>' +
  adjustedMarkup +
  '<dialog id="preview-info" class="modal"><h2>Una primera mirada a LexMarket</h2><p>Esta es la vista de diseño. Las cuentas, archivos y propuestas funcionan en la aplicación del repositorio después de conectar Supabase y desplegarla.</p><a class="button" href="https://github.com/Amadeusguitarte/lexmarket">Ver repositorio</a> <button id="preview-close" class="button outline">Volver</button></dialog><script>' +
  script +
  '</script></body></html>';

await writeFile(new URL('../docs/preview.html', import.meta.url), html);
console.log('docs/preview.html generated from real components successfully!');
