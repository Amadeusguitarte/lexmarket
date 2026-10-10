'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, browserDB } from '@/lib/browser';
import AdminDashboard from '@/components/AdminDashboard';
import { ShieldCheck, ArrowLeft, LogOut, Lock } from 'lucide-react';
import AuthModal from '@/components/AuthModal';

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notice, setNotice] = useState('');

  const checkAuth = async () => {
    setLoading(true);
    try {
      const db = browserDB();
      if (!db) {
        setLoading(false);
        return;
      }
      const { data } = await db.auth.getSession();
      setSession(data.session);
      if (data.session) {
        const meData = await api('me');
        setMe(meData);
      } else {
        setMe(null);
      }
    } catch (e) {
      console.error('Admin auth check error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    const db = browserDB();
    if (db) {
      await db.auth.signOut();
    }
    setSession(null);
    setMe(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
        <div style={{ textAlign: 'center' }}>
          <ShieldCheck size={36} color="var(--purple)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Verificando credenciales de administrador…</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
        <header className="public-header wrap" style={{ height: 80, borderBottom: '1px solid var(--line)' }}>
          <Link href="/" aria-label="Inicio">
            <span className="brand">Match<span>Jurídico</span><span className="brand-dot">.</span></span>
          </Link>
          <Link href="/" className="quiet-link" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={15} /> Volver al inicio
          </Link>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="panel" style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: 36 }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: '#f2e9dc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--purple)' }}>
              <Lock size={26} />
            </div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Acceso de Administrador</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Inicia sesión con tu cuenta con privilegios administrativos para acceder a la moderación de casos y archivos en Supabase.
            </p>
            <button 
              className="button" 
              style={{ width: '100%' }}
              onClick={() => setShowAuthModal(true)}
            >
              Iniciar sesión
            </button>
          </div>
        </main>

        {showAuthModal && (
          <AuthModal
            authMode="login"
            role="client"
            onClose={() => setShowAuthModal(false)}
            onModeChange={() => {}}
            onInfo={() => {}}
            onSubmit={async (form) => {
              const db = browserDB()!;
              const { error } = await db.auth.signInWithPassword({
                email: form.email,
                password: form.password
              });
              if (error) throw error;
              setShowAuthModal(false);
              await checkAuth();
            }}
            onContinueGoogle={async () => {
              const db = browserDB()!;
              await db.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + '/admin' }
              });
            }}
            onContinueLinkedIn={async () => {}}
            onRoleChange={() => {}}
            busy={false}
            authReady={true}
            googleReady={true}
            linkedinReady={false}
          />
        )}
      </div>
    );
  }

  // Logged in but not admin
  if (!me?.admin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', flexDirection: 'column' }}>
        <header className="public-header wrap" style={{ height: 80, borderBottom: '1px solid var(--line)' }}>
          <Link href="/" aria-label="Inicio">
            <span className="brand">Match<span>Jurídico</span><span className="brand-dot">.</span></span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/" className="quiet-link" style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={15} /> Ir a mi espacio
            </Link>
            <button className="button outline small" onClick={handleLogout} style={{ minHeight: 34 }}>
              <LogOut size={14} /> Salir
            </button>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="panel" style={{ maxWidth: 460, width: '100%', textAlign: 'center', padding: 36 }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: '#fbeeed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#b32638' }}>
              <Lock size={26} />
            </div>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Acceso Restringido</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Tu cuenta actual (<b>{session.user?.email}</b>) no cuenta con el rol de administrador en MatchJurídico.
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', background: '#faf6f0', padding: 12, borderRadius: 10, margin: '0 0 24px' }}>
              Si eres el administrador, asegúrate de haber confirmado tu correo o de que tu email esté configurado en <code>ADMIN_EMAILS</code>.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link href="/" className="button small">
                Volver a mi espacio
              </Link>
              <button className="button outline small" onClick={handleLogout}>
                Cambiar de cuenta
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Admin user: Full Dashboard
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      {/* Admin Top Header */}
      <header style={{ 
        background: '#2b1b22', 
        color: 'white', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        padding: '0 32px', 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
            <span className="brand" style={{ color: 'white', fontSize: 22 }}>
              Match<span style={{ color: '#f1e8dc' }}>Jurídico</span>
              <span className="brand-dot" style={{ color: '#d89b84' }}>.</span>
            </span>
          </Link>
          <span style={{ 
            fontSize: 11, 
            background: 'rgba(255,255,255,0.15)', 
            padding: '3px 10px', 
            borderRadius: 12, 
            fontWeight: 600, 
            letterSpacing: '0.04em' 
          }}>
            PANEL ADMINISTRADOR
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: '#e6ded0', opacity: 0.9 }}>
            {session.user?.email}
          </span>
          <Link 
            href="/" 
            className="button small"
            style={{ 
              background: 'rgba(255,255,255,0.12)', 
              color: 'white', 
              border: '1px solid rgba(255,255,255,0.2)', 
              boxShadow: 'none', 
              fontSize: 12, 
              minHeight: 34, 
              padding: '6px 14px' 
            }}
          >
            Volver a la App
          </Link>
          <button 
            onClick={handleLogout}
            style={{ 
              background: 'none', 
              border: 0, 
              color: '#f1e8dc', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              fontSize: 12 
            }}
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="wrap" style={{ paddingTop: 32 }}>
        <AdminDashboard onNotice={setNotice} />
      </main>
    </div>
  );
}
