/**
 * ============================================================================
 * Per-row validation — docs/DATA_INGESTION.md §6
 * ----------------------------------------------------------------------------
 * Runs AFTER transformation, against the canonical shape. The transforms decide
 * whether a value could be understood; this schema decides whether the
 * understood value is admissible.
 *
 * The two layers catch different faults. "12345" fails mobile10 because it
 * cannot be read as a mobile number. "1234512345" passes mobile10 and fails
 * here, because no Indian mobile number begins with 1. Both belong in the
 * exception report, each naming its own rule.
 *
 * Every bound is read from VALIDATION_BOUNDS in config/fieldMapping.js. None is
 * written twice.
 * ============================================================================
 */

import { z } from 'zod';

import { VALIDATION_BOUNDS } from '../../config/fieldMapping.js';
import { resolveDistrict } from '../../config/districts.js';

const {
  minNameLength,
  mobileDigits,
  mobileLeadingDigits,
  minAge,
  maxAge,
  abhaDigits,
} = VALIDATION_BOUNDS;

/**
 * Whole years between a date of birth and a reference date.
 * Counts completed birthdays, so someone born on 29 February is not briefly a
 * year older than they are.
 */
export function ageOn(dobIso, referenceDate = new Date()) {
  const [y, m, d] = dobIso.split('-').map(Number);
  let age = referenceDate.getUTCFullYear() - y;
  const monthDiff = referenceDate.getUTCMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getUTCDate() < d)) age -= 1;
  return age;
}

const nullableString = z.string().nullable().optional();

/**
 * Builds the schema. A factory rather than a constant so that the reference
 * date can be injected — an age boundary must be reproducible in a test, not
 * dependent on the day the test happens to run.
 */
export function buildRowSchema({ referenceDate = new Date() } = {}) {
  return z.object({
    full_name: z
      .string({ error: 'full_name is required' })
      .min(minNameLength, `full_name must be at least ${minNameLength} characters`),

    mobile: z
      .string({ error: 'mobile is required' })
      .regex(
        new RegExp(`^\\d{${mobileDigits}}$`),
        `mobile must be exactly ${mobileDigits} digits after normalisation`
      )
      .refine(
        (value) => mobileLeadingDigits.includes(value[0]),
        `mobile must begin with ${mobileLeadingDigits.join(', ')}`
      ),

    current_district: z
      .string({ error: 'current_district is required' })
      .refine(
        (value) => resolveDistrict(value) !== null,
        'current_district must be one of the fourteen districts of Kerala'
      ),

    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_of_birth must be YYYY-MM-DD')
      .refine((value) => {
        const age = ageOn(value, referenceDate);
        return age >= minAge && age <= maxAge;
      }, `date_of_birth must give an age between ${minAge} and ${maxAge}`)
      .nullable()
      .optional(),

    gender: z.enum(['Male', 'Female', 'Other']).nullable().optional(),

    abha_id: z
      .string()
      .regex(
        new RegExp(`^\\d{${abhaDigits}}$`),
        `abha_id, where present, must be ${abhaDigits} digits`
      )
      .nullable()
      .optional(),

    native_state: nullableString,
    native_district: nullableString,
    current_address: nullableString,
    employer: nullableString,
    occupation: nullableString,
    emergency_contact: nullableString,
    preferred_language: nullableString,

    blood_group: nullableString,
    allergies: z.array(z.string()).optional(),
    chronic_conditions: z.array(z.string()).optional(),
    current_medications: z.array(z.string()).optional(),
    notes: nullableString,
  });
}

/**
 * Validates one canonical row.
 *
 * Returns `{ ok: true, value }` or `{ ok: false, failures: [{ field, rule,
 * reason }] }`. All failures are returned, not merely the first — an operator
 * correcting a spreadsheet wants every problem with a row in one pass.
 */
export function validateRow(row, options = {}) {
  const schema = buildRowSchema(options);
  const result = schema.safeParse(row);

  if (result.success) return { ok: true, value: result.data };

  const failures = result.error.issues.map((issue) => ({
    field: issue.path.join('.') || '(row)',
    rule: 'validation',
    reason: issue.message,
  }));

  return { ok: false, failures };
}
