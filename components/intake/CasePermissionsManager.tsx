'use client';
import { useState } from 'react';
import { Shield, ShieldAlert, Check, Minus, UserX, Lock, FileText, ArrowRight } from 'lucide-react';
import type { LawyerAccessGrant } from '@/lib/intake-engine';

interface CasePermissionsManagerProps {
  grants: LawyerAccessGrant[];
  onRevokeAccess: (lawyerId: string) => Promise<void> | void;
  onManageLawyer?: (lawyerId: string) => void;
  busy?: boolean;
}

export default function CasePermissionsManager({
  grants,
  onRevokeAccess,
  onManageLawyer,
  busy = false
}: CasePermissionsManagerProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (lawyerId: string) => {
    setRevokingId(lawyerId);
    try {
      await onRevokeAccess(lawyerId);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <section className="panel case-permissions-panel">
      <div className="section-heading">
        <div>
          <h2>Acceso al expediente</h2>
          <p className="muted">
            Controla qué profesionales tienen autorización activa para ver tus documentos o tu identidad. Puedes revocar el acceso en cualquier momento.
          </p>
        </div>
        <Lock size={22} className="lock-heading-icon" />
      </div>

      {grants.length === 0 ? (
        <div className="empty-permissions-state">
          <Shield size={28} className="empty-shield" />
          <p>
            Ningún abogado tiene acceso privado a tu expediente todavía. Solo pueden ver el resumen anónimo publicado.
          </p>
        </div>
      ) : (
        <div className="permissions-table-wrapper">
          <table className="permissions-table">
            <thead>
              <tr>
                <th>Profesional</th>
                <th>Resumen público</th>
                <th>Documentos</th>
                <th>Identidad</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {grants.map((grant) => {
                const hasDocs = grant.grantedDocumentIds.length > 0 || grant.canViewFullExpediente;
                const isRevoking = revokingId === grant.lawyerId;

                return (
                  <tr key={grant.lawyerId} className="permission-row">
                    <td className="lawyer-cell">
                      <div className="lawyer-meta-row">
                        <span className="avatar small">
                          {grant.lawyerAvatar ? (
                            <img src={grant.lawyerAvatar} alt={grant.lawyerName} />
                          ) : (
                            grant.lawyerName.slice(0, 1)
                          )}
                        </span>
                        <div>
                          <strong>{grant.lawyerName}</strong>
                          <small className="muted">
                            {grant.grantedAt
                              ? `Autorizado el ${new Date(grant.grantedAt).toLocaleDateString('es-CO')}`
                              : 'Acceso activo'}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td className="permission-status-cell">
                      <span className="perm-badge active">
                        <Check size={13} /> Visible
                      </span>
                    </td>

                    <td className="permission-status-cell">
                      {hasDocs ? (
                        <span className="perm-badge active">
                          <Check size={13} /> {grant.grantedDocumentIds.length} doc(s)
                        </span>
                      ) : (
                        <span className="perm-badge inactive">
                          <Minus size={13} /> Sin acceso
                        </span>
                      )}
                    </td>

                    <td className="permission-status-cell">
                      {grant.canViewIdentity ? (
                        <span className="perm-badge active">
                          <Check size={13} /> Visible
                        </span>
                      ) : (
                        <span className="perm-badge inactive">
                          <Minus size={13} /> Oculta
                        </span>
                      )}
                    </td>

                    <td className="actions-cell">
                      <button
                        type="button"
                        className="button outline small danger-hover"
                        disabled={busy || isRevoking}
                        onClick={() => handleRevoke(grant.lawyerId)}
                      >
                        {isRevoking ? 'Revocando…' : 'Revocar acceso'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
