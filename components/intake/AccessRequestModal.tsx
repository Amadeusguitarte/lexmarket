'use client';
import { useState } from 'react';
import { Lock, FileText, User, ShieldCheck, X, Check } from 'lucide-react';

export interface DocumentItem {
  id: string;
  name: string;
}

interface AccessRequestModalProps {
  lawyerName: string;
  lawyerAvatar?: string;
  reason: string;
  requestedDocumentIds: string[];
  requestIdentity?: boolean;
  availableDocuments: DocumentItem[];
  onApproveSelected: (selectedDocs: string[], approveIdentity: boolean) => void;
  onDeny: () => void;
  onClose: () => void;
}

export default function AccessRequestModal({
  lawyerName,
  lawyerAvatar,
  reason,
  requestedDocumentIds,
  requestIdentity = false,
  availableDocuments,
  onApproveSelected,
  onDeny,
  onClose
}: AccessRequestModalProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>(requestedDocumentIds);
  const [approveIdentity, setApproveIdentity] = useState<boolean>(false);

  const toggleDoc = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleConfirm = () => {
    onApproveSelected(selectedDocs, approveIdentity);
  };

  return (
    <div className="modal-backdrop-intake" onClick={onClose}>
      <div
        className="modal-content-access"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <div className="lawyer-request-header">
            <span className="avatar">
              {lawyerAvatar ? (
                <img src={lawyerAvatar} alt={lawyerName} />
              ) : (
                lawyerName.slice(0, 1)
              )}
            </span>
            <div>
              <h2>{lawyerName} solicita acceso adicional</h2>
              <span className="lawyer-verified-tag">
                <ShieldCheck size={13} /> Abogado verificado
              </span>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Reason given by lawyer */}
        <div className="lawyer-reason-panel">
          <span className="reason-label">Motivo de la solicitud:</span>
          <p className="reason-text">&ldquo;{reason}&rdquo;</p>
        </div>

        {/* Granular resources to grant */}
        <div className="access-resources-selection">
          <h4>Selecciona qué elementos autorizas compartir:</h4>
          <p className="access-hint">
            Puedes conceder acceso únicamente a algunos documentos sin necesidad de abrir todo tu expediente.
          </p>

          <div className="resources-checklist">
            {availableDocuments.map((doc) => {
              const isChecked = selectedDocs.includes(doc.id);
              const wasRequested = requestedDocumentIds.includes(doc.id);

              return (
                <label
                  key={doc.id}
                  className={`resource-check-row ${isChecked ? 'checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDoc(doc.id)}
                  />
                  <FileText size={16} className="resource-icon" />
                  <span className="resource-name">{doc.name}</span>
                  {wasRequested && <span className="requested-pill">Solicitado</span>}
                </label>
              );
            })}

            {requestIdentity && (
              <label
                className={`resource-check-row ${approveIdentity ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={approveIdentity}
                  onChange={(e) => setApproveIdentity(e.target.checked)}
                />
                <User size={16} className="resource-icon" />
                <span className="resource-name">Tu identidad y datos de contacto</span>
                <span className="requested-pill">Solicitado</span>
              </label>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="access-modal-actions">
          <button type="button" className="text-button quiet-action" onClick={onDeny}>
            No por ahora
          </button>

          <button
            type="button"
            className="button"
            onClick={handleConfirm}
            disabled={selectedDocs.length === 0 && !approveIdentity}
          >
            Dar acceso seleccionado
          </button>
        </div>
      </div>
    </div>
  );
}
