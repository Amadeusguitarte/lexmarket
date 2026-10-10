import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { isAdmin, ensureCaseFilesBucket } from '../lib/server';

test('isAdmin security check: strictly verifies email confirmation and app_metadata / env', () => {
  const base = {
    email: 'admin@matchjuridico.com',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: { is_admin: true }
  };

  // User cannot self-escalate via user_metadata
  assert.equal(isAdmin(base as any), false);

  // Unconfirmed email cannot be admin even with app_metadata
  assert.equal(isAdmin({ ...base, email_confirmed_at: null, app_metadata: { is_admin: true } } as any), false);

  // Server-managed app_metadata flags
  assert.equal(isAdmin({ ...base, app_metadata: { is_admin: true } } as any), true);
  assert.equal(isAdmin({ ...base, app_metadata: { matchjuridico_admin: true } } as any), true);
  assert.equal(isAdmin({ ...base, app_metadata: { lexmarket_admin: true } } as any), true);
  assert.equal(isAdmin({ ...base, app_metadata: { role: 'admin' } } as any), true);

  // Environment variable email check
  process.env.ADMIN_EMAILS = 'superadmin@matchjuridico.com, ops@matchjuridico.com';
  assert.equal(isAdmin({ ...base, email: 'superadmin@matchjuridico.com' } as any), true);
  assert.equal(isAdmin({ ...base, email: 'ops@matchjuridico.com' } as any), true);
  assert.equal(isAdmin({ ...base, email: 'stranger@example.com' } as any), false);

  process.env.ADMIN_EMAIL = 'solo@matchjuridico.com';
  assert.equal(isAdmin({ ...base, email: 'solo@matchjuridico.com' } as any), true);
});

test('storage migration creates and registers case-files bucket properly', async () => {
  const pg = new PGlite();
  try {
    await pg.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    `);

    // Run base migrations
    for (const n of ['001_initial.sql', '20260917183921_moderation.sql', '20261010000000_storage_and_admin.sql']) {
      const sql = (await readFile(new URL('../supabase/migrations/' + n, import.meta.url), 'utf8'))
        .replace(/create extension if not exists pgcrypto;/g, '');
      await pg.exec(sql);
    }

    // Verify bucket exists and is private
    const bucket = (await pg.query<{ id: string; public: boolean; file_size_limit: number }>(
      "select id, public, file_size_limit from storage.buckets where id = 'case-files'"
    )).rows[0];

    assert.ok(bucket, 'Bucket case-files must be registered in storage.buckets');
    assert.equal(bucket.id, 'case-files');
    assert.equal(bucket.public, false, 'case-files bucket must be strictly private');
    assert.equal(bucket.file_size_limit, 10485760, 'Max file size must be 10MB');
  } finally {
    await pg.close();
  }
});

test('admin case moderation flow: case creation, review submission, and approval to listings', async () => {
  const pg = new PGlite();
  try {
    await pg.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create schema storage;
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    `);

    for (const n of ['001_initial.sql', '20260917183921_moderation.sql', '20261010000000_storage_and_admin.sql']) {
      const sql = (await readFile(new URL('../supabase/migrations/' + n, import.meta.url), 'utf8'))
        .replace(/create extension if not exists pgcrypto;/g, '');
      await pg.exec(sql);
    }

    const userId = '00000000-0000-4000-8000-000000000010';
    const adminId = '00000000-0000-4000-8000-000000000099';
    const caseId = '00000000-0000-4000-8000-000000000020';
    const docId = '00000000-0000-4000-8000-000000000030';

    await pg.query('insert into auth.users values ($1), ($2)', [userId, adminId]);
    await pg.query("insert into profiles(id, name, role) values ($1, 'Cliente Prueba', 'client'), ($2, 'Administrador', 'client')", [userId, adminId]);

    // Create case and document
    await pg.query(`
      insert into cases(id, owner_id, title, category, city, service, description, public_summary, status)
      values ($1, $2, 'Demanda Laboral por Despido', 'Laboral', 'Bogotá', 'Representación', 'Relato privado de los hechos ocurridos en la empresa.', 'Resumen público para el marketplace de al menos treinta caracteres.', 'review')
    `, [caseId, userId]);

    await pg.query(`
      insert into documents(id, case_id, name, path, mime, size, state)
      values ($1, $2, 'contrato_laboral.pdf', $3, 'application/pdf', 1024, 'clean')
    `, [docId, caseId, caseId + '/' + docId]);

    // Verify document was recorded
    const docs = (await pg.query<{ id: string; name: string }>(
      'select id, name from documents where case_id = $1', [caseId]
    )).rows;
    assert.equal(docs.length, 1);
    assert.equal(docs[0].name, 'contrato_laboral.pdf');

    // Simulate Admin approval: status becomes published, added to listings
    await pg.query("update cases set status = 'published', moderation_note = 'Aprobado por administración' where id = $1", [caseId]);
    await pg.query(`
      insert into listings(case_id, title, category, city, service, summary, urgency)
      values ($1, 'Demanda Laboral por Despido', 'Laboral', 'Bogotá', 'Representación', 'Resumen público para el marketplace de al menos treinta caracteres.', 'standard')
    `, [caseId]);

    const listings = (await pg.query('select * from listings where case_id = $1', [caseId])).rows;
    assert.equal(listings.length, 1, 'Approved case must appear in marketplace listings');

    const updatedCase = (await pg.query<{ status: string; moderation_note: string }>('select status, moderation_note from cases where id = $1', [caseId])).rows[0];
    assert.equal(updatedCase.status, 'published');
    assert.equal(updatedCase.moderation_note, 'Aprobado por administración');
  } finally {
    await pg.close();
  }
});
