/**
 * Parser for the PDF that LinkedIn generates with "Más → Guardar en PDF" / "More → Save to PDF".
 *
 * Rules:
 *  - Never invent data. Anything not found stays empty.
 *  - Publications/posts are intentionally ignored.
 *  - Works with Spanish and English LinkedIn exports.
 */
import { lawyerCategories } from './shared';

export interface LinkedInExperienceItem {
  company: string;
  title: string;
  start: string; // human text as in LinkedIn, e.g. "enero de 2020"
  end: string;   // "Present" / "actualidad" / "diciembre de 2022"
  start_year: number | null;
  start_month: number | null;
  end_year: number | null;   // null = current
  end_month: number | null;
  current: boolean;
  location: string;
  description: string;
}

export interface LinkedInEducationItem {
  school: string;
  degree: string;
  field: string;
  start_year: number | null;
  end_year: number | null;
}

export interface LinkedInImportedProfile {
  name: string;
  headline: string;
  location: string;
  email: string;
  linkedin_url: string;
  summary: string;
  experience: LinkedInExperienceItem[];
  education: LinkedInEducationItem[];
  skills: string[];
  languages: string[];
  certifications: string[];
  honors: string[];
  years_of_experience: number;
  suggested_specialties: string[];
}

export function emptyImportedProfile(): LinkedInImportedProfile {
  return {
    name: '', headline: '', location: '', email: '', linkedin_url: '', summary: '',
    experience: [], education: [], skills: [], languages: [], certifications: [], honors: [],
    years_of_experience: 0, suggested_specialties: [],
  };
}

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8,
  septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  ene: 1, abr: 4, ago: 8, dic: 12,
};

type SectionKey =
  | 'contact' | 'skills' | 'languages' | 'certifications' | 'honors' | 'publications'
  | 'patents' | 'summary' | 'experience' | 'education' | 'volunteer' | 'projects' | 'ignore';

const SECTION_HEADERS: Array<[RegExp, SectionKey]> = [
  [/^(contactar|contacto|contact)$/i, 'contact'],
  [/^(aptitudes principales|top skills|aptitudes|skills)$/i, 'skills'],
  [/^(languages|idiomas)$/i, 'languages'],
  [/^(certifications|certificaciones|licencias y certificaciones|licenses (&|and) certifications)$/i, 'certifications'],
  [/^(honors-awards|honors & awards|honores y premios|premios y reconocimientos|reconocimientos y premios|honores-premios)$/i, 'honors'],
  [/^(publications|publicaciones)$/i, 'publications'],
  [/^(patents|patentes)$/i, 'patents'],
  [/^(extracto|summary|acerca de|about|resumen)$/i, 'summary'],
  [/^(experiencia|experience)$/i, 'experience'],
  [/^(educación|educacion|education|formación|formacion)$/i, 'education'],
  [/^(volunteer experience|voluntariado|experiencia de voluntariado)$/i, 'volunteer'],
  [/^(projects|proyectos)$/i, 'projects'],
];

const PAGE_MARKER = /^(page|página|pagina)\s+\d+\s+(of|de)\s+\d+$/i;
const DURATION_ONLY = /^(\d+\s+(años?|years?|meses|mes|months?)\s*)+$/i;
const MONTH_WORD = '(?:[a-záéíóúñ]+\\.?\\s+(?:de\\s+)?)?';
const PRESENT_WORD = '(?:present|presente|actualidad|la actualidad|hoy|now|current)';
const DATE_RANGE = new RegExp(
  `^(${MONTH_WORD}\\d{4})\\s*[-–—]\\s*(${PRESENT_WORD}|${MONTH_WORD}\\d{4})\\s*(\\(.*\\))?$`,
  'i',
);
const LOCATION_HINT = /(colombia|bogot[aá]|medell[ií]n|cali|barranquilla|cartagena|bucaramanga|pereira|manizales|c[uú]cuta|ibagu[eé]|santa marta|villavicencio|pasto|neiva|armenia|monter[ií]a|popay[aá]n|tunja|área|area|metropolitana|metropolitan|remoto|remote|h[ií]brido|hybrid|presencial|on-site|espa[ñn]a|m[eé]xico|chile|per[uú]|argentina|ecuador|panam[aá]|estados unidos|united states|miami|madrid)/i;

function cleanLine(line: string): string {
  return line.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function sectionOf(line: string): SectionKey | null {
  for (const [re, key] of SECTION_HEADERS) if (re.test(line)) return key;
  return null;
}

function parseDatePart(text: string): { year: number | null; month: number | null; present: boolean } {
  const t = text.trim().toLowerCase();
  if (new RegExp(`^${PRESENT_WORD}$`, 'i').test(t)) return { year: null, month: null, present: true };
  const year = t.match(/(\d{4})/);
  const monthWord = t.replace(/\d{4}/, '').replace(/\bde\b/g, '').replace(/\./g, '').trim();
  return {
    year: year ? Number(year[1]) : null,
    month: monthWord && MONTHS[monthWord] ? MONTHS[monthWord] : null,
    present: false,
  };
}

function isLocationLine(line: string): boolean {
  if (!line || line.length > 70) return false;
  if (/[.;:]$/.test(line)) return false;
  return LOCATION_HINT.test(line);
}

function looksLikeDescription(line: string): boolean {
  return line.length > 70 || /[.;:]$/.test(line) || /^[-•·▪●*]/.test(line);
}

function joinParagraphs(lines: string[]): string {
  const out: string[] = [];
  for (const l of lines) {
    if (!out.length) { out.push(l); continue; }
    const prev = out[out.length - 1];
    if (/^[-•·▪●*]/.test(l) || /[.!?:]$/.test(prev)) out.push(l);
    else out[out.length - 1] = `${prev} ${l}`;
  }
  return out.join('\n').trim();
}

/** Split raw PDF text into sections. Content before the first header goes to "contact". */
function splitSections(lines: string[]): { sections: Map<SectionKey, string[][]>; order: Array<{ key: SectionKey; lines: string[] }> } {
  const order: Array<{ key: SectionKey; lines: string[] }> = [{ key: 'contact', lines: [] }];
  for (const line of lines) {
    const key = sectionOf(line);
    if (key) { order.push({ key, lines: [] }); continue; }
    order[order.length - 1].lines.push(line);
  }
  const sections = new Map<SectionKey, string[][]>();
  for (const s of order) {
    if (!sections.has(s.key)) sections.set(s.key, []);
    sections.get(s.key)!.push(s.lines);
  }
  return { sections, order };
}

function parseExperience(lines: string[]): LinkedInExperienceItem[] {
  const dateIdx: number[] = [];
  lines.forEach((l, i) => { if (DATE_RANGE.test(l)) dateIdx.push(i); });
  if (!dateIdx.length) return [];

  type Draft = { i: number; title: string; company: string; headerStart: number };
  const drafts: Draft[] = [];
  let groupCompany = '';
  let prevBodyStart = -1;

  for (let k = 0; k < dateIdx.length; k++) {
    const i = dateIdx[k];
    const title = lines[i - 1] || '';
    const before = lines[i - 2];
    let company = '';
    let headerStart = i - 1;

    if (before !== undefined && DURATION_ONLY.test(before)) {
      // "Company / 5 años 2 meses / Title / dates" → grouped roles
      company = lines[i - 3] || '';
      groupCompany = company;
      headerStart = i - 3;
    } else if (k > 0 && groupCompany && (before === undefined || i - 2 < prevBodyStart || isLocationLine(before) || looksLikeDescription(before) || DATE_RANGE.test(before))) {
      // Another role in the same company group
      company = groupCompany;
      headerStart = i - 1;
    } else {
      company = before ?? '';
      groupCompany = '';
      headerStart = i - 2;
    }
    if (k === 0 && headerStart < 0) headerStart = 0;
    drafts.push({ i, title, company, headerStart: Math.max(0, headerStart) });
    prevBodyStart = i + 1;
  }

  return drafts.map((d, k) => {
    const m = lines[d.i].match(DATE_RANGE)!;
    const start = parseDatePart(m[1]);
    const end = parseDatePart(m[2]);
    const bodyEnd = k + 1 < drafts.length ? drafts[k + 1].headerStart : lines.length;
    let bodyStart = d.i + 1;
    let location = '';
    if (bodyStart < bodyEnd && isLocationLine(lines[bodyStart])) { location = lines[bodyStart]; bodyStart++; }
    const description = joinParagraphs(lines.slice(bodyStart, bodyEnd).filter(l => !DURATION_ONLY.test(l)));
    return {
      company: d.company,
      title: d.title,
      start: m[1].trim(),
      end: m[2].trim(),
      start_year: start.year,
      start_month: start.month,
      end_year: end.present ? null : end.year,
      end_month: end.present ? null : end.month,
      current: end.present,
      location,
      description: description.slice(0, 2000),
    };
  }).filter(e => e.title || e.company);
}

function parseEducation(lines: string[]): LinkedInEducationItem[] {
  const items: LinkedInEducationItem[] = [];
  const used = new Set<number>();
  lines.forEach((l, i) => {
    if (!(/·/.test(l) || /\(\s*\d{4}/.test(l))) return;
    const school = lines[i - 1] && !used.has(i - 1) ? lines[i - 1] : '';
    const [left, right = ''] = l.split('·').map(s => s.trim());
    const years = (right || l).match(/(\d{4})(?:\s*[-–]\s*(\d{4}))?/);
    const degreeText = /\(\s*\d{4}/.test(left) && !right ? left.replace(/\(.*\)/, '').trim() : left;
    const [degree, ...fieldParts] = degreeText.split(',').map(s => s.trim());
    items.push({
      school,
      degree: degree || '',
      field: fieldParts.join(', '),
      start_year: years ? Number(years[1]) : null,
      end_year: years && years[2] ? Number(years[2]) : null,
    });
    used.add(i - 1); used.add(i);
  });
  // Schools listed without a degree line
  lines.forEach((l, i) => {
    if (used.has(i) || /·/.test(l)) return;
    if (l.length < 120 && /(universidad|university|colegio|college|escuela|school|instituto|institute|facultad|pontificia|externado|rosario|javeriana|andes|sabana)/i.test(l)) {
      items.push({ school: l, degree: '', field: '', start_year: null, end_year: null });
    }
  });
  return items.filter(e => e.school || e.degree);
}

function listItems(lines: string[] | undefined): string[] {
  if (!lines) return [];
  const out: string[] = [];
  for (const l of lines) {
    if (!l || l.length > 140) continue;
    out.push(l);
  }
  return Array.from(new Set(out));
}

/** Total years of experience from merged date intervals (overlaps counted once). */
export function computeYearsOfExperience(items: LinkedInExperienceItem[], now = new Date()): number {
  const intervals = items
    .filter(e => e.start_year)
    .map(e => {
      const s = (e.start_year as number) * 12 + ((e.start_month || 1) - 1);
      const eYear = e.current || !e.end_year ? now.getFullYear() : e.end_year;
      const eMonth = e.current || !e.end_year ? now.getMonth() + 1 : (e.end_month || 12);
      return [s, eYear * 12 + (eMonth - 1)] as [number, number];
    })
    .filter(([s, e]) => e >= s)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur: [number, number] | null = null;
  for (const iv of intervals) {
    if (!cur) { cur = [...iv]; continue; }
    if (iv[0] <= cur[1] + 1) cur[1] = Math.max(cur[1], iv[1]);
    else { total += cur[1] - cur[0] + 1; cur = [...iv]; }
  }
  if (cur) total += cur[1] - cur[0] + 1;
  return Math.min(60, Math.floor(total / 12));
}

const SPECIALTY_KEYWORDS: Array<[typeof lawyerCategories[number], RegExp]> = [
  ['Derecho Laboral', /\b(laboral|trabajo|seguridad social|pensiones|empleo|despido|n[oó]mina|labor law|employment)\b/i],
  ['Derecho de Familia', /\b(familia|divorcio|custodia|alimentos|sucesi[oó]n|herencia|family law)\b/i],
  ['Derecho Civil', /\b(civil|contratos|responsabilidad civil|da[ñn]os|obligaciones|contract law)\b/i],
  ['Derecho Penal', /\b(penal|criminal|delitos|defensa penal|fiscal[ií]a)\b/i],
  ['Derecho Comercial', /\b(comercial|mercantil|societario|corporativo|empresarial|fusiones|m&a|corporate law)\b/i],
  ['Derecho Administrativo', /\b(administrativo|p[uú]blico|contrataci[oó]n estatal|licitaci[oó]n|procuradur[ií]a|contralor[ií]a)\b/i],
  ['Derecho Inmobiliario', /\b(inmobiliario|bienes ra[ií]ces|urban[ií]stico|propiedad horizontal|arrendamiento|real estate)\b/i],
  ['Derecho Migratorio', /\b(migratorio|migraci[oó]n|visas?|extranjer[ií]a|immigration)\b/i],
  ['Derecho Tributario', /\b(tributario|fiscal|impuestos|dian|tax law|taxation)\b/i],
  ['Tutelas y Derechos de Petición', /\b(tutela|constitucional|derechos fundamentales|derecho de petici[oó]n)\b/i],
];

/** Only suggests specialties with explicit evidence in the text. No default fallback. */
export function suggestSpecialties(text: string): string[] {
  return SPECIALTY_KEYWORDS.filter(([, re]) => re.test(text)).map(([cat]) => cat);
}

export function parseLinkedInPdfText(raw: string, opts: { knownName?: string; now?: Date } = {}): LinkedInImportedProfile {
  const profile = emptyImportedProfile();
  const lines = raw
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(l => l && !PAGE_MARKER.test(l));
  if (!lines.length) return profile;

  const { sections, order } = splitSections(lines);
  const first = (k: SectionKey) => sections.get(k)?.flat();

  // Contact block: email + linkedin URL (URL may be split over two lines)
  const contactText = (first('contact') || []).join(' ');
  const allText = lines.join(' ');
  const email = (contactText.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || allText.match(/[\w.+-]+@[\w-]+\.[\w.]+/));
  if (email) profile.email = email[0];
  const contactJoined = (first('contact') || []).join('');
  const url = contactJoined.match(/(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]+)/i) || allText.match(/(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]+)/i);
  if (url) profile.linkedin_url = `https://www.linkedin.com/in/${url[1].replace(/\(LinkedIn\)$/i, '')}`;

  // Name / headline / location: the block that sits right before Summary or Experience
  const mainIdx = order.findIndex(s => s.key === 'summary' || s.key === 'experience');
  if (mainIdx > 0) {
    const prevSection = order[mainIdx - 1];
    const block = prevSection.lines.slice();
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const isNameLike = (l: string) => /^[A-ZÁÉÍÓÚÑ][\p{L}'.-]+(\s+[A-ZÁÉÍÓÚÑ][\p{L}'.-]+){1,4}$/u.test(l) && !/@|\d/.test(l);
    let nameAt = -1;
    if (opts.knownName && opts.knownName.trim().length > 2) {
      const target = norm(opts.knownName);
      nameAt = block.findIndex(l => norm(l) === target);
      if (nameAt === -1) nameAt = block.findIndex(l => l.length < 80 && (norm(l).includes(target) || (target.includes(norm(l)) && norm(l).split(' ').length >= 2)));
    }
    if (nameAt === -1) {
      // Layout: Name / Headline (1–2 lines) / Location. Anchor on the location line.
      const locAt = block.length && isLocationLine(block[block.length - 1]) ? block.length - 1 : block.length;
      for (const offset of [2, 3, 1]) {
        const i = locAt - offset;
        if (i >= 0 && isNameLike(block[i])) { nameAt = i; break; }
      }
    }
    if (nameAt !== -1) {
      profile.name = block[nameAt];
      const rest = block.slice(nameAt + 1);
      if (rest.length && isLocationLine(rest[rest.length - 1])) profile.location = rest.pop() as string;
      profile.headline = rest.join(' ').slice(0, 220);
      prevSection.lines.splice(nameAt);
    }
  }

  profile.skills = listItems(first('skills'));
  profile.languages = listItems(first('languages')).map(l => l.replace(/\s*\(.*\)\s*$/, '').trim()).filter(Boolean);
  profile.certifications = listItems(first('certifications'));
  profile.honors = listItems(first('honors'));

  profile.summary = joinParagraphs(first('summary') || []).slice(0, 2600);
  profile.experience = parseExperience(first('experience') || []);
  profile.education = parseEducation(first('education') || []);
  profile.years_of_experience = computeYearsOfExperience(profile.experience, opts.now);
  profile.suggested_specialties = suggestSpecialties([
    profile.headline, profile.summary, profile.skills.join(' '),
    profile.experience.map(e => `${e.title} ${e.description}`).join(' '),
  ].join(' '));
  return profile;
}

/** Short education text for the legacy `education` column / public cards. */
export function educationSummary(items: LinkedInEducationItem[]): string {
  return items
    .map(e => [e.degree && e.field ? `${e.degree}, ${e.field}` : e.degree || e.field, e.school].filter(Boolean).join(' · '))
    .filter(Boolean)
    .join(' | ')
    .slice(0, 500);
}
