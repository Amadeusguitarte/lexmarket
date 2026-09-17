import { z } from 'zod';
export const categories = ['Tutela','Laboral','Familia','Civil','Arrendamientos','Consumidor','Administrativo','Comercial','Penal','Otro'] as const;
export const services = ['Revisar y orientar','Revisar y ajustar documentos','Presentar una actuación','Acompañar el proceso','Definir el siguiente paso'] as const;
export const caseSchema = z.object({ title:z.string().trim().min(8).max(120), category:z.enum(categories), city:z.string().trim().min(2).max(80), service:z.enum(services), description:z.string().trim().min(30).max(40000), public_summary:z.string().trim().max(2000).default(''), urgency:z.enum(['normal','soon','urgent']).default('normal') });
export const profileSchema = z.object({name:z.string().trim().min(2).max(100),role:z.enum(['client','lawyer']),city:z.string().trim().max(80).default(''),bio:z.string().trim().max(1500).default(''),license:z.string().trim().max(80).default(''),specialties:z.array(z.enum(categories)).max(10).default([])});
export const proposalSchema = z.object({scope:z.string().trim().min(30).max(4000),exclusions:z.string().trim().min(5).max(2000),amount:z.number().int().min(0).max(1000000000),days:z.number().int().min(1).max(365),payment_terms:z.string().trim().min(5).max(1000)});
export function canReadPrivate(owner:string,user:string,verified:boolean,access?:string) { return owner===user || (verified && access==='granted'); }
export function safeName(name:string) { return name.replace(/[\x00-\x1f\x7f/\\]/g,'').slice(0,160)||'documento'; }
export function validateFile(name:string,bytes:Buffer) {
  if (!bytes.length || bytes.length>10*1024*1024) throw new Error('Cada archivo debe pesar entre 1 byte y 10 MB.');
  const ext=name.split('.').pop()?.toLowerCase();
  if (ext==='pdf' && bytes.subarray(0,5).toString()==='%PDF-') return 'application/pdf';
  if (ext==='docx' && bytes[0]===0x50 && bytes[1]===0x4b && bytes[2]===3 && bytes[3]===4) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext==='txt' && !bytes.includes(0) && !bytes.subarray(0,100).toString().includes('\ufffd')) return 'text/plain';
  throw new Error('Usa PDF, DOCX o TXT con formato válido.');
}
export const statusLabels:Record<string,string> = {review:'En revisión',draft:'Borrador',published:'Recibiendo propuestas',engaged:'En acompañamiento',closed:'Cerrado',requested:'Acceso solicitado',granted:'Acceso autorizado',revoked:'Acceso retirado',pending:'Pendiente',verified:'Verificado',rejected:'Requiere ajustes',quarantine:'Preparando archivo',clean:'Disponible',blocked:'No disponible',failed:'No se pudo procesar',queued:'En cola',working:'Organizando',done:'Terminado',accepted:'Aceptada',declined:'No seleccionada'};
