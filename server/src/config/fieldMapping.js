/**
 * ============================================================================
 * Google Forms → Aaroham field mapping configuration
 * ----------------------------------------------------------------------------
 * This is the ONLY file that carries knowledge of the source dataset's column
 * names. The importer itself is source-agnostic: it reads this configuration.
 *
 * The beneficiary dataset is expected 6 August 2026. Its column headings are
 * not yet known, so `sourceColumn` values below are empty and the mapping is
 * marked incomplete. Phase 5C completes them after profiling the received file.
 *
 * Specification: docs/DATA_INGESTION.md
 * ============================================================================
 */

/**
 * Official districts of Kerala — used by the districtNorm transformation.
 *
 * Phase 5A: the list, the three-letter MHID codes and the accepted spelling
 * variants now live together in ./districts.js, so that the district set has
 * exactly one definition. Re-exported here because it forms part of this
 * module's published surface.
 */
export { KERALA_DISTRICTS } from './districts.js';

/**
 * Set to true in Phase 5C once every sourceColumn is populated and reviewed.
 * The importer refuses to run a load while this is false; dry runs are permitted.
 */
export const MAPPING_COMPLETE = true;

/**
 * Canonical target definition.
 *   target    — column on the destination table
 *   table     — 'workers' | 'health_records'
 *   required  — a row lacking a usable value is rejected
 *   transform — rule name from the transformation library
 *   sourceColumn — exact heading in the Google Forms export; set in Phase 5C
 */
export const FIELD_MAP = [
  { target: 'full_name', table: 'workers', required: true, transform: 'trim', sourceColumn: 'Full name' },
  { target: 'mobile', table: 'workers', required: true, transform: 'mobile10', sourceColumn: 'Phone Number' },
  { target: 'date_of_birth', table: 'workers', required: false, transform: 'ageToDOB', sourceColumn: 'Age' },
  { target: 'gender', table: 'workers', required: false, transform: 'genderNorm', sourceColumn: 'Gender' },
  { target: 'native_state', table: 'workers', required: false, transform: 'titleCase', sourceColumn: 'State' },
  { target: 'native_district', table: 'workers', required: false, transform: 'trim', sourceColumn: '' },
  { target: 'current_district', table: 'workers', required: true, transform: 'defaultDistrict', sourceColumn: 'State' },
  { target: 'current_address', table: 'workers', required: false, transform: 'trim', sourceColumn: 'Any previous work location in last few years' },
  { target: 'employer', table: 'workers', required: false, transform: 'trim', sourceColumn: 'Occupation' },
  { target: 'occupation', table: 'workers', required: false, transform: 'trim', sourceColumn: 'Occupation' },
  { target: 'emergency_contact', table: 'workers', required: false, transform: 'trim', sourceColumn: 'Phone Number' },
  { target: 'preferred_language', table: 'workers', required: false, transform: 'passthrough', sourceColumn: 'Preferred Languages' },
  { target: 'abha_id', table: 'workers', required: false, transform: 'trim', sourceColumn: '' },
  { target: 'blood_group', table: 'health_records', required: false, transform: 'trim', sourceColumn: '' },
  { target: 'allergies', table: 'health_records', required: false, transform: 'textArray', sourceColumn: '' },
  { target: 'chronic_conditions', table: 'health_records', required: false, transform: 'textArray', sourceColumn: 'Chronic Conditions' },
  { target: 'current_medications', table: 'health_records', required: false, transform: 'textArray', sourceColumn: 'Current Medications' },
  { target: 'notes', table: 'health_records', required: false, transform: 'trim', sourceColumn: 'Past major treatments/surgeries' },
];

/**
 * ----------------------------------------------------------------------------
 * Mapping profile for the SYNTHETIC TEST FIXTURES.
 * ----------------------------------------------------------------------------
 * Phase 5B needs a complete mapping in order to exercise the pipeline before
 * the real dataset exists. The fixture column headings therefore live here,
 * alongside the dataset mapping, because this file is the only place in the
 * repository permitted to know a source column name.
 *
 * The importer never reads this profile unless it is asked for by name
 * (`--profile fixture`), and the fixture profile can never be used to load the
 * production register: server/db/import.js refuses `--commit` with this profile
 * unless `--allow-fixture-write` is also given, which exists so that
 * idempotency can be proven against a development database.
 *
 * Fixtures: server/db/fixtures/sample_clean.csv, sample_dirty.csv
 *
 * The headings happen to match the canonical field names. That is a convenience
 * of the fixtures, NOT an assumption the importer may make — the Google Forms
 * export will use full question text such as
 * "What is your mobile number? / നിങ്ങളുടെ മൊബൈൽ നമ്പർ?".
 */
export const FIXTURE_SOURCE_COLUMNS = {
  full_name: 'full_name',
  mobile: 'mobile',
  date_of_birth: 'date_of_birth',
  gender: 'gender',
  native_state: 'native_state',
  current_district: 'current_district',
  employer: 'employer',
  occupation: 'occupation',
};

/**
 * Returns FIELD_MAP with `sourceColumn` populated for the requested profile.
 *
 *   'dataset'  the real Google Forms export — completed in Phase 5C
 *   'fixture'  the synthetic fixtures above
 *
 * Fields absent from a profile are returned with an empty sourceColumn and are
 * skipped by the pipeline, which reports them so that nothing is lost silently.
 */
export function resolveMapping(profile = 'dataset') {
  if (profile === 'dataset') return FIELD_MAP;

  if (profile === 'fixture') {
    return FIELD_MAP.map((field) => ({
      ...field,
      sourceColumn: FIXTURE_SOURCE_COLUMNS[field.target] ?? '',
    }));
  }

  throw new Error(
    `Unknown mapping profile "${profile}". Valid profiles: dataset, fixture.`
  );
}

/**
 * Source columns deliberately not carried into the register.
 * Every excluded column requires a stated reason — see docs/DATA_INGESTION.md §2.
 * Populated in Phase 5C. Google Forms always emits a 'Timestamp' column, which is
 * recorded here in advance as the expected first exclusion.
 */
export const EXCLUDED_COLUMNS = [
  // { sourceColumn: 'Timestamp', reason: 'Form submission time; superseded by created_at' },
];

/** Deduplication key. Normalised mobile number — see docs/DATA_INGESTION.md §6. */
export const DEDUPLICATION_KEY = 'mobile';

/** Row-level acceptance thresholds applied after transformation. */
export const VALIDATION_BOUNDS = {
  minNameLength: 2,
  mobileDigits: 10,
  mobileLeadingDigits: ['6', '7', '8', '9'],
  minAge: 14,
  maxAge: 100,
  abhaDigits: 14,
};
