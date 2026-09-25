'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  LockKeyhole,
  CheckCircle2,
  FileCheck2,
  Coins,
  Scale,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ArrowUpRight,
  UserCheck,
  Building2,
  Briefcase
} from 'lucide-react';
import { Brand } from '@/components/Landing';

export default function ComoFuncionaPage() {
  const [activeTab, setActiveTab] = useState<'cliente' | 'abogado'>('cliente');

  return (
    <div className="how-it-works-page">
      {/* Header */}
      <header className="public-header wrap">
        <Link href="/" aria-label="LexMarket inicio">
          <Brand />
        </Link>
        <nav aria-label="Principal">
          <Link href="/abogados">Explorar Abogados</Link>
          <Link href="/como-funciona" className="active-nav">Cómo funciona</Link>
          <a href="#preguntas">Preguntas</a>
        </nav>
        <Link href="/?auth=login" className="button small outline">
          Entrar <ArrowRight size={15} />
        </Link>
      </header>

      <main>
        {/* Hero Section */}
        <section className="how-hero wrap">
          <div className="how-hero-badge">
            <ShieldCheck size={16} />
            <span>MODELO DE HONORARIOS PROTEGIDOS</span>
          </div>

          <h1>
            Transparencia y resguardo total <br />
            <em>en cada etapa de tu proceso legal.</em>
          </h1>

          <p className="how-hero-subtitle">
            En LexMarket, el dinero del cliente no se entrega por adelantado ni queda sin garantía.
            Permanece protegido en la plataforma y se libera progresivamente al abogado conforme
            se cumplen los hitos y entregables acordados.
          </p>

          <div className="how-hero-actions">
            <Link href="/" className="button">
              Empezar mi caso ahora <ArrowRight size={18} />
            </Link>
            <a href="#flujo-completo" className="quiet-link">
              Ver el flujo paso a paso <span>↓</span>
            </a>
          </div>

          {/* Hero 3D Visual Asset Integration */}
          <div className="how-hero-graphic-card">
            <div className="how-graphic-wrapper">
              <img
                src="/Honorarios/honorarios-base.png"
                alt="Pedestales de piedra y cápsula translúcida"
                className="how-hero-img-base"
              />
              <img
                src="/Honorarios/honorarios-coin.png"
                alt="Moneda dorada flotante"
                className="how-hero-img-coin floating-coin"
              />
            </div>
            <div className="how-hero-metrics">
              <div className="metric-pill">
                <LockKeyhole size={16} />
                <div>
                  <strong>Custodia Protegida</strong>
                  <span>Fondos en resguardo neutral</span>
                </div>
              </div>

              <div className="metric-pill">
                <FileCheck2 size={16} />
                <div>
                  <strong>Hitos Definidos</strong>
                  <span>Pagos contra entregables</span>
                </div>
              </div>

              <div className="metric-pill">
                <CheckCircle2 size={16} />
                <div>
                  <strong>100% Transparente</strong>
                  <span>Sin cobros ocultos ni sorpresas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Complete Experience Flow Diagram */}
        <section id="flujo-completo" className="how-flow-section">
          <div className="wrap">
            <div className="how-section-header">
              <span className="eyebrow">EL FLUJO COMPLETO DE LA EXPERIENCIA</span>
              <h2>¿Cómo funciona el pago por etapas?</h2>
              <p>Un recorrido simple, claro y sin riesgos de principio a fin.</p>
            </div>

            {/* Interactive Process Diagram */}
            <div className="process-diagram-grid">
              {/* Step 1 */}
              <div className="diagram-card">
                <div className="diagram-step-num">01</div>
                <div className="diagram-icon-box">
                  <Scale size={24} />
                </div>
                <h3>Acuerdo de Condiciones e Hitos</h3>
                <p>
                  Cliente y abogado establecen el valor total de la consulta o representación legal.
                  Dividen el trabajo en etapas concretas (ej: <em>1. Estudio inicial, 2. Radicación de escrito, 3. Seguimiento</em>)
                  con entregables específicos.
                </p>
                <div className="diagram-tag">Hitos consensuados</div>
              </div>

              <div className="diagram-connector">
                <ArrowRight size={20} />
              </div>

              {/* Step 2 */}
              <div className="diagram-card">
                <div className="diagram-step-num">02</div>
                <div className="diagram-icon-box">
                  <LockKeyhole size={24} />
                </div>
                <h3>Depósito en Custodia Protegida</h3>
                <p>
                  El cliente realiza el pago a través de los medios seguros de LexMarket.
                  El dinero <strong>no se transfiere de inmediato al profesional</strong>; permanece resguardado
                  en la plataforma como garantía para ambas partes.
                </p>
                <div className="diagram-tag">Fondos en custodia</div>
              </div>

              <div className="diagram-connector">
                <ArrowRight size={20} />
              </div>

              {/* Step 3 */}
              <div className="diagram-card">
                <div className="diagram-step-num">03</div>
                <div className="diagram-icon-box">
                  <FileCheck2 size={24} />
                </div>
                <h3>Avance y Registro de Entregables</h3>
                <p>
                  El abogado ejecuta las gestiones legales y sube los documentos o actuaciones realizadas
                  directamente al espacio privado del caso. El cliente puede revisar cada avance en tiempo real.
                </p>
                <div className="diagram-tag">Evidencia comprobable</div>
              </div>

              <div className="diagram-connector">
                <ArrowRight size={20} />
              </div>

              {/* Step 4 */}
              <div className="diagram-card highlight">
                <div className="diagram-step-num">04</div>
                <div className="diagram-icon-box">
                  <Coins size={24} />
                </div>
                <h3>Liberación Progresiva de Fondos</h3>
                <p>
                  Una vez cumplido y validado cada hito pactado, LexMarket libera proporcionalmente la parte
                  de honorarios correspondiente a esa etapa. El profesional cobra lo justo y el cliente avanza seguro.
                </p>
                <div className="diagram-tag gold">Desembolso por cumplimiento</div>
              </div>
            </div>

            {/* Visual Workflow Graphic Map */}
            <div className="workflow-visual-map">
              <div className="map-title">
                <Sparkles size={18} opacity={0.8} />
                <span>MAPA VISUAL DEL MODELO DE CUSTODIA</span>
              </div>
              <div className="map-nodes">
                <div className="map-node">
                  <UserCheck size={28} />
                  <strong>Cliente</strong>
                  <small>Deposita con confianza</small>
                </div>

                <div className="map-arrow">➔</div>

                <div className="map-node platform-node">
                  <ShieldCheck size={32} />
                  <strong>LexMarket Escrow</strong>
                  <small>Resguarda & valida hitos</small>
                </div>

                <div className="map-arrow">➔</div>

                <div className="map-node">
                  <Briefcase size={28} />
                  <strong>Abogado</strong>
                  <small>Trabaja & recibe pago justo</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Comparative Model */}
        <section className="how-comparison-section wrap">
          <div className="how-section-header">
            <span className="eyebrow">DIFERENCIA CLAVE</span>
            <h2>Contratación Tradicional vs. Modelo LexMarket</h2>
            <p>Compara por qué el modelo de honorarios protegidos elimina el riesgo en servicios legales.</p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Aspecto del proceso</th>
                  <th className="bad-column">Contratación Tradicional</th>
                  <th className="good-column">Modelo LexMarket Protegido</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Pago inicial</strong></td>
                  <td className="bad-column">100% por adelantado sin garantía de resultado</td>
                  <td className="good-column">
                    <CheckCircle2 size={16} /> Resguardo en plataforma. Cobro contra entregables
                  </td>
                </tr>
                <tr>
                  <td><strong>Visibilidad de avances</strong></td>
                  <td className="bad-column">Informes esporádicos o llamadas sin registro</td>
                  <td className="good-column">
                    <CheckCircle2 size={16} /> Bitácora y expediente digital actualizado en tiempo real
                  </td>
                </tr>
                <tr>
                  <td><strong>Seguridad de fondos</strong></td>
                  <td className="bad-column">Transferencia directa difícil de recuperar</td>
                  <td className="good-column">
                    <CheckCircle2 size={16} /> Fondos resguardados en custodia hasta validar hitos
                  </td>
                </tr>
                <tr>
                  <td><strong>Claridad de honorarios</strong></td>
                  <td className="bad-column">Adicionales o costos imprevistos a medio camino</td>
                  <td className="good-column">
                    <CheckCircle2 size={16} /> Etapas y montos fijos acordados desde el inicio
                  </td>
                </tr>
                <tr>
                  <td><strong>Gestión de desacuerdos</strong></td>
                  <td className="bad-column">El cliente queda desprotegido ante incumplimientos</td>
                  <td className="good-column">
                    <CheckCircle2 size={16} /> Mediación neutral de la plataforma antes de desembolsar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Dual Perspective (Client vs Lawyer) */}
        <section className="how-tabs-section wrap">
          <div className="how-section-header">
            <span className="eyebrow">BENEFICIOS PARA AMBAS PARTES</span>
            <h2>Un sistema donde todos ganan</h2>
          </div>

          <div className="tabs-toggle-header">
            <button
              className={`toggle-btn ${activeTab === 'cliente' ? 'active' : ''}`}
              onClick={() => setActiveTab('cliente')}
            >
              <UserCheck size={18} /> Beneficios para el Cliente
            </button>
            <button
              className={`toggle-btn ${activeTab === 'abogado' ? 'active' : ''}`}
              onClick={() => setActiveTab('abogado')}
            >
              <Briefcase size={18} /> Beneficios para el Abogado
            </button>
          </div>

          {activeTab === 'cliente' ? (
            <div className="tab-content-grid">
              <div className="benefit-card">
                <h4>Tranquilidad Financiera</h4>
                <p>No arriesgas tu dinero por adelantado. Sabes exactamente qué se va a entregar antes de cada pago.</p>
              </div>
              <div className="benefit-card">
                <h4>Control del Proceso</h4>
                <p>Tú apruebas la liberación de los fondos al verificar el cumplimiento de cada hito pactado.</p>
              </div>
              <div className="benefit-card">
                <h4>Expediente Digital Privado</h4>
                <p>Todos los documentos, minutas y avances quedan guardados en un entorno encriptado e inalterable.</p>
              </div>
            </div>
          ) : (
            <div className="tab-content-grid">
              <div className="benefit-card">
                <h4>Garantía de Cobro Real</h4>
                <p>Sabes que el dinero del cliente ya está depositado y reservado antes de empezar a trabajar.</p>
              </div>
              <div className="benefit-card">
                <h4>Mayor Conversión de Clientes</h4>
                <p>Los clientes aceptan propuestas con mayor rapidez al sentirse protegidos por el modelo de custodia.</p>
              </div>
              <div className="benefit-card">
                <h4>Flujo de Caja Predecible</h4>
                <p>Recibes pagos continuos y progresivos al completar cada etapa acordada del expediente.</p>
              </div>
            </div>
          )}
        </section>

        {/* Section: FAQ */}
        <section id="preguntas" className="how-faq-section wrap">
          <div className="how-section-header">
            <span className="eyebrow">PREGUNTAS FRECUENTES</span>
            <h2>Respuestas claras sobre los honorarios protegidos</h2>
          </div>

          <div className="faq-list">
            <details className="faq-item" open>
              <summary>
                <span>¿Qué ocurre si hay un desacuerdo sobre el cumplimiento de un hito?</span>
                <ChevronDown size={18} />
              </summary>
              <p>
                Si el cliente considera que la etapa no se ha cumplido según lo pactado, la liberación del pago se pausa.
                El equipo de soporte de LexMarket revisa los entregables registrados en el expediente digital para mediar
                de forma neutral y justa.
              </p>
            </details>

            <details className="faq-item">
              <summary>
                <span>¿Cómo se acuerdan los hitos y valores de cada etapa?</span>
                <ChevronDown size={18} />
              </summary>
              <p>
                Al aceptar la propuesta del abogado o al iniciar la asesoría, ambas partes utilizan nuestra plantilla
                de acuerdo de honorarios donde especifican el monto total y el desglose de etapas.
              </p>
            </details>

            <details className="faq-item">
              <summary>
                <span>¿Tiene algún costo adicional utilizar la custodia protegida?</span>
                <ChevronDown size={18} />
              </summary>
              <p>
                No. El modelo de honorarios protegidos está incluido en la plataforma LexMarket para garantizar la seguridad
                de la transacción sin comisiones sorpresa.
              </p>
            </details>

            <details className="faq-item">
              <summary>
                <span>¿Cuándo recibe el abogado el pago liberado?</span>
                <ChevronDown size={18} />
              </summary>
              <p>
                Tan pronto se valida la finalización de un hito, la plataforma autoriza el desembolso a la cuenta
                bancaria registrada por el profesional de forma expedita.
              </p>
            </details>
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="how-final-cta wrap">
          <div className="final-cta-card">
            <ShieldCheck size={36} className="cta-shield-icon" />
            <h2>¿Listo para resolver tu caso con total tranquilidad?</h2>
            <p>Publica tu necesidad o explora a los mejores abogados calificados de la plataforma.</p>
            <div className="final-cta-buttons">
              <Link href="/" className="button">
                Publicar o Consultar Caso <ArrowRight size={18} />
              </Link>
              <Link href="/abogados" className="button outline">
                Explorar Abogados
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="wrap">
        <Brand />
        <span>© {new Date().getFullYear()} LexMarket — Honorarios Protegidos & Servicios Legales.</span>
        <div>
          <Link href="/">Inicio</Link>
          <Link href="/abogados">Abogados</Link>
          <Link href="/como-funciona">Cómo funciona</Link>
        </div>
      </footer>
    </div>
  );
}
