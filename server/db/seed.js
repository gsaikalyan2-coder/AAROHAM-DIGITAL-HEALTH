#!/usr/bin/env node
/**
 * ============================================================================
 * Seed runner — Aaroham
 * ----------------------------------------------------------------------------
 * Loads server/db/seed.sql, the departmental demonstration dataset.
 *
 * Everything in seed.sql is synthetic. It is one of only two locations in this
 * repository in which invented data is permitted (CLAUDE.md §9 rule 3).
 *
 * Guarantees:
 *   · Refuses to run before the migrations have been applied.
 *   · Refuses to run when NODE_ENV=production, unless --force is passed.
 *     Demonstration beneficiaries must never reach an environment holding real
 *     health records.
 *   · Single transaction — a partial dataset is never left behind.
 *   · Safe to re-run — every INSERT carries ON CONFLICT DO NOTHING, so a second
 *     run inserts nothing and reports identical totals.
 *
 * Usage:
 *   npm run db:seed
 *   npm run db:seed -- --force     override the production guard
 * ============================================================================
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { closePool, getPool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_FILE = join(HERE, 'seed.sql');

/** Tables reported after loading, in the order they are populated. */
const REPORTED_TABLES = [
  'hospitals',
  'users',
  'doctors',
  'workers',
  'health_records',
  'consultations',
  'prescriptions',
  'vaccinations',
  'mental_health_screenings',
  'appointments',
  'schemes',
  'audit_logs',
];

async function assertMigrated(client) {
  const { rows } = await client.query(
    `SELECT to_regclass('public.schema_migrations') AS ledger,
            to_regclass('public.workers')           AS workers`
  );

  if (!rows[0].ledger || !rows[0].workers) {
    throw new Error(
      'The schema is not present. Run "npm run db:migrate" before seeding.'
    );
  }

  const { rows: pending } = await client.query(
    'SELECT count(*)::int AS n FROM schema_migrations'
  );
  if (pending[0].n === 0) {
    throw new Error(
      'No migrations are recorded as applied. Run "npm run db:migrate" first.'
    );
  }
}

async function tableCounts(client) {
  const counts = {};
  for (const table of REPORTED_TABLES) {
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${table}`);
    counts[table] = rows[0].n;
  }
  return counts;
}

function reportCounts(before, after) {
  const width = Math.max(...REPORTED_TABLES.map((t) => t.length));
  console.log('');
  console.log(`  ${'table'.padEnd(width)}   before   after   inserted`);
  console.log(`  ${'-'.repeat(width)}   ------   -----   --------`);
  for (const table of REPORTED_TABLES) {
    const inserted = after[table] - before[table];
    console.log(
      `  ${table.padEnd(width)}   ${String(before[table]).padStart(6)}   ` +
      `${String(after[table]).padStart(5)}   ${String(inserted).padStart(8)}`
    );
  }
  console.log('');
}

async function main() {
  const force = process.argv.slice(2).includes('--force');

  if (env.nodeEnv === 'production' && !force) {
    throw new Error(
      'Refusing to seed with NODE_ENV=production. seed.sql contains synthetic ' +
      'beneficiaries and must not reach an environment holding real health ' +
      'records. Pass --force only if you are certain this database is empty ' +
      'and is for demonstration.'
    );
  }

  const sql = await readFile(SEED_FILE, 'utf8');
  const client = await getPool().connect();

  try {
    console.log('\nAaroham — departmental demonstration dataset\n');
    await assertMigrated(client);

    const before = await tableCounts(client);

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Seed failed and was rolled back: ${err.message}`);
    }

    const after = await tableCounts(client);
    reportCounts(before, after);

    const inserted = REPORTED_TABLES.reduce(
      (n, t) => n + (after[t] - before[t]),
      0
    );
    if (inserted === 0) {
      console.log('  Dataset already present — nothing inserted. Re-run is safe.\n');
    } else {
      console.log(`  ${inserted} row(s) inserted.\n`);
    }
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((err) => {
  console.error(`\nSeed failed: ${err.message}\n`);
  process.exitCode = 1;
  closePool();
});
