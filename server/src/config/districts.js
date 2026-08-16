/**
 * ============================================================================
 * Districts of Kerala — the authority for district names and codes.
 * ----------------------------------------------------------------------------
 * Two things depend on this file:
 *   1. The MHID district segment (server/src/utils/mhid.js)
 *   2. The districtNorm ingestion transformation (Phase 5B)
 *
 * The list is closed. A value that does not resolve here is rejected, never
 * guessed — a beneficiary filed under the wrong district is invisible to the
 * facility that will actually treat them.
 * ============================================================================
 */

/**
 * The 14 official districts, in the Government of Kerala's conventional order
 * (south to north), each with the three-letter code used in the MHID.
 */
export const DISTRICTS = [
  { name: 'Thiruvananthapuram', code: 'TVM' },
  { name: 'Kollam', code: 'KLM' },
  { name: 'Pathanamthitta', code: 'PTA' },
  { name: 'Alappuzha', code: 'ALP' },
  { name: 'Kottayam', code: 'KTM' },
  { name: 'Idukki', code: 'IDK' },
  { name: 'Ernakulam', code: 'EKM' },
  { name: 'Thrissur', code: 'TSR' },
  { name: 'Palakkad', code: 'PKD' },
  { name: 'Malappuram', code: 'MLP' },
  { name: 'Kozhikode', code: 'KKD' },
  { name: 'Wayanad', code: 'WYD' },
  { name: 'Kannur', code: 'KNR' },
  { name: 'Kasaragod', code: 'KSD' },
];

/** Canonical district names only. */
export const KERALA_DISTRICTS = DISTRICTS.map((d) => d.name);

/** Canonical name → three-letter code. */
export const DISTRICT_CODES = Object.fromEntries(
  DISTRICTS.map((d) => [d.name, d.code])
);

/** Three-letter code → canonical name. */
export const CODE_TO_DISTRICT = Object.fromEntries(
  DISTRICTS.map((d) => [d.code, d.name])
);

/**
 * Accepted alternative spellings and transliterations, lower-cased.
 * These are documented, deliberate equivalences — not fuzzy matching. Anything
 * absent from this table and from the canonical list fails resolution.
 *
 * Sources of variation: colonial-era English spellings still in common use,
 * Malayalam transliteration differences, and the abbreviations habitually
 * typed into free-text forms.
 */
const DISTRICT_ALIASES = {
  // Thiruvananthapuram
  trivandrum: 'Thiruvananthapuram',
  thiruvanathapuram: 'Thiruvananthapuram',
  thiruvananthapuram: 'Thiruvananthapuram',
  tvm: 'Thiruvananthapuram',
  // Kollam
  quilon: 'Kollam',
  kolam: 'Kollam',
  // Pathanamthitta
  pathanamthita: 'Pathanamthitta',
  pathanamtitta: 'Pathanamthitta',
  // Alappuzha
  alleppey: 'Alappuzha',
  alapuzha: 'Alappuzha',
  allapuzha: 'Alappuzha',
  // Kottayam
  kottayam: 'Kottayam',
  kotayam: 'Kottayam',
  // Idukki
  idduki: 'Idukki',
  iduki: 'Idukki',
  // Ernakulam
  cochin: 'Ernakulam',
  kochi: 'Ernakulam',
  ernakulum: 'Ernakulam',
  eranakulam: 'Ernakulam',
  ekm: 'Ernakulam',
  // Thrissur
  trichur: 'Thrissur',
  thrisur: 'Thrissur',
  trissur: 'Thrissur',
  // Palakkad
  palghat: 'Palakkad',
  palakad: 'Palakkad',
  // Malappuram
  malapuram: 'Malappuram',
  malappuam: 'Malappuram',
  // Kozhikode
  calicut: 'Kozhikode',
  kozhikkode: 'Kozhikode',
  kozikode: 'Kozhikode',
  // Wayanad
  wynad: 'Wayanad',
  waynad: 'Wayanad',
  wayanadu: 'Wayanad',
  // Kannur
  cannanore: 'Kannur',
  kanur: 'Kannur',
  // Kasaragod
  kasargod: 'Kasaragod',
  kasaragode: 'Kasaragod',
  kasargode: 'Kasaragod',
};

/** Canonical names keyed by their own lower-cased form, for direct hits. */
const CANONICAL_LOOKUP = Object.fromEntries(
  DISTRICTS.map((d) => [d.name.toLowerCase(), d.name])
);

/**
 * Resolves free text to a canonical district name.
 * Returns null when the value cannot be resolved — the caller rejects the row.
 * Deliberately NOT fuzzy: "Ernakolam" is not in the alias table and therefore
 * fails, which is the behaviour docs/DATA_INGESTION.md §5 requires.
 */
export function resolveDistrict(value) {
  if (typeof value !== 'string') return null;

  const key = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (key === '') return null;

  if (CANONICAL_LOOKUP[key]) return CANONICAL_LOOKUP[key];
  if (DISTRICT_ALIASES[key]) return DISTRICT_ALIASES[key];

  // A bare three-letter code, e.g. "EKM"
  const upper = key.toUpperCase();
  if (CODE_TO_DISTRICT[upper]) return CODE_TO_DISTRICT[upper];

  // "Ernakulam District", "Ernakulam Dist."
  const stripped = key.replace(/\s*(district|dist\.?|jilla)\s*$/, '').trim();
  if (stripped !== key) return resolveDistrict(stripped);

  return null;
}

/** Three-letter code for a district name, or null if it does not resolve. */
export function districtCode(value) {
  const name = resolveDistrict(value);
  return name ? DISTRICT_CODES[name] : null;
}
