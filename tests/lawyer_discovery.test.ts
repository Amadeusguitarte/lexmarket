import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_FEATURED_LAWYERS } from '../lib/lawyers';
import { lawyerCategories, formatCategory } from '../lib/shared';

test('lawyer discovery seed data and categories', () => {
  assert.equal(SEED_FEATURED_LAWYERS.length, 4);
  assert.equal(SEED_FEATURED_LAWYERS[0].name, 'María Fernanda López');
  assert.equal(SEED_FEATURED_LAWYERS[0].city, 'Bogotá');
  assert.equal(SEED_FEATURED_LAWYERS[0].years_of_experience, 12);
  assert.equal(SEED_FEATURED_LAWYERS[0].rating, 4.9);
  
  assert.equal(formatCategory('Laboral'), 'Derecho Laboral');
  assert.equal(formatCategory('Derecho Civil'), 'Derecho Civil');
  assert.ok(lawyerCategories.includes('Derecho Laboral'));
  assert.ok(lawyerCategories.includes('Derecho de Familia'));
});
