import React from 'react';
(globalThis as any).React = React;
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile, writeFile } from 'node:fs/promises';
import Landing from '../components/Landing';
const css=await readFile(new URL('../app/globals.css',import.meta.url),'utf8');
const markup=renderToStaticMarkup(React.createElement(Landing,{onStart:()=>{},onLawyer:()=>{},onLogin:()=>{},onInfo:()=>{}}));
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

    const node1 = document.querySelector('.timeline-connector-node.node-1');
    const node2 = document.querySelector('.timeline-connector-node.node-2');
    if (node1) node1.classList.toggle('active', idx >= 1);
    if (node2) node2.classList.toggle('active', idx >= 2);
  }

  function startCycle() {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      if (!isPaused) {
        setStep((currentStep + 1) % cards.length);
      }
    }, 3200);
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

  setStep(0);
  startCycle();
})();

document.querySelectorAll('button:not(.example-pill):not(.step-dot-btn):not(.lawyer-btn):not(.fees-cta-link)').forEach(button => {
  button.addEventListener('click', () => {
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
`;
const adjustedMarkup=markup.replace(/src="\/(?!\/)([^"]+)"/g, 'src="../public/$1"');
const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LexMarket · Vista de diseño</title><style>'+css+'</style></head><body>'+adjustedMarkup+'<dialog id="preview-info" class="modal"><h2>Una primera mirada a LexMarket</h2><p>Esta es la vista de diseño. Las cuentas, archivos y propuestas funcionan en la aplicación del repositorio después de conectar Supabase y desplegarla.</p><a class="button" href="https://github.com/Amadeusguitarte/lexmarket">Ver repositorio</a> <button id="preview-close" class="button outline">Volver</button></dialog><script>'+script+'</script></body></html>';
await writeFile(new URL('../docs/preview.html',import.meta.url),html);
console.log('docs/preview.html generated from the real landing component');
