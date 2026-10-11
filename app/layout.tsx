import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'MatchJurídico · El siguiente paso, en buenas manos', description: 'Comparte tu caso, conoce propuestas y encuentra acompañamiento jurídico para avanzar.' };
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(typeof window!=='undefined'){if(window.location.hostname==='lexmarket-production.up.railway.app'){window.location.replace('https://matchjuridico.com'+window.location.pathname+window.location.search+window.location.hash);}if(window.location.hash==='#'||(window.location.href.endsWith('#'))){window.history.replaceState(null,'',window.location.pathname+window.location.search);}}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

