#!/usr/bin/env node
/**
 * ============================================================================
 * Migration runner — Aaroham
 * ----------------------------------------------------------------------------
 * Applies every .sql file in server/db/migrations in filename order, once.
 *
 * Guarantees:
 *   · Idempotent      — an already-applied migration is skipped, so re-running
 *                       the command is safe and is expected in normal use.
 *   · Atomic per file — each migration runs inside its own transaction. A
 *                       failure rolls that migration back entirely; earlier
 *                       migrations remain applied and the ledger stays honest.
 *   · Tamper-evident  — the SHA-256 of each file is recorded on application.
 *                       Editing an applied migration is refused, because the
 *                       edit would silently not be applied to any database
 *                       that already ran it.
 *   · Serialised      — an advisory lock prevents two runners racing.
 *
 * Usage:
 *   npm run db:migrate            apply all pending migrations
 *   npm run db:migrate -- --status   report applied and pending, change nothing
 *   npm run db:migrate -- --reset    DROP the public schema, then apply all
 *
 * --reset is refused when NODE_ENV=production.
 * ============================================================================
 */

import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { closePool, getPool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

/** Arbitrary but fixed key, so every runner instance contends for the same lock. */
const ADVISORY_LOCK_KEY = 8_240_517;

const LEDGER_DDL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    TEXT PRIMARY KEY,
    checksum    TEXT NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    duration_ms INTEGER NOT NULL
  )
`;

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Reads the migration set from disk, sorted by filename. */
async function loadMigrations() {
  const entries = await readdir(MIGRATIONS_DIR);
  const files = entries.filter((f) => f.endsWith('.sql')).sort();

  if (files.length === 0) {
    throw new Error(`No .sql migrations found in ${MIGRATIONS_DIR}`);
  }

  return Promise.all(
    files.map(async (filename) => {
      const sql = await readFile(join(MIGRATIONS_DIR, filename), 'utf8');
      return { filename, sql, checksum: sha256(sql) };
    })
  );
}

async function readLedger(client) {
  await client.query(LEDGER_DDL);
  const { rows } = await client.query(
    'SELECT filename, checksum FROM schema_migrations'
  );
  return new Map(rows.map((r) => [r.filename, r.checksum]));
}

async function reportStatus(client) {
  const migrations = await loadMigrations();
  const applied = await readLedger(client);

  console.log(`\nMigration status — ${migrations.length} migration(s) on disk\n`);
  for (const m of migrations) {
    const recorded = applied.get(m.filename);
    let state;
    if (!recorded) state = 'pending';
    else if (recorded !== m.checksum) state = 'APPLIED — FILE CHANGED SINCE';
    else state = 'applied';
    console.log(`  ${state.padEnd(30)} ${m.filename}`);
  }
  console.log('');
}

/**
 * Rebuilds an empty public schema.
 *
 * `DROP SCHEMA public CASCADE` also destroys the grants that a managed provider
 * depends on. On Supabase the anon, authenticated and service_role roles lose
 * their privileges and the project's API stops working until they are restored,
 * which looks like a platform fault rather than a self-inflicted one. The
 * grants below are therefore reissued for whichever of those roles exist, so
 * this is safe on Supabase and a harmless no-op on a plain local instance.
 */
async function resetSchema(client) {
  if (env.nodeEnv === 'production') {
    throw new Error('--reset is refused when NODE_ENV=production.');
  }

  console.log('  dropping schema public (--reset, NODE_ENV=' + env.nodeEnv + ')');
  await client.query('DROP SCHEMA public CASCADE');
  await client.query('CREATE SCHEMA public');

  const { rows } = await client.query(
    `SELECT rolname FROM pg_roles
      WHERE rolname IN ('postgres','anon','authenticated','service_role')`
  );

  for (const { rolname } of rows) {
    // Role names come from pg_roles and are matched against a fixed allow-list
    // above, so quote_ident is belt and braces rather than the only defence.
    const { rows: safe } = await client.query('SELECT quote_ident($1) AS id', [
      rolname,
    ]);
    await client.query(`GRANT ALL ON SCHEMA public TO ${safe[0].id}`);
  }

  if (rows.length > 0) {
    console.log(`  restored schema grants for: ${rows.map((r) => r.rolname).join(', ')}`);
  }
}

async function applyPending(client) {
  const migrations = await loadMigrations();
  const applied = await readLedger(client);

  // Refuse to proceed if an already-applied file has been edited. Silently
  // ignoring the change would leave this database permanently inconsistent
  // with a database migrated from empty after the edit.
  const altered = migrations.filter(
    (m) => applied.has(m.filename) && applied.get(m.filename) !== m.checksum
  );
  if (altered.length > 0) {
    throw new Error(
      'These migrations were modified after being applied:\n' +
      altered.map((m) => `  · ${m.filename}`).join('\n') +
      '\nAn applied migration must never be edited. Add a new migration instead, ' +
      'or run with --reset to rebuild from empty (development only).'
    );
  }

  const pending = migrations.filter((m) => !applied.has(m.filename));

  if (pending.length === 0) {
    console.log(`  nothing to do — ${migrations.length} migration(s) already applied`);
    return 0;
  }

  for (const m of pending) {
    const startedAt = Date.now();
    try {
      await client.query('BEGIN');
      await client.query(m.sql);
      const durationMs = Date.now() - startedAt;
      await client.query(
        'INSERT INTO schema_migrations (filename, checksum, duration_ms) VALUES ($1, $2, $3)',
        [m.filename, m.checksum, durationMs]
      );
      await client.query('COMMIT');
      console.log(`  applied  ${m.filename}  (${durationMs} ms)`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`${m.filename} failed and was rolled back: ${err.message}`);
    }
  }

  return pending.length;
}

async function main() {
  const args = process.argv.slice(2);
  const wantsStatus = args.includes('--status');
  const wantsReset = args.includes('--reset');

  const client = await getPool().connect();
  try {
    if (wantsStatus) {
      await reportStatus(client);
      return;
    }

    console.log('\nAaroham — database migration\n');
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);

    try {
      if (wantsReset) await resetSchema(client);
      const count = await applyPending(client);
      if (count > 0) console.log(`\n  ${count} migration(s) applied.\n`);
      else console.log('');
    } finally {
      await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
    }
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((err) => {
  console.error(`\nMigration failed: ${err.message}\n`);
  process.exitCode = 1;
  closePool();
});
