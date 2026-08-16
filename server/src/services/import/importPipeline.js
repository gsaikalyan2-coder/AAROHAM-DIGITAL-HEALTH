/**
 * ============================================================================
 * Import pipeline — docs/DATA_INGESTION.md §3, stages 2 to 6
 * ----------------------------------------------------------------------------
 * Stage 1 (profiling) is Phase 5C. Stage 7 (reconciliation) is assembled by the
 * caller from the summary this module returns.
 *
 * THE GOVERNING CONSTRAINT: this file contains no source column name, and never
 * will. It asks config/fieldMapping.js what the columns are. When the real
 * export arrives on 6 August the work is configuration, not redevelopment —
 * that is the entire reason the ingestion track was split from the dataset.
 *
 * Dry run is the DEFAULT. A caller must ask explicitly to write.
 * ============================================================================
 */

import {
  DEDUPLICATION_KEY,
  EXCLUDED_COLUMNS,
  MAPPING_COMPLETE,
  resolveMapping,
} from '../../config/fieldMapping.js';
import { TRANSFORMS, TRANSFORM_NAMES } from './transforms.js';
import { validateRow } from './rowSchema.js';
import { readSource } from './sourceReader.js';
import {
  countRegister,
  insertBeneficiary,
  loadRegisteredMobiles,
  nextMhidSerial,
  recordImportAudit,
  updateBeneficiary,
  upsertHealthRecord,
} from './registerWriter.js';

export const OUTCOME = {
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  DUPLICATE: 'duplicate_suppressed',
};

/**
 * Checks the mapping before a single row is read.
 *
 * A mapping fault is a fault in every row, so reporting it once up front beats
 * reporting it forty thousand times. Returns the fields that are actually
 * usable, plus warnings for the fields that are not, so that an unmapped column
 * is visible rather than silently absent — docs/DATA_INGESTION.md §2.
 */
export function inspectMapping(mapping, headers) {
  const problems = [];
  const warnings = [];
  const usable = [];

  for (const field of mapping) {
    if (!TRANSFORM_NAMES.includes(field.transform)) {
      problems.push(
        `${field.target}: transform "${field.transform}" does not exist. ` +
          `Available: ${TRANSFORM_NAMES.join(', ')}`
      );
      continue;
    }

    if (!field.sourceColumn) {
      const message = `${field.target}: no source column mapped`;
      if (field.required) problems.push(`${message} — but the field is REQUIRED`);
      else warnings.push(`${message} — the field will be left empty`);
      continue;
    }

    if (headers && !headers.includes(field.sourceColumn)) {
      problems.push(
        `${field.target}: mapped to "${field.sourceColumn}", which is not a column ` +
          'in the source file'
      );
      continue;
    }

    usable.push(field);
  }

  if (headers) {
    const mapped = new Set(mapping.map((f) => f.sourceColumn).filter(Boolean));
    const excluded = new Set(EXCLUDED_COLUMNS.map((c) => c.sourceColumn));
    const unaccounted = headers.filter((h) => !mapped.has(h) && !excluded.has(h));

    for (const column of unaccounted) {
      warnings.push(
        `source column "${column}" is neither mapped nor listed in ` +
          'EXCLUDED_COLUMNS with a reason — no column may be silently discarded'
      );
    }
  }

  return { usable, problems, warnings };
}

/**
 * Applies the mapped transforms to one raw row.
 * Returns the canonical object, the transform failures, and any notes such as
 * `dob_derived`.
 */
function transformRow(rawRow, usableFields, context) {
  const canonical = {};
  const failures = [];
  const notes = [];

  for (const field of usableFields) {
    const received = rawRow[field.sourceColumn];
    const result = TRANSFORMS[field.transform](received, context);

    if (!result.ok) {
      failures.push({
        field: field.target,
        rule: result.rule,
        reason: result.reason,
        received,
      });
      continue;
    }

    if (result.note) notes.push({ field: field.target, note: result.note });

    // A required field that transformed to null is missing, not merely empty.
    if (field.required && (result.value === null || result.value === '')) {
      failures.push({
        field: field.target,
        rule: 'required',
        reason: `${field.target} is required and the source value is empty`,
        received,
      });
      continue;
    }

    canonical[field.target] = result.value;
  }

  return { canonical, failures, notes };
}

/**
 * Runs the pipeline.
 *
 * @param {object}  options
 * @param {string}  options.filePath      the received export
 * @param {string}  [options.profile]     mapping profile — 'dataset' | 'fixture'
 * @param {boolean} [options.commit]      false (default) performs NO writes
 * @param {object}  [options.client]      pg client; required only when committing
 * @param {Date}    [options.referenceDate] fixes "today" for age bounds
 * @param {string}  [options.actorId]     administrator recorded in the audit trail
 */
export async function runImport({
  filePath,
  profile = 'dataset',
  commit = false,
  client = null,
  referenceDate = new Date(),
  actorId = null,
}) {
  if (commit && !client) {
    throw new Error('runImport was asked to commit without a database client.');
  }

  if (commit && profile === 'dataset' && !MAPPING_COMPLETE) {
    throw new Error(
      'Refusing to load: MAPPING_COMPLETE is false in config/fieldMapping.js. ' +
        'Complete the mapping in Phase 5C and have it reviewed before loading. ' +
        'Dry runs are permitted.'
    );
  }

  const { headers, rows } = await readSource(filePath);
  const mapping = resolveMapping(profile);
  const { usable, problems, warnings } = inspectMapping(mapping, headers);

  if (problems.length > 0) {
    throw new Error(
      `The mapping cannot be used against this file:\n  - ${problems.join('\n  - ')}`
    );
  }

  const entries = [];
  const accepted = [];

  // Duplicate detection has TWO sources of truth, and both are needed.
  //
  //   registered  — mobiles already in the register
  //   seen        — mobiles encountered ANYWHERE EARLIER IN THIS FILE, whatever
  //                 that row's outcome was
  //
  // The second is easy to get wrong. In sample_dirty.csv row 5 is rejected as
  // under-age and row 7 repeats its mobile. Tracking only accepted rows would
  // leave row 7 looking novel, and it would be accepted as a second record for
  // the same person — the exact failure the fixture exists to catch.
  const registered = commit ? await loadRegisteredMobiles(client) : new Set();
  const seen = new Map();

  // Mobiles that actually have a row in the register — those already there, plus
  // any inserted during this run.
  //
  // This is NOT the same set as `seen`. A mobile can be seen and yet have no
  // record: sample_dirty.csv row 5 is rejected as under-age and row 7 repeats
  // its mobile. Row 7 is correctly a duplicate, but there is nothing to update,
  // and attempting the update would fail the whole load. The distinction only
  // shows up when a rejected row's mobile recurs, which is exactly the case the
  // fixture was built to exercise.
  const persisted = new Set(registered);

  const registerBefore = commit ? await countRegister(client) : null;
  let serial = commit ? await nextMhidSerial(client) : 0;
  let mhidsIssued = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const sourceRow = i + 2; // +1 for zero-index, +1 for the header line
    const rawRow = rows[i];

    const { canonical, failures, notes } = transformRow(rawRow, usable, {
      referenceDate,
    });

    const validation = failures.length === 0
      ? validateRow(canonical, { referenceDate })
      : { ok: false, failures: [] };

    const allFailures = [...failures, ...(validation.failures ?? [])];

    if (allFailures.length > 0) {
      // Still record the mobile if it was readable, so a later repeat of it is
      // reported as a duplicate rather than accepted.
      const key = canonical[DEDUPLICATION_KEY];
      if (key && !seen.has(key)) seen.set(key, sourceRow);

      for (const failure of allFailures) {
        entries.push({
          source_row: sourceRow,
          outcome: OUTCOME.REJECTED,
          rule: failure.rule,
          field: failure.field,
          received_value:
            failure.received ?? rawRow[
              usable.find((f) => f.target === failure.field)?.sourceColumn
            ] ?? '',
          note: failure.reason,
        });
      }
      continue;
    }

    const row = validation.value;
    const key = row[DEDUPLICATION_KEY];

    const seenAt = seen.get(key);
    const inRegister = registered.has(key);

    if (seenAt !== undefined || inRegister) {
      const updatable = persisted.has(key);

      let note;
      if (!updatable) {
        note =
          `repeats the mobile number at source row ${seenAt}, which was itself ` +
          'rejected; there is no record to update, so nothing was written for ' +
          'either row';
      } else if (seenAt !== undefined) {
        note =
          `already present at source row ${seenAt} of this file; the existing ` +
          'record is updated where incoming values are non-empty';
      } else {
        note =
          'already in the register; the existing record is updated where ' +
          'incoming values are non-empty';
      }

      entries.push({
        source_row: sourceRow,
        outcome: OUTCOME.DUPLICATE,
        rule: 'deduplication',
        field: DEDUPLICATION_KEY,
        received_value: key,
        note,
      });

      if (commit && updatable) {
        const { workerId } = await updateBeneficiary(client, row);
        await upsertHealthRecord(client, workerId, row);
      }
      continue;
    }

    seen.set(key, sourceRow);

    let mhid = null;
    if (commit) {
      let attempt = 0;
      /* eslint-disable no-await-in-loop */
      while (mhid === null) {
        try {
          const result = await insertBeneficiary(client, row, serial, referenceDate);
          mhid = result.mhid;
          await upsertHealthRecord(client, result.workerId, row);
        } catch (err) {
          // A concurrent registration took this serial. The unique constraint is
          // the authority; advance and retry rather than trusting the counter.
          const collision = /workers_mhid_key|duplicate key/i.test(err.message);
          attempt += 1;
          if (!collision || attempt > 50) throw err;
        }
        serial += 1;
      }
      /* eslint-enable no-await-in-loop */
      mhidsIssued += 1;
      persisted.add(key);
    } else {
      serial += 1;
      mhidsIssued += 1;
    }

    accepted.push({ sourceRow, row, mhid });

    entries.push({
      source_row: sourceRow,
      outcome: OUTCOME.ACCEPTED,
      rule: '',
      field: '',
      received_value: key,
      note: [
        commit ? `MHID ${mhid} issued` : 'would be accepted (dry run — nothing written)',
        ...notes.map((n) => `${n.field}: ${n.note}`),
      ].join('; '),
    });
  }

  const summary = {
    rowsInSource: rows.length,
    accepted: accepted.length,
    rejected: new Set(
      entries.filter((e) => e.outcome === OUTCOME.REJECTED).map((e) => e.source_row)
    ).size,
    duplicatesSuppressed: entries.filter((e) => e.outcome === OUTCOME.DUPLICATE).length,
    mhidsIssued,
    registerBefore,
    registerAfter: commit ? await countRegister(client) : null,
    warnings,
    derivedValues: entries.filter((e) => e.note.includes('dob_derived')).length,
  };

  if (commit) {
    await recordImportAudit(client, {
      actorId,
      summary,
      sourceFile: filePath,
    });
  }

  return { entries, summary, headers, accepted };
}
