import React from 'react';
(globalThis as any).React = React;
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile, writeFile } from 'node:fs/promises';
import ParaAbogadosPage from '../app/para-abogados/page';

const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const rawMarkup = renderToStaticMarkup(React.createElement(ParaAbogadosPage));
const markup = rawMarkup.replace(/src="\/(?!\/)([^"]+)"/g, 'src="../public/$1"');

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MatchJurídico · Para Abogados</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;700&display=swap" rel="stylesheet">
  <style>${css}</style>
</head>
<body>
  ${markup}
  <script>
    // FAQ accordion interactive behavior
    document.querySelectorAll('.faq-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const isOpen = card.classList.contains('open');
        document.querySelectorAll('.faq-item-card').forEach(c => c.classList.remove('open'));
        if (!isOpen) {
          card.classList.add('open');
        }
      });
    });

    // Header scroll behavior
    const header = document.querySelector('.public-header-wrapper');
    if (header) {
      let lastScroll = 0;
      window.addEventListener('scroll', () => {
        const current = window.scrollY;
        if (current <= 25) {
          header.classList.remove('header-scrolled', 'header-hidden');
        } else {
          header.classList.add('header-scrolled');
          if (current > lastScroll && current > 80) {
            header.classList.add('header-hidden');
          } else {
            header.classList.remove('header-hidden');
          }
        }
        lastScroll = current;
      });
    }
  </script>
</body>
</html>`;

await writeFile(new URL('../docs/para-abogados-preview.html', import.meta.url), html);
console.log('docs/para-abogados-preview.html generated successfully');
