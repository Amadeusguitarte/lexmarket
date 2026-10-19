import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'MatchJurídico · El siguiente paso, en buenas manos',
  description: 'Comparte tu caso, conoce propuestas y encuentra acompañamiento jurídico para avanzar.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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

