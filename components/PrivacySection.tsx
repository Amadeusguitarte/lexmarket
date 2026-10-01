'use client';

import React from 'react';

export default function PrivacySection() {
  return (
    <section className="privacy-section wrap" aria-label="Privacidad bajo tu control">
      <div className="privacy-grid">
        {/* Left Column: Multi-layer floating illustration using original PNGs */}
        <div className="privacy-visual-wrapper">
          <div className="privacy-canvas" tabIndex={0} role="img" aria-label="Visualización de expediente protegido y perfil anónimo flotante">
            {/* Layer 1: Base Folder and Documents */}
            <img
              src="/Privacidad/Privacidad background.png"
              alt="Expediente y carpetas protegidas"
              className="privacy-layer privacy-layer-bg"
              loading="lazy"
            />

            {/* Layer 2: Middle Frosted Card - Perfil del Cliente */}
            <img
              src="/Privacidad/tarjeta 1.png"
              alt="Perfil del cliente protegido y desenfocado"
              className="privacy-layer privacy-layer-perfil floating-perfil"
              loading="lazy"
            />

            {/* Layer 3: Front Card - Resumen Anónimo */}
            <img
              src="/Privacidad/Tarjeta 2.png"
              alt="Ficha de caso anónimo con estado pendiente de autorización"
              className="privacy-layer privacy-layer-anonimo floating-anonimo"
              loading="lazy"
            />

            {/* Layer 4: Action Button */}
            <img
              src="/Privacidad/boton.png"
              alt="Botón para solicitar acceso al expediente completo"
              className="privacy-layer privacy-layer-boton floating-boton"
              loading="lazy"
            />
          </div>
        </div>

        {/* Right Column: Editorial Copy */}
        <div className="privacy-content">
          <span className="privacy-eyebrow">PRIVACIDAD BAJO TU CONTROL</span>
          
          <h2 className="privacy-headline">
            <span className="privacy-headline-line">Tu caso puede ser visible.</span>
            <span className="privacy-headline-line">Tu identidad y tu expediente, no.</span>
          </h2>

          <p className="privacy-description">
            Publica un resumen de tu situación de forma anónima para que los abogados entiendan tu caso. Tu identidad y tus documentos permanecen privados hasta que tú decidas con quién compartirlos.
          </p>

          <div className="privacy-features-list">
            <div className="privacy-feature-item">
              <h3 className="privacy-feature-title">Publicas de forma anónima</h3>
              <p className="privacy-feature-text">
                Los abogados pueden conocer tu situación sin ver de entrada quién eres.
              </p>
            </div>

            <div className="privacy-feature-item">
              <h3 className="privacy-feature-title">Tu expediente permanece privado</h3>
              <p className="privacy-feature-text">
                Pruebas, contratos y demás archivos siguen protegidos dentro de tu caso.
              </p>
            </div>

            <div className="privacy-feature-item">
              <h3 className="privacy-feature-title">Tú decides quién puede ver más</h3>
              <p className="privacy-feature-text">
                Solo compartes tu identidad y el expediente completo con los abogados que tú autorices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
