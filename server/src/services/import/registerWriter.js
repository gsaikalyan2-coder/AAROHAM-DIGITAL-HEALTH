/**
 * ============================================================================
 * Register writer — the only module in the ingestion pipeline that touches SQL.
 * ----------------------------------------------------------------------------
 * CLAUDE.md §5: SQL lives in server/src/services and nowhere else. The pipeline
 * decides what a row means; this module decides how it is persisted.
 *
 * Idempotency, as required by docs/DATA_INGESTION.md §2 and §6:
 *   · A beneficiary is identified by the NORMALISED mobile number.
 *   · An unseen mobile is inserted and issued an MHID.
 *   · A known mobile is updated, and only where the incoming value is non-empty
 *     — an import must never blank a field that a practitioner has since filled
 *     in. No second MHID is issued.
 *   · Re-processing the same export therefore inserts nothing.
 *
 * Every statement is parameterised. No value is interpolated into SQL text.
 * ============================================================================
 */

import { formatMhid } from '../../utils/mhid.js';

/** Columns on `workers` that an import may write. */
const WORKER_COLUMNS = [
  'full_name',
  'date_of_birth',
  'gender',
  'native_state',
  'native_district',
  'current_district',
  'current_address',
  'employer',
  'occupation',
  'emergency_contact',
  'preferred_language',
  'abha_id',
];

/** Columns on `health_records` that an import may write. */
const HEALTH_COLUMNS = [
  'blood_group',
  'allergies',
  'chronic_conditions',
  'current_medications',
  'notes',
];

/**
 * Normalised mobile numbers already in the register.
 * Read once per run rather than queried per row — 40 000 beneficiaries is one
 * cheap query and 40 000 expensive ones.
 */
export async function loadRegisteredMobiles(client) {
  const { rows } = await client.query(
    'SELECT mobile FROM workers WHERE deleted_at IS NULL'
  );
  return new Set(rows.map((r) => r.mobile));
}

/**
 * The next unused MHID serial.
 *
 * The serial space is global rather than per district, matching the seed
 * dataset. `substring` extracts the six-digit block from KL-<DDD>-<YY>-<NNNNNN>-<C>.
 * Returns 1 for an empty register.
 */
export async function nextMhidSerial(client) {
  const { rows } = await client.query(`
    SELECT COALESCE(MAX(NULLIF(substring(mhid FROM '-(\\d{6})-'), '')::int), 0) AS max_serial
      FROM workers
  `);
  return rows[0].max_serial + 1;
}

/** Number of live beneficiaries, for the reconciliation statement. */
export async function countRegister(client) {
  const { rows } = await client.query(
    'SELECT count(*)::int AS n FROM workers WHERE deleted_at IS NULL'
  );
  return rows[0].n;
}

function workerValues(row) {
  return WORKER_COLUMNS.map((column) => row[column] ?? null);
}

/**
 * Inserts a new beneficiary and issues an MHID.
 *
 * On the vanishingly unlikely event of an MHID collision — a concurrent
 * registration taking the same serial — the unique constraint rejects the
 * insert and the caller retries with a fresh serial. The constraint is the
 * authority, not the in-memory counter.
 */
export async function insertBeneficiary(client, row, serial, issuedOn = new Date()) {
  const mhid = formatMhid(row.current_district, serial, issuedOn);

  const placeholders = WORKER_COLUMNS.map((_c, i) => `$${i + 3}`).join(', ');

  const { rows } = await client.query(
    `INSERT INTO workers (mhid, mobile, ${WORKER_COLUMNS.join(', ')})
     VALUES ($1, $2, ${placeholders})
     RETURNING id, mhid`,
    [mhid, row.mobile, ...workerValues(row)]
  );

  return { workerId: rows[0].id, mhid: rows[0].mhid };
}

/**
 * Updates an existing beneficiary, keeping any value the import does not carry.
 *
 * COALESCE($n, column) leaves the stored value in place when the incoming value
 * is null. A blank cell in a re-submitted form must not erase a district a
 * practitioner corrected by hand.
 */
export async function updateBeneficiary(client, row) {
  const assignments = WORKER_COLUMNS.map(
    (column, i) => `${column} = COALESCE($${i + 2}, ${column})`
  ).join(', ');

  const { rows } = await client.query(
    `UPDATE workers
        SET ${assignments}
      WHERE mobile = $1 AND deleted_at IS NULL
      RETURNING id, mhid`,
    [row.mobile, ...workerValues(row)]
  );

  if (rows.length === 0) {
    throw new Error(
      `No live beneficiary found for mobile ${row.mobile} during update. ` +
        'The register changed mid-import; re-run the import.'
    );
  }

  return { workerId: rows[0].id, mhid: rows[0].mhid };
}

/**
 * Writes the clinical fields, if the row carries any.
 *
 * `health_records` has a UNIQUE constraint on worker_id, so this upserts. Array
 * columns are only overwritten when the incoming array is non-empty — an import
 * that collected no allergy question must not clear a recorded penicillin
 * allergy. That is the single most dangerous silent write in this system.
 */
export async function upsertHealthRecord(client, workerId, row) {
  const hasClinicalData = HEALTH_COLUMNS.some((column) => {
    const value = row[column];
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  });

  if (!hasClinicalData) return { written: false };

  await client.query(
    `INSERT INTO health_records (worker_id, blood_group, allergies, chronic_conditions, current_medications, notes)
     VALUES ($1, $2, COALESCE($3::text[], '{}'), COALESCE($4::text[], '{}'), COALESCE($5::text[], '{}'), $6)
     ON CONFLICT (worker_id) DO UPDATE
        SET blood_group = COALESCE(EXCLUDED.blood_group, health_records.blood_group),
            allergies = CASE
              WHEN array_length(EXCLUDED.allergies, 1) IS NULL THEN health_records.allergies
              ELSE EXCLUDED.allergies END,
            chronic_conditions = CASE
              WHEN array_length(EXCLUDED.chronic_conditions, 1) IS NULL THEN health_records.chronic_conditions
              ELSE EXCLUDED.chronic_conditions END,
            current_medications = CASE
              WHEN array_length(EXCLUDED.current_medications, 1) IS NULL THEN health_records.current_medications
              ELSE EXCLUDED.current_medications END,
            notes = COALESCE(EXCLUDED.notes, health_records.notes)`,
    [
      workerId,
      row.blood_group ?? null,
      row.allergies && row.allergies.length > 0 ? row.allergies : null,
      row.chronic_conditions && row.chronic_conditions.length > 0
        ? row.chronic_conditions
        : null,
      row.current_medications && row.current_medications.length > 0
        ? row.current_medications
        : null,
      row.notes ?? null,
    ]
  );

  return { written: true };
}

/**
 * Records the import in the audit trail.
 * Append only — migration 003 refuses UPDATE and DELETE on this table.
 */
export async function recordImportAudit(client, { actorId, summary, sourceFile }) {
  await client.query(
    `INSERT INTO audit_logs (actor_id, actor_role, action, entity, entity_id, user_agent)
     VALUES ($1, 'admin', 'IMPORT beneficiary_dataset', 'workers', $2, $3)`,
    [
      actorId ?? null,
      sourceFile,
      `accepted=${summary.accepted} updated=${summary.duplicatesSuppressed} ` +
        `rejected=${summary.rejected}`,
    ]
  );
}
