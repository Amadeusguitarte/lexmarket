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
  Briefcase,
  FolderKanban,
  Check,
  X,
  FileText,
  BadgeCheck,
  Zap,
  Users,
  MapPin,
  Wifi,
  TrendingUp
} from 'lucide-react';
import { Brand } from '@/components/Landing';
import PublicHeaderWrapper from '@/components/PublicHeader';

export default function ParaAbogadosPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="lawyer-landing-page">
      {/* Header */}
      <PublicHeaderWrapper>
        <div className="public-header wrap">
          <Link href="/" aria-label="LexMarket inicio">
            <Brand />
          </Link>
          <nav aria-label="Principal">
            <Link href="/abogados">Explorar Abogados</Link>
            <Link href="/como-funciona">Cómo funciona</Link>
            <Link href="/para-abogados" className="active-nav">Para abogados</Link>
            <a href="/#preguntas">Preguntas</a>
          </nav>
          <Link href="/?auth=login" className="button small outline">
            Entrar <ArrowRight size={15} />
          </Link>
        </div>
      </PublicHeaderWrapper>

      <main>
        {/* Hero Section */}
        <section className="lawyer-hero wrap">
          <div className="lawyer-hero-badge">
            <Scale size={15} />
            <span>RED DE ABOGADOS VERIFICADOS EN COLOMBIA</span>
          </div>

          <h1>
            Casos reales, clientes calificados <br />
            <em>y tus honorarios respaldados.</em>
          </h1>

          <p className="lawyer-hero-subtitle">
            LexMarket conecta tu experiencia con personas y empresas que ya han estructurado su caso y reunido sus soportes. Evalúa cada oportunidad antes de participar, trabaja con fondos previamente respaldados y conserva el control sobre tus honorarios y condiciones.
          </p>

          <div className="lawyer-hero-actions">
            <Link href="/?auth=signup&role=lawyer" className="button">
              Crear perfil profesional <ArrowRight size={18} />
            </Link>
            <a href="#como-funciona-abogado" className="quiet-link">
              Conoce el flujo de trabajo <span>↓</span>
            </a>
          </div>

          {/* Trust Guarantees Strip */}
          <div className="lawyer-hero-trust-strip">
            <div className="trust-pill">
              <BadgeCheck size={16} className="trust-icon" />
              <span>Tarjeta Profesional requerida (CSJ - SIRNA)</span>
            </div>
            <div className="trust-pill">
              <Coins size={16} className="trust-icon" />
              <span>Custodia de fondos antes de iniciar cada hito</span>
            </div>
            <div className="trust-pill">
              <LockKeyhole size={16} className="trust-icon" />
              <span>Canal cifrado y confidencialidad protegida</span>
            </div>
          </div>
        </section>

        {/* Por qué trabajar con LexMarket - Microsección de 4 pilares conceptuales */}
        <section className="lawyer-benefits-section wrap">
          <div className="section-head text-center benefits-head">
            <span className="overline">POR QUÉ TRABAJAR CON LEXMARKET</span>
          </div>

          <div className="lawyer-benefits-grid">
            {/* Card 01 - Expedientes Listos */}
            <div className="lawyer-benefit-card">
              <span className="benefit-index">01</span>

              <div className="benefit-visual-stage stage-1">
                <div className="dossier-graphic-wrapper">
                  <div className="dossier-back-folder">
                    <span className="folder-tab-snippet">Ex...</span>
                  </div>
                  <div className="dossier-front-file">
                    <div className="dossier-file-header">Expediente</div>
                    <ul className="dossier-check-list">
                      <li><Check size={11} className="ico-chk" /> Hechos</li>
                      <li><Check size={11} className="ico-chk" /> Pretensiones</li>
                      <li><Check size={11} className="ico-chk" /> Soportes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <span className="benefit-badge">EXPEDIENTES LISTOS</span>
              <h3 className="benefit-title">Evalúa antes de decidir</h3>
              <p className="benefit-desc">Hechos, pretensiones y soportes organizados antes de que participes.</p>

              <div className="benefit-card-footer">
                <div className="benefit-arrow-circle" aria-hidden="true">
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>

            {/* Card 02 - Fondos Respaldados */}
            <div className="lawyer-benefit-card">
              <span className="benefit-index">02</span>

              <div className="benefit-visual-stage stage-2">
                <div className="escrow-graphic-wrapper">
                  <div className="escrow-node">
                    <div className="escrow-circle active-done">
                      <Check size={13} strokeWidth={2.6} />
                    </div>
                    <span className="escrow-node-label">Depósito<br />del cliente</span>
                  </div>
                  <div className="escrow-connector" />
                  <div className="escrow-node">
                    <div className="escrow-circle soft-card">
                      <FileText size={13} />
                    </div>
                    <span className="escrow-node-label">Trabajo<br />por etapas</span>
                  </div>
                  <div className="escrow-connector" />
                  <div className="escrow-node">
                    <div className="escrow-circle soft-card">
                      <LockKeyhole size={13} />
                    </div>
                    <span className="escrow-node-label">Liberación<br />de fondos</span>
                  </div>
                </div>
              </div>

              <span className="benefit-badge">FONDOS RESPALDADOS</span>
              <h3 className="benefit-title">Empieza con fondos respaldados</h3>
              <p className="benefit-desc">El cliente deposita previamente el valor acordado antes de que comiences cada etapa.</p>

              <div className="benefit-card-footer">
                <div className="benefit-arrow-circle" aria-hidden="true">
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>

            {/* Card 03 - Libertad Profesional */}
            <div className="lawyer-benefit-card">
              <span className="benefit-index">03</span>

              <div className="benefit-visual-stage stage-3">
                <div className="controls-widget-card">
                  <div className="ctrl-row">
                    <span className="ctrl-title">Honorarios</span>
                    <div className="ctrl-track">
                      <div className="ctrl-fill" style={{ width: '68%' }} />
                      <div className="ctrl-thumb" style={{ left: '68%' }} />
                    </div>
                    <span className="ctrl-icon-tag">$</span>
                  </div>
                  <div className="ctrl-row">
                    <span className="ctrl-title">Condiciones</span>
                    <div className="ctrl-track">
                      <div className="ctrl-fill" style={{ width: '52%' }} />
                      <div className="ctrl-thumb" style={{ left: '52%' }} />
                    </div>
                    <span className="ctrl-icon-tag">≡</span>
                  </div>
                  <div className="ctrl-row">
                    <span className="ctrl-title">Casos a aceptar</span>
                    <div className="ctrl-switch-active">
                      <div className="ctrl-switch-knob" />
                    </div>
                  </div>
                </div>
              </div>

              <span className="benefit-badge">LIBERTAD PROFESIONAL</span>
              <h3 className="benefit-title">Tú defines tus condiciones</h3>
              <p className="benefit-desc">Establece tus honorarios, condiciones y qué casos aceptar.</p>

              <div className="benefit-card-footer">
                <div className="benefit-arrow-circle" aria-hidden="true">
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>

            {/* Card 04 - Oportunidades Relevantes */}
            <div className="lawyer-benefit-card">
              <span className="benefit-index">04</span>

              <div className="benefit-visual-stage stage-4">
                <div className="tags-floating-wrapper">
                  <div className="tags-row row-1">
                    <div className="tag-chip chip-solid">
                      <Briefcase size={12} />
                      <span>Laboral</span>
                    </div>
                    <div className="tag-chip chip-glass">
                      <FileText size={12} />
                      <span>Civil</span>
                    </div>
                  </div>
                  <div className="tags-row row-2">
                    <div className="tag-chip chip-glass-wide">
                      <TrendingUp size={12} />
                      <span>Comercial</span>
                    </div>
                  </div>
                  <div className="tags-row row-3">
                    <div className="tag-chip chip-micro">
                      <MapPin size={11} />
                      <span>Bogotá</span>
                    </div>
                    <div className="tag-chip chip-micro">
                      <Wifi size={11} />
                      <span>Remoto</span>
                    </div>
                  </div>
                </div>
              </div>

              <span className="benefit-badge">OPORTUNIDADES RELEVANTES</span>
              <h3 className="benefit-title">Encuentra casos relevantes</h3>
              <p className="benefit-desc">Recibe invitaciones y descubre casos compatibles con tus áreas de práctica jurídica.</p>

              <div className="benefit-card-footer">
                <div className="benefit-arrow-circle" aria-hidden="true">
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars Section */}
        <section className="lawyer-pillars-section wrap">
          <div className="section-head text-center">
            <span className="overline">DISEÑADO PARA TU DESPACHO</span>
            <h2>Una forma más digna y eficiente de ejercer el derecho.</h2>
            <p className="section-subtitle">
              Eliminamos la fricción administrativa y el desgaste de la cobranza para que te concentres exclusivamente en tu técnica jurídica.
            </p>
          </div>

          <div className="lawyer-pillars-grid">
            <div className="lawyer-pillar-card">
              <div className="pillar-icon-box">
                <FolderKanban size={26} />
              </div>
              <h3>Expedientes organizados y filtrados</h3>
              <p>
                No más mensajes dispersos por WhatsApp ni reuniones exploratorias sin datos. Recibes un resumen claro preparado con nuestro intake asistido: antecedentes, objetivos del cliente y archivos ordenados.
              </p>
              <ul className="pillar-checklist">
                <li><Check size={14} /> Resumen ejecutivo previo a postularte</li>
                <li><Check size={14} /> Clasificación por rama del derecho y cuantía</li>
                <li><Check size={14} /> Acceso controlado a piezas procesales</li>
              </ul>
            </div>

            <div className="lawyer-pillar-card">
              <div className="pillar-icon-box">
                <Coins size={26} />
              </div>
              <h3>Honorarios en custodia protegida</h3>
              <p>
                El dinero del cliente se consigna en la plataforma antes de que redactes el primer memorial o asumas la diligencia. Una vez cumplido y aprobado el hito, los fondos se transfieren directamente a tu cuenta.
              </p>
              <ul className="pillar-checklist">
                <li><Check size={14} /> Anticipos garantizados en depósito escrow</li>
                <li><Check size={14} /> Liquidación transparente por etapas o hitos</li>
                <li><Check size={14} /> Fin a las cuentas de cobro ignoradas</li>
              </ul>
            </div>

            <div className="lawyer-pillar-card">
              <div className="pillar-icon-box">
                <Scale size={26} />
              </div>
              <h3>Autonomía total de honorarios</h3>
              <p>
                Tú eres el profesional a cargo. Tú fijas tus honorarios (tarifa fija, por hito procesal o mixta con cuota litis) según la complejidad, tiempo estimado y valor estratégico del asunto.
              </p>
              <ul className="pillar-checklist">
                <li><Check size={14} /> Propuestas a la medida de cada caso</li>
                <li><Check size={14} /> Libertad para aceptar o rechazar solicitudes</li>
                <li><Check size={14} /> Cumplimiento de tarifas del Colegio de Abogados</li>
              </ul>
            </div>

            <div className="lawyer-pillar-card">
              <div className="pillar-icon-box">
                <LockKeyhole size={26} />
              </div>
              <h3>Canal seguro y formalidad legal</h3>
              <p>
                Espacio de trabajo seguro con mensajería privada, control de versiones de documentos y trazabilidad completa de cada actuación. Formaliza poderes y contratos de prestación de servicios con respaldo digital.
              </p>
              <ul className="pillar-checklist">
                <li><Check size={14} /> Cifrado y secreto profesional amparado</li>
                <li><Check size={14} /> Bitácora cronológica inalterable</li>
                <li><Check size={14} /> Entrega y revocatoria de poderes auditada</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How It Works for Lawyers (Step-by-step) */}
        <section id="como-funciona-abogado" className="lawyer-workflow-section wrap">
          <div className="section-head text-center">
            <span className="overline">EL FLUJO DE TRABAJO</span>
            <h2>De la postulación a la liquidación en 3 pasos.</h2>
            <p className="section-subtitle">
              Un flujo intuitivo diseñado para integrarse a la rutina de tu práctica profesional individual o de firma.
            </p>
          </div>

          <div className="lawyer-steps-container">
            <div className="lawyer-step-item">
              <div className="step-number-circle">01</div>
              <div className="step-content">
                <span className="step-phase">FILTRADO Y EVALUACIÓN</span>
                <h3>Explora casos afines a tu especialidad</h3>
                <p>
                  Revisa casos calificados en Bogotá, Medellín, Cali, Barranquilla y todo el territorio nacional. Lee el resumen público aprobado y, si el asunto coincide con tu experiencia, solicita acceso al expediente reservado.
                </p>
                <div className="step-tags">
                  <span className="tag">Civil y Comercial</span>
                  <span className="tag">Laboral y Seguridad Social</span>
                  <span className="tag">Familia</span>
                  <span className="tag">Administrativo</span>
                  <span className="tag">Penal</span>
                </div>
              </div>
            </div>

            <div className="lawyer-step-item">
              <div className="step-number-circle">02</div>
              <div className="step-content">
                <span className="step-phase">PROPUESTA E HITOS</span>
                <h3>Plantea tu estrategia y define tus etapas</h3>
                <p>
                  Presenta una propuesta clara: explica tu enfoque jurídico, los documentos requeridos y desglosa el trabajo en hitos verificables (ej. concepto previo, radicación de demanda, contestación). El cliente aprueba y deposita los fondos del primer hito en custodia.
                </p>
                <div className="step-tags">
                  <span className="tag">Honorarios por etapas</span>
                  <span className="tag">Poder especial integrado</span>
                  <span className="tag">Fondos asegurados</span>
                </div>
              </div>
            </div>

            <div className="lawyer-step-item">
              <div className="step-number-circle">03</div>
              <div className="step-content">
                <span className="step-phase">EJECUCIÓN Y COBRO</span>
                <h3>Sube evidencias de avance y recibe tus honorarios</h3>
                <p>
                  Carga el radicado del juzgado, memorial presentado o entregable acordado en el espacio compartido. El cliente valida el cumplimiento del hito y la plataforma transfiere automáticamente los honorarios custodiados a tu cuenta bancaria.
                </p>
                <div className="step-tags">
                  <span className="tag">Transferencia bancaria directa</span>
                  <span className="tag">Trazabilidad para tu cliente</span>
                  <span className="tag">Constancia de entrega</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison: Traditional vs LexMarket */}
        <section className="lawyer-comparison-section wrap">
          <div className="section-head text-center">
            <span className="overline">EL CONTRASTE</span>
            <h2>La práctica legal convencional vs. LexMarket</h2>
            <p className="section-subtitle">
              Compara cómo cambia tu día a día profesional cuando la tecnología resuelve la parte administrativa y de cobranza.
            </p>
          </div>

          <div className="comparison-table-wrapper">
            <div className="comparison-column traditional">
              <div className="comparison-col-header">
                <span className="col-badge bad">EJERCICIO TRADICIONAL</span>
                <h3>Modelo convencional</h3>
                <p>Alta incertidumbre y fricción operativa constante.</p>
              </div>
              <div className="comparison-items">
                <div className="comparison-row">
                  <div className="row-icon-x"><X size={16} /></div>
                  <div>
                    <strong>Captación dispersa</strong>
                    <p>Dependencia de recomendaciones esporádicas y llamadas informales sin garantía de contratación.</p>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="row-icon-x"><X size={16} /></div>
                  <div>
                    <strong>Expedientes caóticos</strong>
                    <p>Fotos borrosas por WhatsApp, audios de 10 minutos y documentos incompletos que exigen días de clasificación.</p>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="row-icon-x"><X size={16} /></div>
                  <div>
                    <strong>Cobro desgastante</strong>
                    <p>Horas invertidas cobrando anticipos y honorarios, con riesgo real de no pago tras radicar el trabajo.</p>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="row-icon-x"><X size={16} /></div>
                  <div>
                    <strong>Desorganización de evidencias</strong>
                    <p>Comprobantes perdidos en correos o chats personales, dificultando la rendición de cuentas al cliente.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="comparison-column lexmarket">
              <div className="comparison-col-header">
                <span className="col-badge good">CON LEXMARKET</span>
                <h3>Tu despacho en LexMarket</h3>
                <p>Estructura profesional, seguridad económica y prestigio.</p>
              </div>
              <div className="comparison-items">
                <div className="comparison-row">
                  <div className="row-icon-check"><Check size={16} /></div>
                  <div>
                    <strong>Casos calificados y filtrados</strong>
                    <p>Acceso constante a clientes informados que buscan activamente representación profesional.</p>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="row-icon-check"><Check size={16} /></div>
                  <div>
                    <strong>Intake legal estructurado</strong>
                    <p>Hechos ordenados cronológicamente, pretensiones claras y documentos adjuntos clasificados desde el día uno.</p>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="row-icon-check"><Check size={16} /></div>
                  <div>
                    <strong>Custodia protegida de honorarios</strong>
                    <p>El dinero está resguardado en la plataforma antes de que des el primer paso. Cero morosidad.</p>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="row-icon-check"><Check size={16} /></div>
                  <div>
                    <strong>Despacho digital seguro</strong>
                    <p>Espacio colaborativo con trazabilidad de radicados, bitácora de actuaciones y respaldo documental continuo.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Verification and Institutional Trust Section */}
        <section className="lawyer-verification-section wrap">
          <div className="verification-card">
            <div className="verification-content">
              <div className="lawyer-hero-badge">
                <UserCheck size={15} />
                <span>ESTÁNDAR ÉTICO Y PROFESIONAL</span>
              </div>
              <h2>Verificación rigurosa con Tarjeta Profesional</h2>
              <p>
                Para garantizar la idoneidad técnica y proteger a los usuarios, todos los abogados en LexMarket son verificados contra el <strong>Registro Nacional de Abogados (SIRNA)</strong> administrado por el <strong>Consejo Superior de la Judicatura</strong>.
              </p>
              <div className="verification-bullets">
                <div className="v-bullet">
                  <BadgeCheck size={18} className="v-icon" />
                  <div>
                    <strong>Vigencia y habilitación activa</strong>
                    <span>Validamos que la tarjeta profesional no cuente con sanciones o suspensiones vigentes.</span>
                  </div>
                </div>
                <div className="v-bullet">
                  <Scale size={18} className="v-icon" />
                  <div>
                    <strong>Cumplimiento de la Ley 1123 de 2007</strong>
                    <span>Promovemos las mejores prácticas del Código Disciplinario del Abogado en cada interacción.</span>
                  </div>
                </div>
                <div className="v-bullet">
                  <ShieldCheck size={18} className="v-icon" />
                  <div>
                    <strong>Distintivo de verificación en tu perfil</strong>
                    <span>Los clientes visualizan tu insignia oficial de profesional verificado, generando confianza inmediata.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="verification-visual">
              <div className="profile-preview-card">
                <div className="preview-top">
                  <div className="preview-avatar">
                    <span>DR</span>
                  </div>
                  <div className="preview-meta">
                    <div className="preview-name-row">
                      <h4>Dr. Camilo Restrepo</h4>
                      <span className="verified-chip"><BadgeCheck size={13} /> Verificado</span>
                    </div>
                    <span className="preview-spec">Especialista en Derecho Comercial y Litigios</span>
                    <span className="preview-tp">T.P. No. 248.910 del C. S. de la J.</span>
                  </div>
                </div>
                <div className="preview-divider" />
                <div className="preview-stats">
                  <div className="preview-stat-item">
                    <strong>100%</strong>
                    <span>Hitos cumplidos</span>
                  </div>
                  <div className="preview-stat-item">
                    <strong>4.9 / 5</strong>
                    <span>Calificación clientes</span>
                  </div>
                  <div className="preview-stat-item">
                    <strong>12 años</strong>
                    <span>Experiencia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="preguntas-abogados" className="lawyer-faq-section wrap">
          <div className="section-head text-center">
            <span className="overline">RESOLVEMOS TUS DUDAS</span>
            <h2>Preguntas frecuentes de abogados</h2>
            <p className="section-subtitle">
              Todo lo que necesitas saber sobre el funcionamiento, pagos y condiciones para profesionales.
            </p>
          </div>

          <div className="faq-accordion">
            {[
              {
                q: '¿Tiene algún costo registrarse como abogado en LexMarket?',
                a: 'El registro inicial y la creación de tu perfil profesional son completamente gratuitos. No cobramos mensualidades fijas ni suscripciones obligatorias para empezar. Solo cuando acuerdas un encargo y recibes tus honorarios, se aplica una comisión por servicio de plataforma que incluye la custodia bancaria del dinero y la infraestructura tecnológica.'
              },
              {
                q: '¿Cómo garantiza LexMarket el pago de mis honorarios?',
                a: 'Mediante un esquema de custodia previa (escrow). Cuando el cliente aprueba tu propuesta de honorarios, debe fondear el valor acordado para el primer hito antes de que comiences a trabajar. Tú tienes la certeza de que el dinero ya está resguardado en la plataforma, y se libera a tu cuenta una vez acredites el cumplimiento del hito acordado.'
              },
              {
                q: '¿Puedo fijar mis propias tarifas o LexMarket impone los precios?',
                a: 'Tienes absoluta autonomía. En LexMarket no imponemos tablas rígidas ni fijamos precios mínimos o máximos. Tú evalúas el caso, estimas el tiempo, la complejidad y propones tus honorarios bajo la modalidad que prefieras: valor fijo global, honorarios por hitos procesales o esquemas mixtos conforme a la ética profesional.'
              },
              {
                q: '¿LexMarket interviene en mi criterio jurídico o estrategia procesal?',
                a: 'En ningún momento. LexMarket es una plataforma tecnológica que facilita el encuentro, la organización del expediente y la custodia segura de pagos. La relación jurídica, el análisis sustancial, la estrategia procesal y el ejercicio profesional corresponden de forma exclusiva y autónoma al abogado apoderado.'
              },
              {
                q: '¿Qué documentos requiero para validar mi cuenta profesional?',
                a: 'Necesitas tu documento de identidad, tu número de Tarjeta Profesional expedida por el Consejo Superior de la Judicatura (CSJ), tu información académica y de especialidad, y tus datos bancarios para la liquidación de honorarios. Nuestro equipo verifica los antecedentes en el SIRNA antes de habilitar tu perfil para recibir casos.'
              },
              {
                q: '¿Cómo se formaliza el poder con el cliente?',
                a: 'Una vez aceptada tu propuesta, la plataforma facilita la generación y firma del poder especial con las facultades expresas que requiere el asunto (conforme al Art. 74 del Código General del Proceso o normas análogas). El poder queda resguardado en el expediente digital con firma y fecha electrónica verificable.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item-card ${activeFaq === idx ? 'open' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="faq-question-row">
                  <h4>{faq.q}</h4>
                  <ChevronDown size={20} className="faq-chevron" />
                </div>
                {activeFaq === idx && (
                  <div className="faq-answer-body">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="lawyer-final-cta wrap">
          <div className="final-cta-card">
            <Sparkles size={28} className="final-cta-icon" />
            <h2>Lleva tu ejercicio profesional al siguiente nivel.</h2>
            <p>
              Conéctate con clientes reales, trabaja con expedientes listos y ten la seguridad de que tus honorarios están respaldados desde el primer momento.
            </p>
            <div className="final-cta-buttons">
              <Link href="/?auth=signup&role=lawyer" className="button">
                Crear perfil profesional <ArrowRight size={17} />
              </Link>
              <Link href="/?auth=login&role=lawyer" className="button outline">
                Ya tengo una cuenta
              </Link>
            </div>
            <div className="final-cta-subnote">
              <span>Puedes registrarte con Google, LinkedIn o tu correo institucional. Verificación obligatoria de Tarjeta Profesional.</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="wrap">
        <Brand />
        <span>Plataforma tecnológica para el ejercicio legal seguro y transparente en Colombia.</span>
        <div className="footer-links">
          <Link href="/">Inicio</Link>
          <Link href="/abogados">Directorio de Abogados</Link>
          <Link href="/como-funciona">Cómo funciona</Link>
          <Link href="/para-abogados">Para abogados</Link>
        </div>
      </footer>
    </div>
  );
}
