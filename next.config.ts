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
      { source: '/inicio', destination: '/' },
      { source: '/configuracion', destination: '/' },
      { source: '/pagos', destination: '/' },
      { source: '/perfil', destination: '/' },
      { source: '/admin', destination: '/' },
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
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const scriptSrc = isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
    const csp = `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.googleusercontent.com https://*.licdn.com https://*.linkedin.com; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.linkedin.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`;
    return [{ source: '/:path*', headers: [
      {key:'Strict-Transport-Security',value:'max-age=63072000; includeSubDomains; preload'},
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Permissions-Policy',value:'camera=(), microphone=(self), geolocation=()'},
      {key:'Content-Security-Policy',value:csp},
    ]}];
  }
};
export default config;

