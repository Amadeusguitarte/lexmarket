'use client';

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { browserDB } from '@/lib/browser';

export default function OAuthPopupCallback() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const db = browserDB();
    if (!db) {
      setStatus('error');
      return;
    }

    let closed = false;

    const finish = () => {
      if (closed) return;
      closed = true;
      setStatus('success');
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'lexmarket_oauth_success' }, window.location.origin);
        }
      } catch {}
      setTimeout(() => {
        try {
          window.close();
        } catch {}
      }, 500);
    };

    // Check existing session
    db.auth.getSession().then(({ data }) => {
      if (data?.session) finish();
    }).catch(() => {});

    // Listen for session established via PKCE or URL tokens
    const { data: sub } = db.auth.onAuthStateChange((_event, session) => {
      if (session) finish();
    });

    const interval = setInterval(() => {
      db.auth.getSession().then(({ data }) => {
        if (data?.session) finish();
      }).catch(() => {});
    }, 400);

    const timeout = setTimeout(() => {
      finish();
    }, 3500);

    return () => {
      sub.subscription.unsubscribe();
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        background: '#faf8f5',
        fontFamily: 'Inter, -apple-system, sans-serif',
        color: '#2c2526',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          maxWidth: '360px',
          width: '100%',
          background: '#ffffff',
          border: '1px solid #ebdcd5',
          borderRadius: '20px',
          padding: '36px 28px',
          boxShadow: '0 12px 36px rgba(107, 45, 62, 0.08)'
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: status === 'success' ? '#eaf4ee' : '#f8eff2',
            color: status === 'success' ? '#2e7d32' : '#6b2d3e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px'
          }}
        >
          {status === 'success' ? (
            <Check size={28} strokeWidth={2.6} />
          ) : (
            <div
              style={{
                width: '26px',
                height: '26px',
                border: '3px solid #ebdcd5',
                borderTopColor: '#6b2d3e',
                borderRadius: '50%',
                animation: 'spin 0.75s linear infinite'
              }}
            />
          )}
        </div>
        <h2 style={{ fontSize: '19px', fontWeight: 650, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          {status === 'success' ? '¡Conexión exitosa!' : 'Finalizando conexión...'}
        </h2>
        <p style={{ fontSize: '13px', color: '#736968', margin: '0 0 18px', lineHeight: 1.5 }}>
          {status === 'success'
            ? 'Regresando a MatchJurídico...'
            : 'Sincronizando tu cuenta de Google de forma segura.'}
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              window.close();
            } catch {}
          }}
          style={{
            fontSize: '12px',
            color: '#736968',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: 0
          }}
        >
          Cerrar ventana
        </button>
      </div>
    </div>
  );
}
