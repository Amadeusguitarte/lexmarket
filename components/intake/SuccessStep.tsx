'use client';
import { CheckCircle2, ArrowRight, ShieldCheck, Bell, MessageSquare, Plus } from 'lucide-react';

interface SuccessStepProps {
  onGoToDashboard: () => void;
  onPublishAnother: () => void;
  caseTitle?: string;
}

export default function SuccessStep({
  onGoToDashboard,
  onPublishAnother,
  caseTitle
}: SuccessStepProps) {
  return (
    <div className="intake-step success-step">
      <div className="success-badge-icon">
        <CheckCircle2 size={46} className="success-check" />
      </div>

      <div className="step-header success-header">
        <span className="eyebrow centered-eyebrow">
          <ShieldCheck size={14} /> PUBLICACIÓN EXITOSA
        </span>
        <h1 className="editorial-headline">Tu caso ha sido publicado de forma anónima.</h1>
        <p className="step-sub success-sub">
          {caseTitle ? `Hemos registrado “${caseTitle}” de forma protegida.` : 'Tu expediente ya está activo y bajo tu estricto control.'}
        </p>
      </div>

      {/* 3 Clear Next Steps */}
      <div className="next-steps-timeline">
        <div className="next-step-row">
          <div className="step-number-circle">1</div>
          <div className="step-row-body">
            <h4>Abogados verificados revisarán el resumen</h4>
            <p>
              Profesionales con tarjeta profesional vigente y verificada podrán consultar el resumen no identificatorio de tu caso.
            </p>
          </div>
        </div>

        <div className="next-step-row">
          <div className="step-number-circle">2</div>
          <div className="step-row-body">
            <h4>Recibirás una notificación cuando alguien muestre interés</h4>
            <p>
              Te avisaremos en tu correo y en la plataforma cada vez que un abogado envíe una propuesta o solicite información complementaria.
            </p>
          </div>
        </div>

        <div className="next-step-row">
          <div className="step-number-circle">3</div>
          <div className="step-row-body">
            <h4>Tú decides con quién hablar, qué compartir y cuándo abrir tu expediente</h4>
            <p>
              Ningún documento ni dato personal se revela automáticamente. Tú apruebas cada acceso uno por uno y puedes revocarlo en cualquier momento.
            </p>
          </div>
        </div>
      </div>

      {/* Next Actions */}
      <div className="success-actions-container">
        <button type="button" className="button large-cta" onClick={onGoToDashboard}>
          Ir a mi panel <ArrowRight size={18} />
        </button>

        <button type="button" className="text-button publish-another-btn" onClick={onPublishAnother}>
          <Plus size={16} /> Publicar otro caso
        </button>
      </div>
    </div>
  );
}
