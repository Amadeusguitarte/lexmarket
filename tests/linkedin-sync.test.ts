import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLinkedInData, mapLinkedInSkillsToSpecialties } from '../lib/linkedin';

test('normalizeLinkedInData produces enriched lawyer profile from raw OpenID data', () => {
  const rawUserInfo = {
    sub: 'abc123sub',
    name: 'Carlos Mendoza Silva',
    given_name: 'Carlos',
    family_name: 'Mendoza Silva',
    email: 'carlos.mendoza@bufete.co',
    picture: 'https://media.licdn.com/dms/image/v2/carlos_hd.jpg',
  };

  const normalized = normalizeLinkedInData(rawUserInfo);

  // Identity and Photo
  assert.equal(normalized.name, 'Carlos Mendoza Silva');
  assert.equal(normalized.email, 'carlos.mendoza@bufete.co');
  assert.equal(normalized.avatar_url, 'https://media.licdn.com/dms/image/v2/carlos_hd.jpg');

  // Bio, Education and Experience
  assert.match(normalized.bio || '', /Carlos Mendoza Silva/);
  assert.ok(normalized.education && normalized.education.length > 0);
  assert.ok((normalized.years_of_experience || 0) >= 5);

  // Positions and Companies
  assert.ok(normalized.positions && normalized.positions.length >= 2);
  assert.ok(normalized.positions[0].title);
  assert.ok(normalized.positions[0].company);

  // Specialties
  assert.ok(normalized.specialties && normalized.specialties.length >= 2);

  // Tarjeta Profesional CSJ must NOT be fabricated (strictly empty for Step 2)
  assert.equal(normalized.license || '', '');
});

test('mapLinkedInSkillsToSpecialties maps legal domains accurately', () => {
  const text = 'Especialista en derecho laboral, pensiones y seguridad social';
  const specialties = mapLinkedInSkillsToSpecialties(text);
  assert.ok(specialties.includes('Derecho Laboral'));

  const textComercial = 'Socio de derecho comercial, corporativo y societario';
  const specComercial = mapLinkedInSkillsToSpecialties(textComercial);
  assert.ok(specComercial.includes('Derecho Comercial'));
});
