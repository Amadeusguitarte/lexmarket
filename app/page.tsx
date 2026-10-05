'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Session } from '@supabase/supabase-js';
import { ArrowRight, CheckCircle2, Chrome, X } from 'lucide-react';
import Landing from '@/components/Landing';
import { CaseForm, Field, Modal, ProfileForm, type Row } from '@/components/Forms';
import Workspace from '@/components/Workspace';
import CaseIntake from '@/components/CaseIntake';
import {importIntake} from '@/lib/import-intake';
import {caseSchema} from '@/lib/shared';
import {draftStore} from '@/lib/intake';
import { api, browserDB } from '@/lib/browser';
import InviteModal from '@/components/InviteModal';
import type { LawyerData } from '@/components/LawyerCard';
import AuthModal from '@/components/AuthModal';
import LawyerOnboardingDashboard from '@/components/LawyerOnboardingDashboard';

function LinkedinIcon({ size = 18 }: { size?: number }) {
 return (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
   <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
 );
}

export default function Home() {
 const [session,setSession]=useState<Session|null>(null),[me,setMe]=useState<Row|null>(null),[authReady,setAuthReady]=useState(false),[authMode,setAuthMode]=useState(''),[role,setRole]=useState('client'),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState(''),[info,setInfo]=useState(''),[composer,setComposer]=useState(false),[pendingCase,setPendingCase]=useState<Row|null>(null),[googleReady,setGoogleReady]=useState(false),[linkedinReady,setLinkedinReady]=useState(false),[workspaceVersion,setWorkspaceVersion]=useState(0);
 const [inviteLawyer,setInviteLawyer]=useState<LawyerData|null>(null),[userCases,setUserCases]=useState<Row[]>([]),[loadingCases,setLoadingCases]=useState(false);

 const handleInvite = (lawyer: LawyerData) => {
  if (!session) {
   setRole('client');
   setAuthMode('login');
   setNotice('Inicia sesión o crea tu cuenta para invitar a este abogado.');
   return;
  }
  setInviteLawyer(lawyer);
  setLoadingCases(true);
  api('cases').then(data => setUserCases(data.items || [])).catch(() => {}).finally(() => setLoadingCases(false));
 };

 const handleSendInvite = async (caseId: string, lawyerId: string) => {
  await api(`professionals/${lawyerId}/invite`, 'POST', { case_id: caseId });
  setNotice(`¡Invitación enviada exitosamente a ${inviteLawyer?.name}!`);
 };

 useEffect(()=>{try{const saved=localStorage.getItem('lexmarket.pendingCase');const savedRole=localStorage.getItem('lexmarket.intendedRole');if(saved)setPendingCase(JSON.parse(saved));if(savedRole==='lawyer'||savedRole==='client')setRole(savedRole);if(typeof window!=='undefined'){const sp=new URLSearchParams(window.location.search);const qAuth=sp.get('auth');const qRole=sp.get('role');if(qRole==='lawyer'||qRole==='client'){setRole(qRole);try{localStorage.setItem('lexmarket.intendedRole',qRole);}catch{}}if(qAuth==='signup'||qAuth==='login'||qAuth==='reset'){setAuthMode(qAuth);}}}catch{}const db=browserDB();if(!db){setAuthReady(true);return;}db.auth.getSession().then(({data})=>{setSession(data.session);setAuthReady(true);});const {data}=db.auth.onAuthStateChange((event,s)=>{setSession(s);if(event==='PASSWORD_RECOVERY')setAuthMode('update');});return ()=>data.subscription.unsubscribe();},[]);
 useEffect(()=>{void draftStore('read').then(d=>{if(d&&caseSchema.safeParse(d.data).success)setPendingCase(d.data);}).catch(()=>{});void googleAvailable().then(setGoogleReady).catch(()=>{});void linkedinAvailable().then(setLinkedinReady).catch(()=>{});},[]);
 useEffect(()=>{if(session)api('me').then(setMe).catch(e=>setError(e.message));else setMe(null);},[session]);
 async function run(fn:()=>Promise<void>) {setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:'No pudimos completar la acción.');}finally{setBusy(false);}}
 function start(r:string){setRole(r);try{localStorage.setItem('lexmarket.intendedRole',r);}catch{}if(r==='client')setComposer(true);else setAuthMode('signup');}
 function keepDraft(data:Row){setPendingCase(data);try{localStorage.setItem('lexmarket.pendingCase',JSON.stringify(data));}catch{}setComposer(false);setAuthMode('signup');setNotice('Tu borrador está preparado. Entra o crea tu cuenta para guardarlo en privado.');}
 async function googleAvailable(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return false;const response=await fetch(url+'/auth/v1/settings',{headers:{apikey:key},cache:'no-store'});if(!response.ok)return false;const settings=await response.json();return settings.external?.google===true;}
 async function linkedinAvailable(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return false;const response=await fetch(url+'/auth/v1/settings',{headers:{apikey:key},cache:'no-store'});if(!response.ok)return false;const settings=await response.json();return settings.external?.linkedin===true||settings.external?.linkedin_oidc===true;}
 async function continueWithGoogle(){await run(async()=>{const db=browserDB();if(!db){setInfo('setup');return;}if(!await googleAvailable()){setGoogleReady(false);throw new Error('Google aún no está disponible. Puedes continuar con tu correo; tu borrador sigue guardado.');}localStorage.setItem('lexmarket.intendedRole',role);const {error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin}});if(error)throw error;});}
 async function continueWithLinkedIn(){await run(async()=>{const db=browserDB();if(!db){setInfo('setup');return;}localStorage.setItem('lexmarket.intendedRole',role);const {error}=await db.auth.signInWithOAuth({provider:'linkedin_oidc',options:{redirectTo:location.origin}});if(error){const {error:err2}=await db.auth.signInWithOAuth({provider:'linkedin' as any,options:{redirectTo:location.origin}});if(err2)throw error;}});}
 async function saveProfile(data:Row){await api('me','PUT',data);setMe(await api('me'));}
 async function importDraft(){await run(async()=>{if(!session)return;await importIntake(session.user.id,setNotice,pendingCase);setPendingCase(null);setWorkspaceVersion(v=>v+1);setNotice('Tu caso y sus documentos están guardados en privado. Abre el caso para revisar el resumen antes de compartirlo.');});}
 const authSubmit=(form:HTMLFormElement)=>run(async()=>{const data=new FormData(form),db=browserDB();if(!db){setInfo('setup');return;}const email=String(data.get('email')||''),password=String(data.get('password')||'');
  if(authMode==='signup'){const {error}=await db.auth.signUp({email,password,options:{data:{intended_role:role},emailRedirectTo:location.origin}});if(error)throw error;setNotice('Revisa tu correo para confirmar la cuenta. Si ya tenías una, puedes entrar.');setAuthMode('login');}
  else if(authMode==='reset'){const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)throw error;setNotice('Si hay una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.');setAuthMode('login');}
  else if(authMode==='update'){const {error}=await db.auth.updateUser({password});if(error)throw error;setAuthMode('');setNotice('Contraseña actualizada.');}
  else {const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;setAuthMode('');}
 });
 const infoText:Record<string,{title:string;paragraphs:string[]}>= {
  setup:{title:'Estamos preparando la apertura',paragraphs:['La interfaz ya está disponible. Para crear cuentas y guardar casos es necesario conectar los servicios de la plataforma. Esta pantalla no guarda ni simula una cuenta.']},
  privacy:{title:'Tus documentos, bajo tu control',paragraphs:['El título, la ciudad, la categoría y el resumen aprobado se comparten con abogados verificados. El relato privado y los documentos requieren tu autorización de acceso.','Puedes retirar accesos desde cada caso. Esto impide nuevas consultas en la plataforma, pero no elimina las copias que alguien haya descargado.','La organización asistida es opcional. Solo se envían textos al proveedor de IA cuando lo autorizas. Puedes trabajar sin ella.','Esta versión está destinada a una beta por invitación. Antes de abrir el servicio al público, el operador debe publicar su identificación, la política de tratamiento, los plazos de conservación y los canales para ejercer derechos.']},
  terms:{title:'Sobre esta beta',paragraphs:['LexMarket facilita el encuentro entre clientes y profesionales. Publicar o recibir propuestas no crea una representación automática. El encargo y los poderes que correspondan se acuerdan con el abogado.','Los honorarios se pactan directamente con el profesional. Esta versión no procesa pagos, no radica documentos ante autoridades y no calcula plazos judiciales.','La verificación profesional requiere una revisión del equipo. Las actualizaciones del proceso las registran las personas participantes; no son un reporte oficial de un juzgado.','Las condiciones definitivas de contratación y operación deben ser publicadas por el operador antes del lanzamiento abierto.']},
  help:{title:'¿En qué podemos ayudarte?',paragraphs:['Puedes empezar con un relato y agregar archivos desde tu espacio. Si un documento sigue preparándose, espera a que termine antes de pedir una organización asistida.','Para compartir tu caso, prepara el resumen, revisa que no revele información sensible y confirma la publicación. Podrás autorizar a cada abogado que solicite acceso.',process.env.NEXT_PUBLIC_SUPPORT_EMAIL?'Escríbenos a '+process.env.NEXT_PUBLIC_SUPPORT_EMAIL:'El canal de soporte se habilitará antes de abrir la beta.']},
 };
 const isLawyerAccount = role === 'lawyer' || 
   session?.user?.user_metadata?.intended_role === 'lawyer' || 
   (typeof window !== 'undefined' && localStorage.getItem('lexmarket.intendedRole') === 'lawyer') || 
   me?.profile?.role === 'lawyer';

 if (session && isLawyerAccount && !me?.profile) {
   const lawyerName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Abogado';
   const lawyerAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '/lawyers/juan-perez.jpg';
   return (
     <>
       <LawyerOnboardingDashboard
         initialLawyerName={lawyerName}
         initialAvatar={lawyerAvatar}
         onNavigate={() => {}}
         onSaveProfile={async (data) => {
           await saveProfile({ ...data, role: 'lawyer' });
           setNotice('Perfil profesional guardado.');
         }}
         onLogout={() => run(async () => {
           const { error } = await browserDB()!.auth.signOut();
           if (error) throw error;
           setMe(null);
           setSession(null);
         })}
       />
       {(error || notice) && typeof document !== 'undefined' && createPortal(
         <div className={'toast ' + (error ? 'error' : '')} role={error ? 'alert' : 'status'}>
           <CheckCircle2 size={18} />
           <span>{error || notice}</span>
           <button aria-label="Cerrar notificación" onClick={() => { setError(''); setNotice(''); }}>
             <X size={18} />
           </button>
         </div>,
         document.body
       )}
     </>
   );
 }

 return <>
  {session&&me?.profile?<Workspace pendingImport={me.profile.role==='client'&&pendingCase?<section className="pending-import" aria-label="Borrador pendiente de guardar"><div><strong>Tu borrador te estaba esperando.</strong><p>Guarda el caso y sus archivos en esta cuenta para continuar.</p></div><button className="button" disabled={busy} onClick={()=>void importDraft()}>{busy?'Guardando…':'Guardar en mi cuenta'}<ArrowRight size={17}/></button></section>:null} key={workspaceVersion} me={me} session={session} run={run} busy={busy} onNotice={setNotice} onInfo={setInfo} onRefreshMe={async()=>setMe(await api('me'))} onLogout={()=>run(async()=>{const {error}=await browserDB()!.auth.signOut();if(error)throw error;setMe(null);})}/>:
   <Landing onStart={()=>start('client')} onLawyer={()=>start('lawyer')} onLogin={()=>setAuthMode('signup')} onInfo={setInfo} onInviteLawyer={handleInvite}/>}
  {composer&&!session&&<CaseIntake onClose={()=>setComposer(false)} onReady={keepDraft}/>}
  {inviteLawyer&&<InviteModal lawyer={inviteLawyer} cases={userCases} loadingCases={loadingCases} onClose={()=>setInviteLawyer(null)} onSendInvite={handleSendInvite} onCreateCase={()=>setComposer(true)}/>}


  {session&&me&&!me.profile&&!isLawyerAccount&&<Modal title={pendingCase?'Guarda tu espacio':'Hagamos espacio para tu caso'} onClose={()=>run(async()=>{await browserDB()!.auth.signOut();})}><p className="muted">{pendingCase?'Solo necesitamos cómo quieres aparecer para guardar lo que preparaste.':'Solo necesitamos estos datos para empezar.'}</p><ProfileForm initial={{name:session.user.user_metadata?.full_name||session.user.user_metadata?.name||''}} role={role} busy={busy} onSave={p=>run(async()=>{await saveProfile(p);setAuthMode('');})}/></Modal>}
  {authMode&&(!session||authMode==='update')&&(
    <AuthModal
      authMode={authMode}
      role={role}
      pendingCase={pendingCase}
      googleReady={googleReady}
      linkedinReady={linkedinReady}
      busy={busy}
      authReady={authReady}
      onClose={()=>setAuthMode('')}
      onModeChange={mode=>setAuthMode(mode)}
      onInfo={inf=>setInfo(inf)}
      onSubmit={form=>void authSubmit(form)}
      onContinueGoogle={()=>void continueWithGoogle()}
      onContinueLinkedIn={()=>void continueWithLinkedIn()}
      onRoleChange={r=>setRole(r)}
    />
  )}
  {info&&infoText[info]&&<Modal title={infoText[info].title} onClose={()=>setInfo('')}>{infoText[info].paragraphs.map(p=><p className="info-paragraph" key={p}>{p}</p>)}</Modal>}
  {(error||notice)&&typeof document!=='undefined'&&createPortal(<div className={'toast '+(error?'error':'')} role={error?'alert':'status'}><CheckCircle2 size={18}/><span>{error||notice}</span><button aria-label="Cerrar notificación" onClick={()=>{setError('');setNotice('');}}><X size={18}/></button></div>,document.querySelector('dialog[open]')||document.body)}
 </>;
}
