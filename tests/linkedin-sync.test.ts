import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLinkedInData, mapLinkedInSkillsToSpecialties } from '../lib/linkedin';

test('normalizeLinkedInData preserves genuine identity and NEVER fabricates dummy lawyer data', () => {
  const rawUserInfo = {
    sub: 'abc123sub',
    name: 'Louis Amadeus Arteaga',
    given_name: 'Louis Amadeus',
    family_name: 'Arteaga',
    email: 'louis@example.com',
    picture: 'https://media.licdn.com/dms/image/v2/louis_hd.jpg',
  };

  const normalized = normalizeLinkedInData(rawUserInfo);

  // Identity and Photo are genuinely mapped
  assert.equal(normalized.name, 'Louis Amadeus Arteaga');
  assert.equal(normalized.email, 'louis@example.com');
  assert.equal(normalized.avatar_url, 'https://media.licdn.com/dms/image/v2/louis_hd.jpg');

  // Legal fields MUST NOT be fabricated or mocked
  assert.equal(normalized.bio, '', 'Bio must remain empty if not provided by LinkedIn');
  assert.equal(normalized.education, '', 'Education must remain empty if not provided');
  assert.equal(normalized.years_of_experience, 0, 'Years of experience must be 0 if not provided');
  assert.deepEqual(normalized.positions, [], 'Positions must be empty if not provided');
  assert.deepEqual(normalized.specialties, [], 'Specialties must be empty if no legal domains match');
  assert.equal(normalized.license || '', '', 'License must remain empty for manual verification');
});

test('normalizeLinkedInData faithfully maps real profile data when provided', () => {
  const rawProfile = {
    name: 'Carlos Mendoza Silva',
    email: 'carlos.mendoza@bufete.co',
    picture: 'https://media.licdn.com/dms/image/v2/carlos_hd.jpg',
    headline: 'Abogado Especialista en Derecho Laboral y Seguridad Social',
    bio: 'Abogado con 10 años de experiencia asesorando empresas en litigio laboral y contratos.',
    education: 'Universidad Nacional de Colombia · Especialización en Derecho Laboral',
    years_of_experience: 10,
    positions: [
      {
        title: 'Socio Director',
        company: 'Mendoza & Asociados',
        start_date: '2016',
        end_date: 'Actualidad',
        description: 'Litigio laboral y estructuración corporativa.',
      },
    ],
  };

  const normalized = normalizeLinkedInData(rawProfile);

  assert.equal(normalized.name, 'Carlos Mendoza Silva');
  assert.equal(normalized.headline, 'Abogado Especialista en Derecho Laboral y Seguridad Social');
  assert.equal(normalized.years_of_experience, 10);
  assert.ok(normalized.positions);
  assert.equal(normalized.positions.length, 1);
  assert.equal(normalized.positions[0].company, 'Mendoza & Asociados');
  assert.ok(normalized.specialties);
  assert.ok(normalized.specialties.includes('Derecho Laboral'));
});

test('mapLinkedInSkillsToSpecialties maps legal domains accurately and returns empty for unrelated text', () => {
  const textLaboral = 'Especialista en derecho laboral, pensiones y seguridad social';
  const specLaboral = mapLinkedInSkillsToSpecialties(textLaboral);
  assert.ok(specLaboral.includes('Derecho Laboral'));

  const textComercial = 'Socio de derecho comercial, corporativo y societario';
  const specComercial = mapLinkedInSkillsToSpecialties(textComercial);
  assert.ok(specComercial.includes('Derecho Comercial'));

  // Non-legal text must return empty array without injecting fake defaults
  const unrelatedText = 'Ingeniero de Software y Desarrollador Web Fullstack';
  const specUnrelated = mapLinkedInSkillsToSpecialties(unrelatedText);
  assert.deepEqual(specUnrelated, []);
});
