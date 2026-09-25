'use client';
import { useState, useEffect } from 'react';
import { Check, FolderPlus, Send, X } from 'lucide-react';
import type { LawyerData } from './LawyerCard';
import type { Row } from './Forms';

export default function InviteModal({
  lawyer,
  cases,
  loadingCases,
  onClose,
  onSendInvite,
  onCreateCase,
}: {
  lawyer: LawyerData;
  cases: Row[];
  loadingCases: boolean;
  onClose: () => void;
  onSendInvite: (caseId: string, lawyerId: string) => Promise<void>;
  onCreateCase: () => void;
}) {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    cases.length === 1 ? cases[0].id : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cases.length === 1) {
      setSelectedCaseId(cases[0].id);
    }
  }, [cases]);

  async function handleSubmit() {
    if (!selectedCaseId) return;
    setSubmitting(true);
    setError('');
    try {
      await onSendInvite(selectedCaseId, lawyer.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la invitación.');
      setSubmitting(false);
    }
  }

  return (
    <dialog open className="modal invite-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-head">
        <h2>Invitar a {lawyer.name}</h2>
        <button className="icon-button" aria-label="Cerrar modal" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {loadingCases ? (
        <div className="notice-panel">Cargando tus casos...</div>
      ) : cases.length === 0 ? (
        <div className="invite-empty-state">
          <div className="empty-icon"><FolderPlus size={30} /></div>
          <h3>Aún no tienes un caso publicado</h3>
          <p>Para invitar a {lawyer.name}, crea un caso primero. Podrás compartir el resumen y pedirle que revise tu asunto.</p>
          <div className="invite-actions">
            <button className="button" onClick={() => { onClose(); onCreateCase(); }}>
              Crear un caso
            </button>
            <button className="button outline" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="invite-content">
          <p className="muted">
            {cases.length === 1
              ? `¿Quieres invitar a ${lawyer.name} a revisar tu caso?`
              : `¿A qué caso quieres invitar a este abogado?`}
          </p>

          <div className="invite-case-list">
            {cases.map(c => {
              const isSelected = selectedCaseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`invite-case-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCaseId(c.id)}
                >
                  <div className="case-item-info">
                    <strong>{c.title}</strong>
                    <span>{c.category} · {c.city || 'Colombia'}</span>
                  </div>
                  <div className="case-item-check">
                    {isSelected && <Check size={16} />}
                  </div>
                </button>
              );
            })}
          </div>

          {error && <div className="notice-panel error">{error}</div>}

          <div className="invite-actions" style={{ marginTop: 24 }}>
            <button
              type="button"
              className="button"
              disabled={!selectedCaseId || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Enviando...' : 'Enviar invitación'}
              <Send size={16} />
            </button>
            <button type="button" className="button outline" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
