import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  EyeOff,
  FileCheck2,
  UserCheck,
  RefreshCw,
  Sparkles,
  Mail,
  Scale,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { Brand } from '@/components/Landing';
import PublicHeaderWrapper from '@/components/PublicHeader';

export const metadata: Metadata = {
  title: 'Política de Privacidad y Tratamiento de Datos · MatchJurídico',
  description: 'Conoce cómo protegemos tu identidad, documentos y expediente legal bajo reserva y confidencialidad absoluta.',
};

export default function PrivacidadPage() {
  const lastUpdated = '18 de octubre de 2026';

  return (
    <div className="privacy-page-shell">
      {/* Header */}
      <PublicHeaderWrapper>
        <div className="public-header wrap">
          <Link href="/" aria-label="MatchJurídico inicio">
            <Brand />
          </Link>
          <nav aria-label="Principal">
            <Link href="/abogados">Explorar Abogados</Link>
            <Link href="/como-funciona">Cómo funciona</Link>
            <Link href="/para-abogados">Para abogados</Link>
            <Link href="/privacidad" className="active-nav">Privacidad</Link>
            <Link href="/#preguntas">Preguntas</Link>
          </nav>
          <Link href="/?auth=login" className="button small outline">
            Entrar <ArrowRight size={15} />
          </Link>
        </div>
      </PublicHeaderWrapper>

      <main className="privacy-page-main">
        {/* Hero Section */}
        <header className="privacy-page-hero wrap">
          <Link href="/" className="privacy-back-link">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>

          <div className="privacy-hero-badge">
            <ShieldCheck size={16} />
            <span>PROTECCIÓN DE DATOS & RESERVA LEGAL</span>
          </div>

          <h1 className="privacy-hero-title">
            Tu caso puede ser visible.<br />
            <em>Tu identidad y tu expediente, no.</em>
          </h1>

          <p className="privacy-hero-lead">
            En MatchJurídico la confidencialidad no es un complemento técnico: es el principio rector de nuestra plataforma.
            Diseñamos cada flujo para que tu relato íntimo, tus archivos probatorios y tus datos personales permanezcan bajo
            tu control absoluto hasta que decidas compartirlos explícitamente.
          </p>

          <div className="privacy-hero-meta">
            <span className="privacy-meta-item">
              <Scale size={14} /> Cumplimiento Ley 1581 de 2012 (Colombia)
            </span>
            <span className="privacy-meta-sep">•</span>
            <span className="privacy-meta-item">
              Última actualización: {lastUpdated}
            </span>
          </div>
        </header>

        {/* 4 Core Pillars Grid */}
        <section className="privacy-pillars-section wrap" aria-label="Pilares fundamentales de privacidad">
          <div className="privacy-pillars-grid">
            <div className="privacy-pillar-card">
              <div className="pillar-icon-box">
                <Lock size={22} />
              </div>
              <h3>Reserva total de expediente</h3>
              <p>
                Tus archivos adjuntos y tu relato privado jamás son públicos en el catálogo general. Permanecen protegidos con candado.
              </p>
            </div>

            <div className="privacy-pillar-card">
              <div className="pillar-icon-box">
                <EyeOff size={22} />
              </div>
              <h3>Despersonalización pública</h3>
              <p>
                En el catálogo visible para abogados solo se muestra la materia jurídica, ciudad y un resumen despersonalizado sin tu nombre.
              </p>
            </div>

            <div className="privacy-pillar-card">
              <div className="pillar-icon-box">
                <RefreshCw size={22} />
              </div>
              <h3>Revocación inmediata</h3>
              <p>
                Tú decides a qué profesional otorgar acceso y puedes retirarlo en cualquier momento desde tu panel con un solo clic.
              </p>
            </div>

            <div className="privacy-pillar-card">
              <div className="pillar-icon-box">
                <Sparkles size={22} />
              </div>
              <h3>IA asistida 100% opcional</h3>
              <p>
                La estructuración asistida solo opera bajo tu acción directa y tus datos nunca se usan para entrenar modelos públicos externos.
              </p>
            </div>
          </div>
        </section>

        {/* Legal Policy Content */}
        <section className="privacy-content-section wrap">
          <div className="privacy-layout-grid">
            {/* Table of Contents Sticky Aside */}
            <aside className="privacy-toc-aside" aria-label="Índice de la política">
              <div className="privacy-toc-card">
                <h4>Contenido de la política</h4>
                <nav className="privacy-toc-nav">
                  <a href="#responsable">1. Responsable del Tratamiento</a>
                  <a href="#marco-legal">2. Marco Normativo Aplicable</a>
                  <a href="#datos-recolectados">3. Datos Personales que Recolectamos</a>
                  <a href="#finalidades">4. Finalidades del Tratamiento</a>
                  <a href="#catalogo-publico">5. Despersonalización del Catálogo</a>
                  <a href="#documentos-permisos">6. Gestión de Expedientes y Permisos</a>
                  <a href="#ia-asistida">7. Asistencia Tecnológica e IA</a>
                  <a href="#derechos-arco">8. Derechos del Titular (ARCO)</a>
                  <a href="#seguridad">9. Seguridad y Cifrado</a>
                  <a href="#conservacion">10. Conservación y Supresión</a>
                  <a href="#contacto">11. Canales de Contacto</a>
                </nav>
              </div>
            </aside>

            {/* Document Body */}
            <article className="privacy-article-body">
              {/* 1 */}
              <section id="responsable" className="privacy-block">
                <h2>1. Identificación del Responsable del Tratamiento</h2>
                <p>
                  El sitio web y la plataforma accesible a través de <strong>matchjuridico.com</strong> (en adelante, «MatchJurídico», «la Plataforma» o «nosotros»)
                  opera como un espacio digital de mediación, evaluación preliminar y conexión profesional entre personas naturales o jurídicas con requerimientos
                  legales («Clientes») y profesionales del derecho debidamente acreditados («Abogados»).
                </p>
                <div className="privacy-highlight-box">
                  <Mail size={18} />
                  <div>
                    <strong>Canal oficial de atención para privacidad y protección de datos:</strong>
                    <br />
                    Correo electrónico:{' '}
                    <a href="mailto:contacto@matchjuridico.com" className="privacy-inline-link">
                      contacto@matchjuridico.com
                    </a>{' '}
                    / Sede digital: República de Colombia.
                  </div>
                </div>
              </section>

              {/* 2 */}
              <section id="marco-legal" className="privacy-block">
                <h2>2. Marco Normativo Aplicable</h2>
                <p>
                  La presente Política de Tratamiento de Datos Personales se fundamenta en la legislación colombiana, en especial:
                </p>
                <ul className="privacy-bullet-list">
                  <li><strong>Ley Estatutaria 1581 de 2012</strong>, por la cual se dictan disposiciones generales para la protección de datos personales.</li>
                  <li><strong>Decreto Reglamentario 1377 de 2013</strong> (compilado en el Decreto Único 1074 de 2015).</li>
                  <li><strong>Artículo 15 de la Constitución Política de Colombia</strong> (Derecho a la Intimidad y al Hábeas Data).</li>
                  <li>Principios internacionales de Privacidad desde el Diseño (<em>Privacy by Design</em>) y Privacidad por Defecto (<em>Privacy by Default</em>).</li>
                </ul>
              </section>

              {/* 3 */}
              <section id="datos-recolectados" className="privacy-block">
                <h2>3. Datos Personales que Recolectamos</h2>
                <p>
                  MatchJurídico recolecta únicamente los datos pertinentes, adecuados y estrictamente necesarios para prestar los servicios de la plataforma:
                </p>

                <h3>A. De los Clientes o Solicitantes:</h3>
                <ul className="privacy-bullet-list">
                  <li><strong>Datos de cuenta y autenticación:</strong> Nombre o alias, correo electrónico y foto de perfil voluntaria (obtenida mediante correo directo o proveedores OAuth como Google o LinkedIn).</li>
                  <li><strong>Datos de ubicación del caso:</strong> Ciudad, municipio y departamento donde se radicaría o tramita el asunto legal.</li>
                  <li><strong>Datos del asunto legal:</strong> Materia jurídica (laboral, civil, comercial, penal, familia, administrativa, etc.), resumen despersonalizado, relato confidencial de los hechos y documentos aportados como soporte probatorio.</li>
                  <li><strong>Datos de contraparte (opcional):</strong> Nombre de la contraparte involucrada, resguardado exclusivamente para que los abogados puedan descartar eventuales conflictos de interés antes de entablar contacto.</li>
                </ul>

                <h3>B. De los Abogados y Profesionales del Derecho:</h3>
                <ul className="privacy-bullet-list">
                  <li><strong>Datos de identificación y contacto:</strong> Nombres y apellidos, correo electrónico institucional o profesional, teléfono y foto de perfil.</li>
                  <li><strong>Datos de idoneidad y acreditación profesional:</strong> Número de Cédula de Ciudadanía y número de <strong>Tarjeta Profesional</strong> vigente emitida por el Consejo Superior de la Judicatura (CSJ) de Colombia.</li>
                  <li><strong>Datos de perfil profesional:</strong> Áreas de práctica, posgrados, años de experiencia comprobada, modalidad de honorarios y perfil de LinkedIn vinculado.</li>
                </ul>
              </section>

              {/* 4 */}
              <section id="finalidades" className="privacy-block">
                <h2>4. Finalidades del Tratamiento de Datos</h2>
                <p>
                  Los datos personales recolectados por MatchJurídico son tratados para las siguientes finalidades legítimas:
                </p>
                <ol className="privacy-numbered-list">
                  <li>Permitir la creación, gestión y acceso seguro a las cuentas de usuario de clientes y abogados.</li>
                  <li>Facilitar la intermediación y recepción de propuestas de asesoría jurídica estructuradas y transparentes.</li>
                  <li>Habilitar canales de mensajería interna cifrada y controlada para consultas preliminares entre clientes y abogados.</li>
                  <li>Verificar la identidad profesional y vigencia de la acreditación de los abogados postulantes ante los registros oficiales correspondientes.</li>
                  <li>Enviar notificaciones operativas sobre el estado del caso, recepción de nuevas propuestas o mensajes recibidos.</li>
                  <li>Garantizar la seguridad de la plataforma, prevenir fraudes, suplantaciones de identidad o abusos del servicio.</li>
                </ol>
                <p>
                  <strong>En ningún caso MatchJurídico vende, comercializa ni cede bases de datos de sus usuarios a terceros para fines publicitarios.</strong>
                </p>
              </section>

              {/* 5 */}
              <section id="catalogo-publico" className="privacy-block">
                <h2>5. Principio de Despersonalización del Catálogo Público</h2>
                <p>
                  Para proteger la reputación y tranquilidad de nuestros usuarios, en el catálogo de casos accesible por abogados registrados:
                </p>
                <div className="privacy-card-banner">
                  <CheckCircle2 size={20} className="banner-check-icon" />
                  <div>
                    <strong>Lo que los abogados SÍ pueden ver en el catálogo general:</strong>
                    <p>Materia jurídica, ciudad o jurisdicción, estado del trámite y el resumen general previamente aprobado por ti.</p>
                  </div>
                </div>
                <div className="privacy-card-banner warning">
                  <EyeOff size={20} className="banner-eye-icon" />
                  <div>
                    <strong>Lo que NUNCA es visible en el catálogo general:</strong>
                    <p>Tu nombre real, tus datos de contacto, tu relato privado detallado, la identidad de contrapartes ni los archivos o expedientes adjuntos.</p>
                  </div>
                </div>
              </section>

              {/* 6 */}
              <section id="documentos-permisos" className="privacy-block">
                <h2>6. Gestión de Expedientes y Permisos Granulares</h2>
                <p>
                  La arquitectura de MatchJurídico incorpora un modelo de <strong>control granular de accesos</strong>:
                </p>
                <ul className="privacy-bullet-list">
                  <li><strong>Custodia privada:</strong> Los documentos que subes (demandas, contratos, tutelas, pruebas) se almacenan en repositorios privados y cifrados.</li>
                  <li><strong>Aprobación obligatoria:</strong> Si un abogado muestra interés en tu caso y requiere analizar tus documentos, debe solicitar tu autorización dentro de la conversación.</li>
                  <li><strong>Tú decides cuándo autorizar:</strong> El inicio de una conversación en el chat NO le otorga al abogado acceso a tus archivos. Dicho acceso solo se abre cuando presionas conscientemente el botón de autorizar.</li>
                  <li><strong>Revocación en cualquier momento:</strong> Puedes revocar el acceso a tus documentos a un abogado específico en cualquier momento desde la pestaña de permisos de tu caso.</li>
                </ul>
              </section>

              {/* 7 */}
              <section id="ia-asistida" className="privacy-block">
                <h2>7. Asistencia Tecnológica e Inteligencia Artificial</h2>
                <p>
                  MatchJurídico pone a disposición de los usuarios herramientas opcionales de organización preliminar del caso impulsadas por inteligencia artificial:
                </p>
                <ul className="privacy-bullet-list">
                  <li><strong>Uso estrictamente opcional:</strong> Puedes preparar, redactar y publicar tu caso de manera totalmente manual si así lo prefieres.</li>
                  <li><strong>Sin entrenamiento de modelos externos:</strong> Los fragmentos de texto enviados para su procesamiento sintético no se utilizan para entrenar modelos fundacionales públicos de terceros.</li>
                  <li><strong>Sin decisión automatizada vinculante:</strong> La IA solo asiste en la redacción preliminar y categorización; la evaluación jurídica y la estrategia corresponden exclusivamente a los abogados humanos contactados.</li>
                </ul>
              </section>

              {/* 8 */}
              <section id="derechos-arco" className="privacy-block">
                <h2>8. Derechos del Titular (Derechos ARCO)</h2>
                <p>
                  Conforme al artículo 8 de la Ley 1581 de 2012, como titular de los datos personales tienes derecho a:
                </p>
                <div className="privacy-arco-grid">
                  <div className="arco-item">
                    <strong>Acceso / Conocer</strong>
                    <p>Conocer de forma gratuita qué datos tuyos reposan en nuestros sistemas y cómo son tratados.</p>
                  </div>
                  <div className="arco-item">
                    <strong>Rectificar / Actualizar</strong>
                    <p>Actualizar datos inexactos, parciales, incompletos o que induzcan a error desde tu perfil.</p>
                  </div>
                  <div className="arco-item">
                    <strong>Suprimir / Cancelar</strong>
                    <p>Solicitar la supresión de tus datos cuando consideres que no se están respetando los principios legales.</p>
                  </div>
                  <div className="arco-item">
                    <strong>Revocar</strong>
                    <p>Revocar la autorización concedida para el tratamiento de tus datos personales en cualquier momento.</p>
                  </div>
                </div>
                <p style={{ marginTop: '20px' }}>
                  Para radicar una solicitud de Hábeas Data, puedes enviar una comunicación formal a{' '}
                  <a href="mailto:contacto@matchjuridico.com" className="privacy-inline-link">
                    contacto@matchjuridico.com
                  </a>{' '}
                  indicando tu nombre, correo asociado a tu cuenta y la descripción de la consulta o reclamo. Atenderemos tu solicitud
                  dentro de los plazos máximos fijados por la Ley 1581 de 2012 (10 a 15 días hábiles).
                </p>
              </section>

              {/* 9 */}
              <section id="seguridad" className="privacy-block">
                <h2>9. Seguridad de la Información y Cifrado</h2>
                <p>
                  Implementamos medidas técnicas, humanas y administrativas de alto estándar para proteger tus datos contra adulteración, pérdida, consulta,
                  uso o acceso no autorizado:
                </p>
                <ul className="privacy-bullet-list">
                  <li><strong>Cifrado en tránsito:</strong> Todo el tráfico entre tu navegador y los servidores de MatchJurídico está cifrado mediante TLS/HTTPS con certificados de alta seguridad.</li>
                  <li><strong>Políticas de seguridad a nivel de fila (Row Level Security - RLS):</strong> La base de datos garantiza a nivel de motor que ningún usuario pueda consultar registros privados de otro usuario sin permisos explícitos.</li>
                  <li><strong>Aislamiento de sesiones:</strong> Tokens de autenticación seguros y expiración automática de sesiones inactivas.</li>
                </ul>
              </section>

              {/* 10 */}
              <section id="conservacion" className="privacy-block">
                <h2>10. Conservación y Supresión de la Información</h2>
                <p>
                  Tus datos personales se conservarán mientras mantengas activa tu cuenta en MatchJurídico o mientras exista una relación de servicio vigente.
                  Si decides cerrar tu cuenta o solicitas su supresión, tus borradores, casos no publicados y archivos privados serán eliminados definitivamente
                  de nuestros servidores de producción, salvo aquellos datos que debamos conservar por mandato legal o fiscal aplicable.
                </p>
              </section>

              {/* 11 */}
              <section id="contacto" className="privacy-block">
                <h2>11. Canales de Contacto y Dudas</h2>
                <p>
                  Si tienes preguntas, inquietudes o deseas más detalles sobre el tratamiento de tus datos en MatchJurídico, no dudes en escribirnos:
                </p>
                <div className="privacy-contact-card">
                  <div className="contact-card-icon">
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <h4>Oficina de Privacidad y Cumplimiento</h4>
                    <p>MatchJurídico · Plataforma de Servicios Legales</p>
                    <a href="mailto:contacto@matchjuridico.com" className="privacy-contact-email">
                      contacto@matchjuridico.com
                    </a>
                  </div>
                </div>
              </section>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="wrap">
        <Brand />
        <span>© {new Date().getFullYear()} MatchJurídico — Confidencialidad & Servicios Legales.</span>
        <div>
          <Link href="/">Inicio</Link>
          <Link href="/abogados">Abogados</Link>
          <Link href="/como-funciona">Cómo funciona</Link>
          <Link href="/para-abogados">Para abogados</Link>
          <Link href="/privacidad">Privacidad</Link>
        </div>
      </footer>
    </div>
  );
}
