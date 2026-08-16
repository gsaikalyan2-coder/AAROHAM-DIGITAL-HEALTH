#!/usr/bin/env node
/**
 * ============================================================================
 * Import runner — Aaroham
 * ----------------------------------------------------------------------------
 * Executes the ingestion pipeline against a received export, in dry-run mode by
 * default. Produces the exception report of docs/DATA_INGESTION.md §7 and the
 * reconciliation statement of §8.
 *
 * Usage:
 *   npm run db:import -- --file server/db/fixtures/sample_dirty.csv --profile fixture
 *   npm run db:import -- --file <path> --profile fixture --commit --allow-fixture-write
 *   npm run db:import -- --file server/db/imports/<export>.csv            (Phase 5D)
 *
 * Flags:
 *   --file <path>            required; the source export
 *   --profile <name>         dataset (default) | fixture
 *   --commit                 write to the database. Omit for a dry run.
 *   --allow-fixture-write    required alongside --commit when --profile fixture
 *   --out <dir>              where to write the exception report
 *
 * SAFETY, in layers:
 *   · dry run is the default; a write must be asked for twice for fixtures
 *   · --commit with --profile dataset is refused while MAPPING_COMPLETE is false
 *   · --commit with --profile fixture is refused without --allow-fixture-write,
 *     because fixture rows are synthetic and must never enter a real register
 *   · a commit runs in ONE transaction and rolls back if the balance check fails
 * ============================================================================
 */

import { basename, isAbsolute, join, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { closePool, getPool } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { runImport } from '../src/services/import/importPipeline.js';
import {
  buildReconciliation,
  writeExceptionReport,
} from '../src/services/import/exceptionReport.js';
import { OUTCOME } from '../src/services/import/importPipeline.js';

const SERVER_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(SERVER_ROOT, '..');

function parseArgs(argv) {
  const args = { profile: 'dataset', commit: false, allowFixtureWrite: false };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--file') args.file = argv[++i];
    else if (token === '--profile') args.profile = argv[++i];
    else if (token === '--out') args.out = argv[++i];
    else if (token === '--commit') args.commit = true;
    else if (token === '--allow-fixture-write') args.allowFixtureWrite = true;
    else throw new Error(`Unrecognised argument "${token}"`);
  }

  if (!args.file) {
    throw new Error(
      'No source file. Pass --file <path>, for example:\n' +
      '  npm run db:import -- --file server/db/fixtures/sample_dirty.csv --profile fixture'
    );
  }

  return args;
}

/** Accepts a path relative to the repository root or to server/. */
function locate(file) {
  if (isAbsolute(file)) return file;
  const fromRepo = join(REPO_ROOT, file);
  const fromServer = join(SERVER_ROOT, file);
  return file.startsWith('server/') ? fromRepo : fromServer;
}

function printOutcomeTable(entries) {
  const byRow = new Map();
  for (const entry of entries) {
    if (!byRow.has(entry.source_row)) byRow.set(entry.source_row, []);
    byRow.get(entry.source_row).push(entry);
  }

  console.log('  row  outcome               rule            field              detail');
  console.log('  ---  -------------------   -------------   ----------------   ------');

  for (const [row, rowEntries] of [...byRow.entries()].sort((a, b) => a[0] - b[0])) {
    for (const entry of rowEntries) {
      console.log(
        `  ${String(row).padStart(3)}  ${entry.outcome.padEnd(19)}   ` +
        `${(entry.rule || '—').padEnd(13)}   ${(entry.field || '—').padEnd(16)}   ` +
        entry.note
      );
    }
  }
  console.log('');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = locate(args.file);
  const sourceName = basename(filePath);
  const mode = args.commit ? 'load' : 'dry-run';

  if (args.commit && args.profile === 'fixture' && !args.allowFixtureWrite) {
    throw new Error(
      'Refusing to commit the synthetic fixtures without --allow-fixture-write. ' +
      'Fixture rows are not real beneficiaries and must never enter a live register.'
    );
  }

  if (args.commit && args.profile === 'fixture' && env.nodeEnv === 'production') {
    throw new Error(
      'Refusing to commit fixtures with NODE_ENV=production under any flag.'
    );
  }

  console.log('\nAaroham — beneficiary dataset ingestion');
  console.log(`  source   : ${filePath}`);
  console.log(`  profile  : ${args.profile}`);
  console.log(`  mode     : ${mode}${args.commit ? '' : '  (no database write)'}\n`);

  const receivedAt = new Date().toISOString();
  const outputDir = args.out ? locate(args.out) : join(SERVER_ROOT, 'db', 'reports');

  let client = null;
  let result;

  try {
    if (args.commit) {
      client = await getPool().connect();
      await client.query('BEGIN');
    }

    result = await runImport({
      filePath,
      profile: args.profile,
      commit: args.commit,
      client,
    });

    const reportPath = await writeExceptionReport(result.entries, {
      outputDir,
      sourceName,
      mode,
    });

    const reconciliation = buildReconciliation({
      sourceFile: filePath,
      receivedAt,
      rowsInSource: result.summary.rowsInSource,
      accepted: result.summary.accepted,
      rejected: result.summary.rejected,
      duplicatesSuppressed: result.summary.duplicatesSuppressed,
      mhidsIssued: result.summary.mhidsIssued,
      registerBefore: result.summary.registerBefore,
      registerAfter: result.summary.registerAfter,
      mode,
      reportPath,
    });

    if (result.summary.warnings.length > 0) {
      console.log('  Mapping warnings — nothing is discarded silently:');
      result.summary.warnings.forEach((w) => console.log(`    · ${w}`));
      console.log('');
    }

    printOutcomeTable(result.entries);
    console.log(reconciliation.text);
    console.log('');

    if (!reconciliation.balances) {
      throw new Error(
        'Balance check FAILED: rows received do not equal accepted + rejected + ' +
        'duplicates suppressed. Treating this as a failed load.'
      );
    }

    if (reconciliation.registerBalances === false) {
      throw new Error(
        'Register count does not balance against MHIDs issued. Treating this as a ' +
        'failed load.'
      );
    }

    if (args.commit) {
      await client.query('COMMIT');
      console.log('  Committed.\n');
    } else {
      const wouldWrite = result.entries.filter(
        (e) => e.outcome === OUTCOME.ACCEPTED || e.outcome === OUTCOME.DUPLICATE
      ).length;
      console.log(
        `  Dry run complete. Nothing was written. ${wouldWrite} row(s) would have ` +
        'been written by a load.\n'
      );
    }
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
      console.error('\n  Rolled back — no partial import remains.');
    }
    throw err;
  } finally {
    if (client) client.release();
    await closePool();
  }
}

main().catch((err) => {
  console.error(`\nImport failed: ${err.message}\n`);
  process.exitCode = 1;
  closePool();
});
