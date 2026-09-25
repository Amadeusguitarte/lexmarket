'use client';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import ProtectedFeesModal from './ProtectedFeesModal';

export default function ProtectedFeesSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="protected-fees-section" aria-label="Honorarios protegidos">
      <div className="protected-fees-grid">
        {/* Left Column: Visual Asset with Floating Coin */}
        <div className="protected-fees-visual-wrapper">
          <div className="protected-fees-canvas">
            <img
              src="/Honorarios/honorarios-base.png"
              alt="Pedestales de piedra y cápsula translúcida de honorarios protegidos"
              className="fees-img-base"
            />
            <img
              src="/Honorarios/honorarios-coin.png"
              alt="Moneda dorada flotante"
              className="fees-img-coin floating-coin"
            />
          </div>
        </div>

        {/* Right Column: Copy and Editorial Steps */}
        <div className="protected-fees-content">
          <span className="fees-eyebrow">HONORARIOS PROTEGIDOS</span>
          <h2 className="fees-headline">Tu pago avanza<br />con tu caso.</h2>
          <p className="fees-description">
            Acuerda los honorarios con tu abogado antes de empezar. El pago se mantiene protegido y se libera conforme se cumplen las etapas que hayan definido.
          </p>

          <div className="fees-editorial-steps">
            <div className="fees-step-row">
              <span className="fees-step-num">01</span>
              <span className="fees-step-label">Acuerdan condiciones</span>
            </div>

            <div className="fees-step-row">
              <span className="fees-step-num">02</span>
              <span className="fees-step-label">Pago protegido</span>
            </div>

            <div className="fees-step-row">
              <span className="fees-step-num">03</span>
              <span className="fees-step-label">Liberación por etapas</span>
            </div>
          </div>

          <div className="fees-cta-wrapper">
            <button
              type="button"
              className="fees-cta-link"
              onClick={() => setModalOpen(true)}
            >
              Conoce cómo funciona <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && <ProtectedFeesModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}
