'use client';
import {useEffect,useState,useCallback} from 'react';
import {Bell,X} from 'lucide-react';
import {api,browserDB} from '@/lib/browser';
import type {Row} from './Forms';
export default function Notifications({userId,onSelect}:{userId:string;onSelect:(n:Row)=>void}){
 const [items,setItems]=useState<Row[]>([]),[open,setOpen]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{try{const d=await api('notifications');setItems(d.items);setError('');}catch(e){setError((e as Error).message);}},[]);
 useEffect(()=>{void load();const db=browserDB()!;const channel=db.channel('notifications-'+userId).on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:'recipient_id=eq.'+userId},()=>{void load();window.dispatchEvent(new Event('lexmarket-update'));}).subscribe();const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},20000);return()=>{clearInterval(timer);void db.removeChannel(channel);};},[load,userId]);
 async function read(ids:string[]){if(!ids.length)return;try{await api('notifications','PATCH',{ids});setItems(list=>list.map(n=>ids.includes(n.id)?{...n,read_at:new Date().toISOString()}:n));}catch(e){setError((e as Error).message);}}
 const count=items.filter(n=>!n.read_at).length;
 return <div className="notification-center"><button className="icon-button" aria-label={'Notificaciones'+(count?', '+count+' nuevas':'')} onClick={()=>setOpen(!open)}><Bell size={21}/>{count>0&&<b className="unread-pill">{count}</b>}</button>{open&&<section className="notification-popover" aria-label="Notificaciones"><header className="messenger-heading"><b>Novedades</b><button className="icon-button" aria-label="Cerrar notificaciones" onClick={()=>setOpen(false)}><X size={18}/></button></header>{error&&<p role="alert">{error}</p>}<button className="text-button" onClick={()=>void read(items.filter(n=>!n.read_at).map(n=>n.id))}>Marcar todas como leídas</button><div>{items.map(n=><button className={'notification-row '+(!n.read_at?'unread':'')} key={n.id} onClick={()=>{void read([n.id]);setOpen(false);onSelect(n);}}><b>{n.title}</b><small>{new Date(n.created_at).toLocaleString('es-CO')}</small></button>)}{!items.length&&<p className="chat-empty">Aquí llegarán los mensajes, intereses, propuestas y decisiones sobre tu cuenta.</p>}</div></section>}</div>;
}
