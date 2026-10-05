import React from 'react';
(globalThis as any).React = React;
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile, writeFile } from 'node:fs/promises';
import Landing from '../components/Landing';
import AuthModal from '../components/AuthModal';
const css=await readFile(new URL('../app/globals.css',import.meta.url),'utf8');
const landingMarkup=renderToStaticMarkup(React.createElement(Landing,{onStart:()=>{},onLawyer:()=>{},onLogin:()=>{},onInfo:()=>{}}));
const authMarkup=renderToStaticMarkup(React.createElement(AuthModal,{
  authMode: 'signup',
  role: 'client',
  googleReady: true,
  busy: false,
  authReady: true,
  onClose: ()=>{},
  onModeChange: ()=>{},
  onInfo: ()=>{},
  onSubmit: ()=>{},
  onContinueGoogle: ()=>{},
}));
const markup = landingMarkup + authMarkup;
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

// Wire up Auth Modal preview
(function() {
  const authDialog = document.querySelector('.auth-editorial-dialog');
  const closeBtn = document.querySelector('.auth-editorial-close');
  if (closeBtn && authDialog) {
    closeBtn.addEventListener('click', () => authDialog.close());
  }

  // Open auth modal on clicking 'Entrar' or related buttons
  document.querySelectorAll('button:not(.example-pill):not(.step-dot-btn):not(.lawyer-btn):not(.fees-cta-link)').forEach(button => {
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
      const previewInfo = document.getElementById('preview-info');
      if (previewInfo && typeof previewInfo.showModal === 'function') {
        previewInfo.showModal();
      }
    });
  });

  const previewClose = document.getElementById('preview-close');
  if (previewClose) {
    previewClose.onclick = () => document.getElementById('preview-info').close();
  }

  // Interactive role card toggling in preview
  const roleCards = document.querySelectorAll('.auth-role-card');
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
    });
  });

  // Auto-open if hash is #registro or #auth
  if (window.location.hash === '#registro' || window.location.hash === '#auth') {
    setTimeout(() => {
      if (authDialog && typeof authDialog.showModal === 'function') {
        authDialog.showModal();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    }, 150);
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

  // Immediate evaluation and event triggers for reload / scroll restoration / anchor hash
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
const adjustedMarkup=markup
  .replace(/src="\/(?!\/)([^"]+)"/g, 'src="../public/$1"')
  .replace(/(<header class="public-header-wrapper[^"]*">)/, '$1<script>(function(){try{var h=document.querySelector(".public-header-wrapper");var y=window.scrollY||document.documentElement.scrollTop||0;if(h&&y>80){h.classList.add("header-hidden","header-scrolled");}else if(h&&y>25){h.classList.add("header-scrolled");}}catch(e){}})();</script>');
const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LexMarket · Vista de diseño</title><style>'+css+'</style></head><body>'+adjustedMarkup+'<dialog id="preview-info" class="modal"><h2>Una primera mirada a LexMarket</h2><p>Esta es la vista de diseño. Las cuentas, archivos y propuestas funcionan en la aplicación del repositorio después de conectar Supabase y desplegarla.</p><a class="button" href="https://github.com/Amadeusguitarte/lexmarket">Ver repositorio</a> <button id="preview-close" class="button outline">Volver</button></dialog><script>'+script+'</script></body></html>';
await writeFile(new URL('../docs/preview.html',import.meta.url),html);
console.log('docs/preview.html generated from the real landing component');
