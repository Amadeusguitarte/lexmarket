import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone', poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'lexmarket-production.up.railway.app',
          },
        ],
        destination: 'https://matchjuridico.com/:path*',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/explorar', destination: '/' },
      { source: '/mis-casos', destination: '/' },
      { source: '/mensajes', destination: '/' },
      { source: '/mi-perfil', destination: '/' },
      { source: '/recursos', destination: '/' },
      { source: '/recursos-legales', destination: '/' },
      { source: '/casos', destination: '/' },
      { source: '/casos/:id', destination: '/' },
    ];
  },
  async headers() { return [{ source: '/:path*', headers: [
    {key:'Strict-Transport-Security',value:'max-age=63072000; includeSubDomains; preload'},
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
    {key:'X-Frame-Options',value:'DENY'},
    {key:'Permissions-Policy',value:'camera=(), microphone=(self), geolocation=()'},
    {key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.googleusercontent.com https://*.licdn.com; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.linkedin.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"},
  ]}]; }
};
export default config;

