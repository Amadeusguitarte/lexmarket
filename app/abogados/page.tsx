'use client';
import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import LawyerDirectory from '@/components/LawyerDirectory';
import InviteModal from '@/components/InviteModal';
import CaseIntake from '@/components/CaseIntake';
import { Brand } from '@/components/Landing';
import type { LawyerData } from '@/components/LawyerCard';
import type { Row } from '@/components/Forms';
import { api, browserDB } from '@/lib/browser';
import { importIntake } from '@/lib/import-intake';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function AbogadosPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<Row | null>(null);
  const [cases, setCases] = useState<Row[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [inviteLawyer, setInviteLawyer] = useState<LawyerData | null>(null);
  const [showCaseIntake, setShowCaseIntake] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const db = browserDB();
    if (!db) return;
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = db.auth.onAuthStateChange((_, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      api('me').then(setMe).catch(() => {});
      setLoadingCases(true);
      api('cases')
        .then(data => setCases(data.items || []))
        .catch(() => {})
        .finally(() => setLoadingCases(false));
    }
  }, [session]);

  const handleInvite = (lawyer: LawyerData) => {
    if (!session) {
      // Redirect to homepage login or open auth notice
      location.href = '/?auth=login';
      return;
    }
    setInviteLawyer(lawyer);
  };

  const handleSendInvite = async (caseId: string, lawyerId: string) => {
    await api(`professionals/${lawyerId}/invite`, 'POST', { case_id: caseId });
    setNotice(`¡Invitación enviada exitosamente a ${inviteLawyer?.name}!`);
  };

  const handleViewProfile = (id: string) => {
    location.href = `/abogados/${id}`;
  };

  return (
    <div className="landing">
      <header className="public-header wrap">
        <a href="/" aria-label="LexMarket inicio"><Brand /></a>
        <nav aria-label="Principal">
          <a href="/">Inicio</a>
          <a href="/abogados">Abogados</a>
        </nav>
        {session ? (
          <a href="/" className="button small">Mi espacio <ArrowRight size={15} /></a>
        ) : (
          <a href="/?auth=login" className="button small outline">Entrar <ArrowRight size={15} /></a>
        )}
      </header>

      <LawyerDirectory
        onViewProfile={handleViewProfile}
        onInvite={handleInvite}
      />

      {inviteLawyer && (
        <InviteModal
          lawyer={inviteLawyer}
          cases={cases}
          loadingCases={loadingCases}
          onClose={() => setInviteLawyer(null)}
          onSendInvite={handleSendInvite}
          onCreateCase={() => setShowCaseIntake(true)}
        />
      )}

      {showCaseIntake && (
        <CaseIntake
          signedIn={!!session}
          onClose={() => setShowCaseIntake(false)}
          onReady={async () => {
            if (session) {
              await importIntake(session.user.id, setNotice);
              setShowCaseIntake(false);
              const data = await api('cases');
              setCases(data.items || []);
            }
          }}
        />
      )}

      {(error || notice) && typeof document !== 'undefined' &&
        createPortal(
          <div className={'toast ' + (error ? 'error' : '')} role="status">
            <CheckCircle2 size={18} />
            <span>{error || notice}</span>
            <button aria-label="Cerrar notificación" onClick={() => { setError(''); setNotice(''); }}>
              <X size={18} />
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
