/**
 * ============================================================================
 * Migrant Health ID (MHID)
 * ----------------------------------------------------------------------------
 * Format:  KL-<DDD>-<YY>-<NNNNNN>-<C>
 *
 *   KL       constant — State of Kerala
 *   DDD      three-letter district code of the district of issue
 *   YY       two-digit year of issue
 *   NNNNNN   six-digit serial, zero padded
 *   C        check digit — Luhn, computed over the six-digit serial
 *
 * Example: KL-EKM-26-004217-4
 *
 * The check digit exists so that a number read aloud in a ward, or copied from
 * a printed card, fails visibly when mistyped rather than silently resolving to
 * a different beneficiary's record. Luhn catches every single-digit error and
 * every adjacent transposition except 09↔90.
 *
 * KNOWN LIMITATION, deliberate and recorded. The check digit covers the serial
 * only, not the district code or the year. A mistyped district segment
 * therefore produces a well-formed identifier that does not exist, and is
 * caught by lookup rather than by validation. Widening the check digit to
 * cover the whole numeric portion is a candidate refinement for Phase 8; it
 * would invalidate every identifier issued before the change, so it must be
 * decided before any identifier is issued outside a demonstration.
 *
 * This module is pure. It performs no database access: uniqueness of the serial
 * is the responsibility of the registration service (Phase 8), which allocates
 * against the unique constraint on workers.mhid.
 * ============================================================================
 */

import { CODE_TO_DISTRICT, districtCode } from '../config/districts.js';

const MHID_PATTERN = /^KL-([A-Z]{3})-(\d{2})-(\d{6})-(\d)$/;

const SERIAL_DIGITS = 6;
const MAX_SERIAL = 10 ** SERIAL_DIGITS - 1; // 999999

/**
 * Luhn check digit for a string of digits.
 * Doubling runs right to left from the position the check digit will occupy.
 */
export function luhnCheckDigit(digits) {
  if (!/^\d+$/.test(digits)) {
    throw new Error(`luhnCheckDigit expects digits only, received "${digits}"`);
  }

  let sum = 0;
  let double = true; // the digit immediately left of the check digit is doubled

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Builds an MHID from its parts.
 *
 * @param {string} district  district name, alias or three-letter code
 * @param {number} serial    1 … 999999, unique within district and year
 * @param {Date}   [issuedOn] defaults to now; supplies the YY segment
 */
export function formatMhid(district, serial, issuedOn = new Date()) {
  const code = districtCode(district);
  if (!code) {
    throw new Error(`Unrecognised district for MHID issue: "${district}"`);
  }

  if (!Number.isInteger(serial) || serial < 1 || serial > MAX_SERIAL) {
    throw new Error(
      `MHID serial must be an integer between 1 and ${MAX_SERIAL}, received ${serial}`
    );
  }

  const yy = String(issuedOn.getFullYear() % 100).padStart(2, '0');
  const nnnnnn = String(serial).padStart(SERIAL_DIGITS, '0');
  const check = luhnCheckDigit(nnnnnn);

  return `KL-${code}-${yy}-${nnnnnn}-${check}`;
}

/**
 * Verifies structure and check digit.
 * Returns { valid, reason } — `reason` names the first failure, so the caller
 * can tell an operator what is wrong rather than merely that something is.
 */
export function validateMhid(mhid) {
  if (typeof mhid !== 'string') {
    return { valid: false, reason: 'MHID must be a string' };
  }

  const match = MHID_PATTERN.exec(mhid.trim().toUpperCase());
  if (!match) {
    return {
      valid: false,
      reason: 'MHID must match KL-<DDD>-<YY>-<NNNNNN>-<C>, for example KL-EKM-26-004217-4',
    };
  }

  const [, code, , serial, check] = match;

  if (!CODE_TO_DISTRICT[code]) {
    return { valid: false, reason: `"${code}" is not a district of Kerala` };
  }

  if (luhnCheckDigit(serial) !== Number(check)) {
    return { valid: false, reason: 'check digit does not match — the number was mistyped' };
  }

  return { valid: true, reason: null };
}

/** Decomposes a valid MHID. Throws if it does not validate. */
export function parseMhid(mhid) {
  const { valid, reason } = validateMhid(mhid);
  if (!valid) throw new Error(`Invalid MHID: ${reason}`);

  const [, code, yy, serial] = MHID_PATTERN.exec(mhid.trim().toUpperCase());

  return {
    mhid: mhid.trim().toUpperCase(),
    districtCode: code,
    district: CODE_TO_DISTRICT[code],
    year: 2000 + Number(yy),
    serial: Number(serial),
  };
}
