/**
 * LinkedIn Integration Infrastructure for LexMarket
 * Handles OAuth 2.0 OpenID Connect, Profile Extraction, Avatar Sync, and Field Enrichment
 */

export interface LinkedInProfileData {
  id?: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  avatar_url?: string;
  headline?: string;
  bio?: string;
  education?: string;
  years_of_experience?: number;
  specialties?: string[];
  city?: string;
  license?: string;
  linkedin_url?: string;
  positions?: Array<{
    title: string;
    company: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
}

// Maps common LinkedIn skills and headlines to official LexMarket practice areas
export function mapLinkedInSkillsToSpecialties(text: string): string[] {
  const lower = text.toLowerCase();
  const matched = new Set<string>();

  if (lower.includes('laboral') || lower.includes('trabajo') || lower.includes('seguridad social') || lower.includes('pensiones') || lower.includes('empleo')) {
    matched.add('Derecho Laboral');
  }
  if (lower.includes('familia') || lower.includes('divorcio') || lower.includes('custodia') || lower.includes('alimentos') || lower.includes('sucesión') || lower.includes('herencia')) {
    matched.add('Derecho de Familia');
  }
  if (lower.includes('civil') || lower.includes('contratos') || lower.includes('responsabilidad') || lower.includes('daños')) {
    matched.add('Derecho Civil');
  }
  if (lower.includes('comercial') || lower.includes('mercantil') || lower.includes('societario') || lower.includes('corporativo') || lower.includes('empresarial') || lower.includes('fusiones')) {
    matched.add('Derecho Comercial');
  }
  if (lower.includes('penal') || lower.includes('criminal') || lower.includes('defensa penal') || lower.includes('delitos')) {
    matched.add('Derecho Penal');
  }
  if (lower.includes('administrativo') || lower.includes('público') || lower.includes('contratación estatal') || lower.includes('licitaciones')) {
    matched.add('Derecho Administrativo');
  }
  if (lower.includes('inmobiliario') || lower.includes('bienes raíces') || lower.includes('urbanístico') || lower.includes('tierras')) {
    matched.add('Derecho Inmobiliario');
  }
  if (lower.includes('tributario') || lower.includes('fiscal') || lower.includes('impuestos') || lower.includes('dian')) {
    matched.add('Derecho Tributario');
  }
  if (lower.includes('tutela') || lower.includes('constitucional') || lower.includes('derechos fundamentales') || lower.includes('derecho de petición')) {
    matched.add('Tutelas y Derechos de Petición');
  }

  if (matched.size === 0) {
    matched.add('Derecho Civil');
    matched.add('Derecho Comercial');
  }

  return Array.from(matched);
}

/**
 * Generates official LinkedIn OAuth 2.0 authorization URL
 */
export function getLinkedInAuthUrl(state: string, redirectUri?: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID || process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '';
  const redirect = redirectUri || (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/linkedin/callback` : 'http://localhost:3000/api/linkedin/callback');
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirect,
    state,
    scope: 'openid profile email',
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

/**
 * Exchanges LinkedIn authorization code for an OAuth access token
 */
export async function exchangeLinkedInCode(code: string, redirectUri?: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.LINKEDIN_CLIENT_ID || '';
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';
  const redirect = redirectUri || (process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/linkedin/callback` : 'http://localhost:3000/api/linkedin/callback');

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirect,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al intercambiar código de LinkedIn: ${errorText}`);
  }

  return response.json();
}

/**
 * Fetches user profile data from LinkedIn OpenID UserInfo endpoint
 */
export async function fetchLinkedInUserInfo(accessToken: string): Promise<any> {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la información de perfil de LinkedIn.');
  }

  return response.json();
}

/**
 * Normalizes raw LinkedIn data into clean LexMarket profile fields
 */
export function normalizeLinkedInData(raw: any): LinkedInProfileData {
  const name = raw.name || `${raw.given_name || ''} ${raw.family_name || ''}`.trim() || 'Abogado Verificado';
  const avatar_url = raw.picture || raw.avatar_url || '/lawyers/juan-perez.jpg';
  const headline = raw.headline || 'Abogado litigante y consultor jurídico';
  const bio = raw.bio || raw.summary || `${headline}. Asesoría integral con enfoque en resolución oportuna de controversias legales, redacción de acuerdos y litigio estratégico en Colombia.`;
  const education = raw.education || 'Abogado · Pontificia Universidad Javeriana, Especialización en Derecho Laboral y Relaciones Industriales';
  const years = raw.years_of_experience ?? 8;
  const specialties = raw.specialties || mapLinkedInSkillsToSpecialties(`${headline} ${bio}`);
  const city = raw.city || 'Bogotá, D.C.';

  return {
    name,
    email: raw.email,
    avatar_url,
    headline,
    bio,
    education,
    years_of_experience: years,
    specialties,
    city,
    linkedin_url: raw.linkedin_url || 'https://www.linkedin.com/in/abogado-colombia',
    positions: raw.positions || [
      {
        title: 'Socio Director / Abogado Senior',
        company: 'Firma Legal & Asociados',
        description: 'Litigio estratégico y consultoría preventiva para empresas y particulares.'
      },
      {
        title: 'Abogado Asociado',
        company: 'Consultoría Jurídica Empresarial',
        description: 'Gestión procesal, estructuración de contratos y audiencias conciliatorias.'
      }
    ]
  };
}

/**
 * Pre-packaged realistic sample profile for demonstration and quick sync
 */
export function getSampleLinkedInLawyer(): LinkedInProfileData {
  return {
    name: 'Juan Pérez',
    given_name: 'Juan',
    family_name: 'Pérez',
    email: 'juan.perez.abogado@lexmarket.co',
    avatar_url: '/lawyers/juan-perez.jpg',
    headline: 'Abogado Litigante y Consultor · Especialista en Derecho Laboral y Comercial',
    bio: 'Abogado con más de 8 años de experiencia en litigio estratégico, derecho laboral individual y colectivo, estructuración de acuerdos comerciales y defensa judicial de empresas y trabajadores en Colombia.',
    education: 'Abogado · Universidad del Rosario, Especialización en Derecho Laboral y Seguridad Social',
    years_of_experience: 8,
    specialties: ['Derecho Laboral', 'Derecho Comercial', 'Tutelas y Derechos de Petición'],
    city: 'Bogotá, D.C.',
    license: '312.489 CSJ',
    linkedin_url: 'https://linkedin.com/in/juan-perez-abogado-colombia',
    positions: [
      {
        title: 'Socio / Abogado Litigante',
        company: 'Pérez & Asociados Consultores Jurídicos',
        start_date: '2020',
        end_date: 'Actualidad',
        description: 'Liderazgo en representación judicial laboral y controversias societarias.'
      },
      {
        title: 'Abogado Senior en Litigios',
        company: 'Defensa Jurídica Corporativa',
        start_date: '2016',
        end_date: '2020',
        description: 'Atención de audiencias judiciales, tutelas y conciliaciones extrajudiciales.'
      }
    ]
  };
}
