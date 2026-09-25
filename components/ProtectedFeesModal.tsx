'use client';
import { X, CheckCircle2, Shield, Layers, Lock, Sparkles } from 'lucide-react';

export default function ProtectedFeesModal({ onClose }: { onClose: () => void }) {
  return (
    <dialog open className="modal protected-fees-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-head">
        <div>
          <span className="overline">TRANSPARENCIA Y SEGURIDAD</span>
          <h2>Honorarios protegidos en LexMarket</h2>
        </div>
        <button className="icon-button" aria-label="Cerrar modal" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <p className="muted" style={{ marginBottom: 24 }}>
        Un modelo transparente para acordar honorarios, resguardar fondos y avanzar por etapas de forma justa para cliente y abogado.
      </p>

      <div className="fees-modal-steps">
        <div className="fees-modal-step">
          <div className="step-num-badge">01</div>
          <div>
            <strong>Acuerdo de condiciones</strong>
            <p>Cliente y abogado establecen el valor total, las etapas del proceso y los entregables correspondientes antes de iniciar.</p>
          </div>
        </div>

        <div className="fees-modal-step">
          <div className="step-num-badge">02</div>
          <div>
            <strong>Pago en custodia protegida</strong>
            <p>El cliente realiza el pago a través de la plataforma. Los fondos permanecen protegidos y no se transfieren de inmediato.</p>
          </div>
        </div>

        <div className="fees-modal-step">
          <div className="step-num-badge">03</div>
          <div>
            <strong>Seguimiento de avances</strong>
            <p>El profesional registra las actuaciones, escritos o gestiones pactadas dentro del espacio privado del caso.</p>
          </div>
        </div>

        <div className="fees-modal-step">
          <div className="step-num-badge">04</div>
          <div>
            <strong>Liberación gradual por etapas</strong>
            <p>A medida que se verifica el cumplimiento de cada hito acordado, los fondos correspondientes se liberan al abogado.</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </dialog>
  );
}
