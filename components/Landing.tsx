'use client';
import { useState } from 'react';
import { ArrowRight, Check, FileText, FolderOpen, HeartHandshake, Laptop, ListFilter, LockKeyhole, MessageCircle, Paperclip, Plus, Scale, ShieldCheck, Sparkles, Users } from 'lucide-react';

export function Brand(){return <span className="brand">lex<span>market</span><span className="brand-dot">.</span></span>;}

export default function Landing({onStart,onLawyer,onLogin,onInfo}:{onStart:()=>void;onLawyer:()=>void;onLogin:()=>void;onInfo:(s:string)=>void}) {
 const [example,setExample]=useState('Una tutela');
 const examples:Record<string,string>={'Una tutela':'Revisar y presentar mi tutela','Un asunto laboral':'Revisar una reclamación laboral','Una reclamación':'Dar el siguiente paso con mi reclamación','Un contrato':'Revisar y ajustar un contrato'};

 return <div className="landing">
  <header className="public-header wrap">
   <a href="#" aria-label="LexMarket inicio"><Brand/></a>
   <nav aria-label="Principal"><a href="#como-funciona">Cómo funciona</a><a href="#preguntas">Preguntas</a><button className="text-button" onClick={onLawyer}>Para abogados</button></nav>
   <button className="button small outline" onClick={onLogin}>Entrar <ArrowRight size={15}/></button>
  </header>
  <main>
   <section className="hero wrap">
    <div className="hero-copy">
     <div className="eyebrow"><span className="tiny-dot"/> Un buen comienzo para lo que sigue</div>
     <h1>Dale a tu caso<br/>el <em>siguiente paso.</em></h1>
     <p className="hero-description">Encuentra al abogado que lo revise contigo y te acompañe a llevarlo adelante.</p>
     <div className="hero-actions">
      <button className="button" aria-label="Compartir mi caso" onClick={onStart}>Empezar con mi caso <ArrowRight size={18}/></button>
      <a className="quiet-link" href="#como-funciona">Conoce cómo funciona <span>↗</span></a>
     </div>
     <div className="hero-note"><LockKeyhole size={15}/> Tú decides con quién compartir tus documentos.</div>
    </div>
    
    <div className="hero-visual" aria-label="Ejemplo ilustrativo de un espacio de caso">
     {/* Detailed Neoclassical Courthouse background line art */}
     <svg className="courthouse-bg" viewBox="0 0 560 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 300H540M30 300V288H530V300M40 288V276H520V288" stroke="#decbba" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M60 276V160M90 276V160M120 276V160M150 276V160M180 276V160M210 276V160M350 276V160M380 276V160M410 276V160M440 276V160M470 276V160M500 276V160" stroke="#dfcebf" strokeWidth="1.2"/>
      <path d="M230 276V145M255 276V145M280 276V145M305 276V145M330 276V145" stroke="#d4bfab" strokeWidth="1.8"/>
      <path d="M40 160H520M40 148H520" stroke="#decbba" strokeWidth="1.5"/>
      <path d="M210 148L280 75L350 148H210Z" stroke="#d2bc9e" strokeWidth="1.8" fill="#fbf8f3" fillOpacity="0.4"/>
      <path d="M245 75C245 52 260.6 34 280 34C299.4 34 315 52 315 75" stroke="#d2bc9e" strokeWidth="1.5"/>
      <line x1="280" y1="34" x2="280" y2="12" stroke="#cbb295" strokeWidth="1.5"/>
      <path d="M280 12L302 18L280 24Z" fill="#cbb295"/>
      <path d="M72 178H82V212H72Z M102 178H112V212H102Z M132 178H142V212H132Z M392 178H402V212H392Z M422 178H432V212H422Z M452 178H462V212H452Z" stroke="#ebdccb" strokeWidth="1"/>
     </svg>

     {/* Back Folder: EXPEDIENTE */}
     <div className="folder-underlay">
      <div className="tab-top"/>
      <span className="stamp-vertical">EXPEDIENTE</span>
      {/* Rubber stamp handle drawing */}
      <svg className="stamp-handle-pos" width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg">
       <path d="M18 4C14.5 4 12 7 12 10.5C12 14 14.5 16 15.5 18.5C12.5 24 10 28.5 8 30.5C5.5 33 4 34.5 4 37V42H32V37C32 34.5 30.5 33 28 30.5C26 28.5 23.5 24 20.5 18.5C21.5 16 24 14 24 10.5C24 7 21.5 4 18 4Z" fill="#7a3244" fillOpacity="0.2" stroke="#7a3244" strokeWidth="1.5"/>
       <ellipse cx="18" cy="42" rx="14" ry="2" fill="#7a3244" fillOpacity="0.3"/>
      </svg>
      <Scale className="scale-stamp-pos" size={60}/>
      {/* Metal Paperclip on folder */}
      <svg className="folder-paperclip" width="24" height="38" viewBox="0 0 24 38" fill="none" stroke="#9a8d83" strokeWidth="2" strokeLinecap="round">
       <path d="M8 12V28C8 31.3 10.7 34 14 34C17.3 34 20 31.3 20 28V8C20 4.7 17.3 2 14 2C10.7 2 8 4.7 8 8V24C8 25.7 9.3 27 11 27C12.7 27 14 25.7 14 24V10"/>
      </svg>
     </div>

     {/* Back Sheet: ACCIÓN DE TUTELA */}
     <div className="tutela-sheet">
      <svg className="tutela-paperclip" width="24" height="38" viewBox="0 0 24 38" fill="none" stroke="#9a8d83" strokeWidth="2" strokeLinecap="round">
       <path d="M8 12V28C8 31.3 10.7 34 14 34C17.3 34 20 31.3 20 28V8C20 4.7 17.3 2 14 2C10.7 2 8 4.7 8 8V24C8 25.7 9.3 27 11 27C12.7 27 14 25.7 14 24V10"/>
      </svg>
      <div className="tutela-header">
       {/* Escudo de Colombia vector */}
       <svg className="tutela-escudo" viewBox="0 0 24 24" fill="none" stroke="#6b2d3e" strokeWidth="1.5">
        <path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z"/>
        <circle cx="12" cy="11" r="4"/>
       </svg>
       <small>REPÚBLICA DE COLOMBIA</small>
       <b>ACCIÓN DE TUTELA</b>
      </div>
      <div className="tutela-body">
       <p style={{margin:'0 0 4px',fontSize:'8px',fontWeight:'bold'}}>Señor Juez de Tutela:</p>
       <p style={{margin:0,fontSize:'7.5px',lineHeight:'1.45'}}>Ante su despacho me presento respetuosamente para solicitar el amparo constitucional inmediato de mis derechos fundamentales vulnerados...</p>
      </div>
      {/* Official circular seal */}
      <div className="tutela-seal">
       <span>REPÚBLICA DE COLOMBIA</span>
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c3547" strokeWidth="1.5" style={{margin:'1px 0'}}>
        <path d="M12 2L4 5V11C4 16.5 7.4 20.7 12 22C16.6 20.7 20 16.5 20 11V5L12 2Z"/>
       </svg>
       <span>RAMA JUDICIAL</span>
      </div>
      <svg className="bottom-paperclip" width="22" height="34" viewBox="0 0 24 38" fill="none" stroke="#9a8d83" strokeWidth="2" strokeLinecap="round">
       <path d="M8 12V28C8 31.3 10.7 34 14 34C17.3 34 20 31.3 20 28V8C20 4.7 17.3 2 14 2C10.7 2 8 4.7 8 8V24C8 25.7 9.3 27 11 27C12.7 27 14 25.7 14 24V10"/>
      </svg>
      <div className="signature-line">Jan...</div>
     </div>

     {/* Main Elevated Card: Tu caso */}
     <div className="dossier-card">
      <div className="card-tab">Tu caso</div>
      <div className="card-top-row">
       <span className="overline" style={{marginBottom:0}}>ASÍ PODRÍA VERSE TU CASO</span>
       <span className="badge-progress">En progreso</span>
      </div>
      <h2>{examples[example]}</h2>
      <p>Todo en un solo lugar, para avanzar con claridad.</p>

      <div className="card-item-row">
       <div className="card-item-icon"><FileText size={18}/></div>
       <div className="card-item-info">
        <b>Lo que has preparado</b>
        <span>Escritos, actas o documentos</span>
       </div>
       <div className="row-right-icons">
        <ListFilter size={15} style={{color:'var(--muted)'}}/>
        <div className="check-badge"><Check size={13}/></div>
       </div>
      </div>

      <div className="card-item-row">
       <div className="card-item-icon"><MessageCircle size={18}/></div>
       <div className="card-item-info">
        <b>El acompañamiento que buscas</b>
        <span>Revisión, ajustes o representación</span>
       </div>
      </div>

      <div className="card-item-row">
       <div className="card-item-icon"><Users size={18}/></div>
       <div className="card-item-info">
        <b>Conecta con abogados</b>
        <span>Perfiles verificados en Colombia</span>
       </div>
       <div className="row-right-icons">
        <div className="avatar-group">
         <span className="avatar-thumb">LR</span>
         <span className="avatar-thumb two">MA</span>
        </div>
        <div className="check-badge"><Check size={13}/></div>
       </div>
      </div>
     </div>

     {/* Floating Pills around the visual */}
     <div className="floating-pill fp-top-left">
      <Users size={16} style={{color:'var(--purple)'}}/>
      <div>
       <b>Personas reales.</b>
       <span>Soluciones reales.</span>
      </div>
     </div>

     <div className="floating-pill fp-top-right">
      <HeartHandshake size={15} style={{color:'var(--purple)'}}/>
      <span>Un paso a la vez</span>
     </div>

     <div className="floating-pill fp-bottom-left">
      <ShieldCheck size={16} style={{color:'#387250'}}/>
      <span>Compartir con tranquilidad</span>
     </div>

     <div className="floating-pill fp-bottom-center">
      <LockKeyhole size={15} style={{color:'var(--purple)'}}/>
      <span>Tu información siempre protegida</span>
     </div>

     <div className="floating-pill fp-bottom-right">
      <Laptop size={15} style={{color:'var(--purple)'}}/>
      <span>Justicia también en digital</span>
     </div>
    </div>
   </section>

   <section className="examples wrap" aria-label="Ejemplos de asuntos">
    <p>Hay muchas formas de empezar.</p>
    <div>
     {Object.keys(examples).map(e=>
      <button key={e} className={'example-pill '+(example===e?'active':'')} aria-pressed={example===e} onClick={()=>setExample(e)}>
       {e} <Plus size={14}/>
      </button>
     )}
    </div>
    <small>Y otros asuntos que necesiten una mirada profesional.</small>
   </section>
   <section className="journey-banner wrap"><img src="/lexmarket-journey.webp" width="1200" height="800" loading="lazy" alt="Una carpeta y documentos junto a un camino lila que lleva a una puerta abierta"/><div><span className="eyebrow">A TU RITMO</span><h2>Hay un siguiente paso.<br/>Encuentra con quién darlo.</h2><p>Reúne tus documentos, cuenta lo que buscas y conoce a los profesionales interesados en acompañarte.</p><button className="text-button" onClick={onStart}>Abrir mi espacio <ArrowRight size={17}/></button></div></section><section id="como-funciona" className="how-section"><div className="wrap"><div className="section-heading"><div><span className="overline">MENOS VUELTAS. MÁS CLARIDAD.</span><h2>De aquí, hacia adelante.</h2></div><p>Sin tener que contar la misma historia<br/>una y otra vez.</p></div><div className="steps-grid">{[{n:'01',icon:FolderOpen,title:'Abre tu espacio',text:'Comparte lo que tienes y cuéntanos qué te gustaría resolver. Puedes ir sumando documentos después.'},{n:'02',icon:Scale,title:'Conoce tus opciones',text:'Los abogados interesados te presentan una propuesta. Revisa su perfil, el alcance y los honorarios.'},{n:'03',icon:HeartHandshake,title:'Elige con quién avanzar',text:'Conversa, resuelve tus dudas y acuerda el acompañamiento que necesitas.'}].map(s=><article key={s.n} className="step-card"><div className="step-top"><s.icon size={25}/><span>{s.n}</span></div><h3>{s.title}</h3><p>{s.text}</p></article>)}</div></div></section>
   <section className="privacy-section wrap"><div className="privacy-art"><img src="/lexmarket-desk.svg" alt="Ilustración de un espacio de trabajo"/><span className="privacy-lock"><LockKeyhole size={22}/></span><span className="tag">Tú tienes el control</span></div><div><span className="overline">UN ESPACIO PARA TU TRANQUILIDAD</span><h2>Tu historia merece<br/>cuidado.</h2><p>Primero compartes un resumen. Tus archivos permanecen privados hasta que autorices a un abogado a revisarlos.</p><ul className="check-list"><li><Check size={17}/> Apruebas el resumen antes de publicarlo.</li><li><Check size={17}/> Decides quién puede abrir tu expediente.</li><li><Check size={17}/> Conoces el alcance antes de elegir.</li></ul></div></section>
   <section className="lawyer-banner wrap"><div><span className="overline">PARA ABOGADOS</span><h2>Tu próximo caso puede estar aquí.</h2><p>Explora asuntos de tu especialidad y propón cómo puedes acompañarlos.</p></div><button className="button light" onClick={onLawyer}>Crear perfil profesional <ArrowRight size={17}/></button></section>
   <section id="preguntas" className="faq wrap"><div><span className="overline">ANTES DE EMPEZAR</span><h2>Quizás te preguntes…</h2></div><div>{[
    ['¿Qué puedo compartir?','Una tutela, reclamación, demanda, contrato o cualquier asunto que quieras revisar con un abogado. Puedes adjuntar documentos y agregar notas o conversaciones que te hayan ayudado a prepararlo.'],
    ['¿Necesito tener todo terminado?','Puedes empezar con lo que tengas. Lo importante es explicar qué buscas y compartir el material que ayude a entender tu asunto. El profesional revisará contigo lo que haga falta.'],
    ['¿Qué verán los abogados?','Los profesionales verificados pueden explorar el resumen que apruebes. Para abrir tus documentos y conversar sobre el expediente, primero deberán solicitarte acceso.'],
    ['¿Publicar significa contratar?','Publicar no te obliga a elegir una propuesta. Cuando encuentres al profesional adecuado, deberán confirmar el encargo y, cuando corresponda, el poder antes de cualquier actuación.'],
    ['¿LexMarket presenta mi caso automáticamente?','La presentación corresponde al profesional que asuma la actuación, o a quien esté habilitado para hacerlo. La plataforma facilita el encuentro y el seguimiento.'],
   ].map(([q,a])=><details key={q}><summary>{q}<Plus size={18}/></summary><p>{a}</p></details>)}</div></section>
   <section className="final-cta wrap"><Sparkles size={24}/><h2>Lo que sigue, empieza con un paso.</h2><button className="button" onClick={onStart}>Empezar con mi caso <ArrowRight size={17}/></button></section>
  </main><footer className="wrap"><Brand/><span>Hecho para avanzar con más tranquilidad.</span><div><button onClick={()=>onInfo('privacy')}>Privacidad</button><button onClick={()=>onInfo('terms')}>Condiciones de la beta</button><button onClick={()=>onInfo('help')}>Ayuda</button></div></footer>
 </div>;
}
