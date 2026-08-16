/**
 * ============================================================================
 * Transformation library — docs/DATA_INGESTION.md §5
 * ----------------------------------------------------------------------------
 * Each transform takes a raw string and returns either
 *
 *     { ok: true,  value, note? }      the normalised value
 *     { ok: false, rule, reason }      the row is rejected
 *
 * GOVERNING RULE, from the specification and worth restating because it is the
 * one that protects beneficiaries: on ambiguity a transform FAILS the row. It
 * never guesses. A rejected row appears in the exception report and can be
 * corrected. A record carrying a fabricated date of birth cannot be corrected,
 * because nobody knows it is wrong.
 *
 * An empty input yields `{ ok: true, value: null }`. Whether null is acceptable
 * is a question about the FIELD, answered by `required` in fieldMapping.js, not
 * a question about the transform.
 * ============================================================================
 */

import { resolveDistrict } from '../../config/districts.js';
import { VALIDATION_BOUNDS } from '../../config/fieldMapping.js';

const ok = (value, note) => (note ? { ok: true, value, note } : { ok: true, value });
const fail = (rule, reason) => ({ ok: false, rule, reason });

/** True for values that carry no information. */
function isBlank(raw) {
  return raw === null || raw === undefined || String(raw).trim() === '';
}

/* -------------------------------------------------------------------------- */
/* trim                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Strips surrounding whitespace and collapses internal runs to one space.
 * "  Ramesh   Prasad  Yadav " becomes "Ramesh Prasad Yadav", so two records
 * differing only in spacing do not read as two different people.
 */
export function trim(raw) {
  if (isBlank(raw)) return ok(null);
  return ok(String(raw).trim().replace(/\s+/g, ' '));
}

/* -------------------------------------------------------------------------- */
/* titleCase                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Capitalises each word. Applied to names, states and districts so that
 * "WEST BENGAL", "west bengal" and "West bengal" agree.
 *
 * Internal capitals after an apostrophe or hyphen are preserved, so "D'Souza"
 * and "Abdul-Rahman" survive. Particles are not special-cased: this is a
 * normalisation for grouping and display, not an authority on how any
 * individual writes their own name.
 */
export function titleCase(raw) {
  const trimmed = trim(raw);
  if (!trimmed.ok || trimmed.value === null) return trimmed;

  const value = trimmed.value
    .toLowerCase()
    .replace(/(^|[\s([{"'\-/])([a-zऀ-ൿ])/g, (_m, before, ch) => before + ch.toUpperCase());

  return ok(value);
}

/* -------------------------------------------------------------------------- */
/* mobile10                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Normalises an Indian mobile number to exactly ten digits.
 *
 * This is the deduplication key. Normalisation MUST happen before any duplicate
 * check — comparing raw input lets "+91 98470 12345" and "9847012345" through
 * as two separate beneficiaries, which is the trap recorded in the handover.
 *
 * Handled: spaces, hyphens, parentheses, dots, a leading +, a 91 country code,
 * a leading trunk 0. Anything that does not reduce to ten digits fails.
 */
export function mobile10(raw) {
  if (isBlank(raw)) return ok(null);

  const received = String(raw).trim();
  let digits = received.replace(/[^\d]/g, '');

  if (digits === '') {
    return fail('mobile10', `"${received}" contains no digits`);
  }

  // Country code, with or without a trunk prefix: 0091…, 91…
  if (digits.length === 14 && digits.startsWith('0091')) digits = digits.slice(4);
  if (digits.length === 13 && digits.startsWith('091')) digits = digits.slice(3);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);

  const want = VALIDATION_BOUNDS.mobileDigits;

  if (digits.length !== want) {
    return fail(
      'mobile10',
      `"${received}" normalises to ${digits.length} digit(s); exactly ${want} required`
    );
  }

  if (!VALIDATION_BOUNDS.mobileLeadingDigits.includes(digits[0])) {
    return fail(
      'mobile10',
      `"${received}" begins with ${digits[0]}; an Indian mobile number begins with ` +
        VALIDATION_BOUNDS.mobileLeadingDigits.join(', ')
    );
  }

  return ok(digits);
}

/* -------------------------------------------------------------------------- */
/* dateISO                                                                     */
/* -------------------------------------------------------------------------- */

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isRealDate(y, m, d) {
  if (m < 1 || m > 12 || d < 1) return false;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const max = m === 2 && leap ? 29 : MONTH_LENGTHS[m - 1];
  return d <= max;
}

const iso = (y, m, d) =>
  `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/**
 * Normalises a date to YYYY-MM-DD.
 *
 * Accepted: YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, and any
 * of these followed by a time, which Google Forms appends to timestamp columns.
 *
 * DOCUMENTED CONVENTION — day first. For a slash or dash date whose first two
 * components are both 12 or less, "05/06/1993" is genuinely ambiguous: it is
 * 5 June under Indian convention and 6 May under United States convention. This
 * implementation reads day first, because the dataset is collected in Kerala.
 *
 * That is a stated convention rather than a guess, but it MUST be confirmed
 * against the real export in Phase 5C — a Google Form whose owner's locale is
 * en-US emits month first, and every ambiguous date would then be silently
 * wrong by up to eleven months. Confirm by checking whether any value in the
 * column has a first component above 12; if so the column is day-first.
 *
 * The calendar is checked properly. JavaScript's Date rolls 31 February over
 * into 3 March, which would turn an impossible date into a plausible one.
 */
export function dateISO(raw) {
  if (isBlank(raw)) return ok(null);

  const received = String(raw).trim();
  const datePart = received.split(/[\sT]/)[0];
  const parts = datePart.split(/[/\-.]/).filter((p) => p !== '');

  if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) {
    return fail(
      'dateISO',
      `"${received}" is not a recognised date; expected DD/MM/YYYY or YYYY-MM-DD`
    );
  }

  let y;
  let m;
  let d;

  if (parts[0].length === 4) {
    [y, m, d] = parts.map(Number); // year first
  } else if (parts[2].length === 4) {
    [d, m, y] = parts.map(Number); // day first — see the convention note above
  } else {
    return fail(
      'dateISO',
      `"${received}" has a two-digit year; the century is ambiguous, so the row is ` +
        'rejected rather than assumed'
    );
  }

  if (!isRealDate(y, m, d)) {
    return fail('dateISO', `"${received}" is not a real calendar date`);
  }

  return ok(iso(y, m, d));
}

/* -------------------------------------------------------------------------- */
/* ageToDOB                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Derives an approximate date of birth from a stated age.
 *
 * OPT IN ONLY. This transform fires solely where fieldMapping.js explicitly
 * points it at an age column. It is never applied as a fallback when dateISO
 * fails, because that would convert an unparseable date into an invented one.
 *
 * The derived value is 1 January of the implied birth year, and the row is
 * flagged `dob_derived` so the derivation is visible in the exception report and
 * to every later reader. The precision claim is deliberately weak: the day and
 * month are conventional, not observed. A clinician reading such a record
 * should treat the age as ±1 year.
 */
export function ageToDOB(raw, context = {}) {
  if (isBlank(raw)) return ok(null);

  const received = String(raw).trim();
  const digits = received.match(/\d+/);

  if (!digits) {
    return fail('ageToDOB', `"${received}" contains no age`);
  }

  const age = Number(digits[0]);
  const { minAge, maxAge } = VALIDATION_BOUNDS;

  if (age < minAge || age > maxAge) {
    return fail(
      'ageToDOB',
      `age ${age} is outside the accepted range ${minAge}–${maxAge}`
    );
  }

  const referenceYear = (context.referenceDate ?? new Date()).getFullYear();

  return ok(iso(referenceYear - age, 1, 1), 'dob_derived');
}

/* -------------------------------------------------------------------------- */
/* genderNorm                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Normalises gender to Male, Female or Other.
 *
 * Malayalam, Hindi and Bengali forms are included because the form is intended
 * to be answerable by beneficiaries from West Bengal, Assam, Bihar, Odisha and
 * Jharkhand, and by Malayalam-speaking field staff entering data on their
 * behalf.
 *
 * An unrecognised non-empty value FAILS rather than defaulting to Other.
 * "Other" is a real answer a person may give; it must not double as the bucket
 * for values the importer did not understand. Add the term here once it is
 * seen in the real dataset.
 */
const GENDER_TERMS = {
  Male: ['m', 'male', 'man', 'boy', 'ആൺ', 'പുരുഷൻ', 'പുരുഷന്‍', 'पुरुष', 'पुरूष', 'পুরুষ', 'ପୁରୁଷ'],
  Female: ['f', 'female', 'woman', 'girl', 'പെൺ', 'സ്ത്രീ', 'महिला', 'स्त्री', 'নারী', 'মহিলা', 'ମହିଳା'],
  Other: [
    'o', 'other', 'others', 'transgender', 'trans', 'third gender', 'non-binary',
    'nonbinary', 'prefer not to say', 'ട്രാൻസ്ജെൻഡർ', 'अन्य', 'তৃতীয় লিঙ্গ', 'অন্যান্য', 'ଅନ୍ୟାନ୍ୟ',
  ],
};

const GENDER_LOOKUP = Object.entries(GENDER_TERMS).reduce((acc, [canonical, terms]) => {
  terms.forEach((term) => {
    acc[term] = canonical;
  });
  return acc;
}, {});

export function genderNorm(raw) {
  if (isBlank(raw)) return ok(null);

  const received = String(raw).trim();
  const key = received.toLowerCase().replace(/\s+/g, ' ');
  const canonical = GENDER_LOOKUP[key];

  if (!canonical) {
    return fail(
      'genderNorm',
      `"${received}" is not a recognised gender value; add the term to ` +
        'transforms.js GENDER_TERMS once confirmed, rather than defaulting it'
    );
  }

  return ok(canonical);
}

/* -------------------------------------------------------------------------- */
/* districtNorm                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Resolves a district of Kerala, tolerating documented spelling variants.
 *
 * Delegates to resolveDistrict in config/districts.js, which holds the single
 * definition of the fourteen districts, their MHID codes and their accepted
 * alternative spellings. Deliberately not fuzzy: "Ernakolam" fails. A
 * beneficiary filed under the wrong district is invisible to the facility that
 * will actually treat them, so a near-miss must be corrected by a person.
 */
export function defaultDistrict() {
  return ok('Ernakulam');
}

export function districtNorm(raw) {
  if (isBlank(raw)) return ok(null);

  const received = String(raw).trim();
  const resolved = resolveDistrict(received);

  if (!resolved) {
    return fail(
      'districtNorm',
      `"${received}" is not a district of Kerala and is not a recognised variant ` +
        'of one; correct the spelling or add the variant to config/districts.js'
    );
  }

  return ok(resolved);
}

/* -------------------------------------------------------------------------- */
/* textArray                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Splits a delimited list into an array of trimmed strings, for the TEXT[]
 * columns on health_records — allergies, chronic_conditions,
 * current_medications.
 *
 * Added in Phase 5B. The eight transforms in the original specification had no
 * array rule, so these columns would have received a single string where
 * PostgreSQL expects TEXT[]. Recorded in docs/DATA_INGESTION.md §5.
 *
 * Separators: comma, semicolon, pipe, newline. A value meaning "none" collapses
 * to an empty array, so the clinical banner reads "no known allergies" rather
 * than displaying the word "None" as though it were an allergen.
 */
const NEGATIVE_TERMS = new Set([
  'none', 'nil', 'no', 'na', 'n/a', 'not applicable', 'not known', 'nothing',
  'no known allergies', 'nka', '-', '--',
]);

export function textArray(raw) {
  if (isBlank(raw)) return ok([]);

  const received = String(raw).trim();

  if (NEGATIVE_TERMS.has(received.toLowerCase())) return ok([]);

  const items = received
    .split(/[,;|\n]/)
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .filter((part) => part !== '' && !NEGATIVE_TERMS.has(part.toLowerCase()));

  const seen = new Set();
  const unique = items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return ok(unique);
}

/* -------------------------------------------------------------------------- */
/* passthrough                                                                 */
/* -------------------------------------------------------------------------- */

/** Stores the value unchanged. Used where any normalisation would lose meaning. */
export function passthrough(raw) {
  if (isBlank(raw)) return ok(null);
  return ok(String(raw));
}

/* -------------------------------------------------------------------------- */

/**
 * The registry the pipeline resolves `transform` names against.
 * A mapping naming a transform absent from this table is a configuration error
 * and is reported before any row is read.
 */
export const TRANSFORMS = {
  trim,
  titleCase,
  mobile10,
  dateISO,
  ageToDOB,
  genderNorm,
  defaultDistrict,
  districtNorm,
  textArray,
  passthrough,
};

export const TRANSFORM_NAMES = Object.keys(TRANSFORMS);
