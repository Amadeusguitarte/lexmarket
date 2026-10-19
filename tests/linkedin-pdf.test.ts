import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLinkedInPdfText, computeYearsOfExperience, suggestSpecialties, educationSummary } from '../lib/linkedin-pdf';

const SAMPLE_ES = `Contactar
laura.gomez@ejemplo.com
www.linkedin.com/in/laura-gomez-
abogada (LinkedIn)
Aptitudes principales
Derecho laboral
Negociación
Litigio
Languages
Español (Native or Bilingual)
Inglés (Professional Working Proficiency)
Certifications
Diplomado en Seguridad Social
Honors-Awards
Mejor promedio de la facultad
Laura Gómez Restrepo
Abogada laboralista | Socia en Gómez & Asociados
Bogotá, Distrito Capital, Colombia
Extracto
Abogada con más de diez años de experiencia en derecho laboral y seguridad social.
Represento a trabajadores y empresas en procesos de despido y pensiones.
Experiencia
Gómez & Asociados
6 años 3 meses
Socia
enero de 2021 - Present (3 años 10 meses)
Bogotá, Distrito Capital, Colombia
Dirección de litigios laborales y negociación colectiva.
Abogada asociada
agosto de 2018 - diciembre de 2020 (2 años 5 meses)
Asesoría en despidos y liquidaciones.
Ministerio del Trabajo
Abogada contratista
febrero de 2015 - julio de 2018 (3 años 6 meses)
Bogotá, Colombia
Page 1 of 2
Proyección de conceptos jurídicos sobre pensiones.
Educación
Pontificia Universidad Javeriana
Especialización, Derecho Laboral · (2016 - 2017)
Universidad del Rosario
Abogada, Derecho · (2009 - 2014)
Page 2 of 2`;

test('LinkedIn PDF parser extracts the full profile without publications or invented data', () => {
  const p = parseLinkedInPdfText(SAMPLE_ES, { now: new Date('2024-11-01') });
  assert.equal(p.name, 'Laura Gómez Restrepo');
  assert.equal(p.headline, 'Abogada laboralista | Socia en Gómez & Asociados');
  assert.equal(p.location, 'Bogotá, Distrito Capital, Colombia');
  assert.equal(p.email, 'laura.gomez@ejemplo.com');
  assert.equal(p.linkedin_url, 'https://www.linkedin.com/in/laura-gomez-abogada');
  assert.match(p.summary, /diez años de experiencia/);
  assert.deepEqual(p.skills, ['Derecho laboral', 'Negociación', 'Litigio']);
  assert.deepEqual(p.languages, ['Español', 'Inglés']);
  assert.deepEqual(p.certifications, ['Diplomado en Seguridad Social']);
  assert.deepEqual(p.honors, ['Mejor promedio de la facultad']);

  assert.equal(p.experience.length, 3);
  assert.deepEqual(
    p.experience.map(e => [e.company, e.title, e.current]),
    [
      ['Gómez & Asociados', 'Socia', true],
      ['Gómez & Asociados', 'Abogada asociada', false],
      ['Ministerio del Trabajo', 'Abogada contratista', false],
    ],
  );
  assert.equal(p.experience[0].location, 'Bogotá, Distrito Capital, Colombia');
  assert.match(p.experience[0].description, /litigios laborales/);
  assert.match(p.experience[1].description, /despidos/);
  assert.equal(p.experience[2].start_year, 2015);
  assert.equal(p.experience[2].start_month, 2);
  assert.match(p.experience[2].description, /pensiones/);
  assert.doesNotMatch(p.experience[2].description, /Page 1/);

  assert.equal(p.education.length, 2);
  assert.deepEqual(p.education[0], { school: 'Pontificia Universidad Javeriana', degree: 'Especialización', field: 'Derecho Laboral', start_year: 2016, end_year: 2017 });
  assert.equal(p.education[1].school, 'Universidad del Rosario');
  assert.equal(p.years_of_experience, 9);
  assert.ok(p.suggested_specialties.includes('Derecho Laboral'));
  assert.match(educationSummary(p.education), /Javeriana/);
});

test('LinkedIn PDF parser handles English exports', () => {
  const p = parseLinkedInPdfText(`Contact
www.linkedin.com/in/jdoe (LinkedIn)
Top Skills
Corporate Law
John Doe
Corporate Lawyer
Medellín, Antioquia, Colombia
Summary
Corporate lawyer.
Experience
Doe Legal
Partner
March 2019 - Present (5 years 8 months)
Education
Universidad de los Andes
Lawyer, Law · (2010 - 2015)`, { now: new Date('2024-11-01') });
  assert.equal(p.name, 'John Doe');
  assert.equal(p.headline, 'Corporate Lawyer');
  assert.equal(p.experience[0].company, 'Doe Legal');
  assert.equal(p.experience[0].title, 'Partner');
  assert.equal(p.experience[0].current, true);
  assert.equal(p.education[0].school, 'Universidad de los Andes');
  assert.ok(p.suggested_specialties.includes('Derecho Comercial'));
});

test('parser never fabricates data from empty or unrelated text', () => {
  const p = parseLinkedInPdfText('Texto cualquiera sin secciones');
  assert.equal(p.name, '');
  assert.equal(p.experience.length, 0);
  assert.equal(p.education.length, 0);
  assert.equal(p.years_of_experience, 0);
  assert.deepEqual(suggestSpecialties('chef de cocina'), []);
});

test('years of experience merges overlapping roles', () => {
  const base = { company: '', title: '', start: '', end: '', location: '', description: '', current: false };
  const y = computeYearsOfExperience([
    { ...base, start_year: 2010, start_month: 1, end_year: 2015, end_month: 12 },
    { ...base, start_year: 2012, start_month: 1, end_year: 2014, end_month: 12 },
  ]);
  assert.equal(y, 6);
});
