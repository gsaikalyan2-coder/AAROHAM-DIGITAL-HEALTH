/**
 * ============================================================================
 * Prescription decision support — rule-based, Workers Portal only.
 * ============================================================================
 *
 * WHAT THIS IS
 *   A deterministic, auditable mapping from a recorded chronic condition to a
 *   short list of first-line agents, filtered through three safety checks
 *   (allergy class, duplicate therapy, condition/drug interaction).
 *
 * WHAT THIS IS NOT
 *   This does not prescribe. Every document produced from this module is a
 *   DRAFT and is explicitly invalid until a registered medical practitioner
 *   signs it. There is no inference, no model, and no scoring here — if a rule
 *   does not fire, the output is FALLBACK_TEXT and nothing else.
 *
 * Mental health is deliberately excluded from automated suggestion. CLAUDE.md
 * §6 places mental_health_screenings in the sensitive tier; psychotropic
 * initiation is a clinician decision, so that branch always falls back.
 *
 * Demo build: reads client/src/data/mockData.js. Replaced by the
 * /api/v1 health-record response in Phases 10–18. No new data source.
 */

export const FALLBACK_TEXT = 'Follow up with doctor.';

/* ------------------------------------------------------------------ *
 * 1. Condition recognition
 *    Free-text chronic condition strings ("Hypertension (Stage 1)")
 *    are matched to a canonical key. Unmatched strings fall back.
 * ------------------------------------------------------------------ */

const CONDITIONS = [
  { key: 'hypertension',     label: 'Hypertension',                              match: /hypertens|high blood pressure|\bhtn\b/i },
  { key: 'diabetes',         label: 'Type 2 Diabetes Mellitus',                  match: /diabet|\bt2dm\b|mellitus/i },
  { key: 'respiratory',      label: 'Chronic respiratory disease',               match: /asthma|copd|bronchit|respirator|wheez/i },
  { key: 'musculoskeletal',  label: 'Musculoskeletal / degenerative joint disease', match: /musculoskelet|arthrit|joint|back (pain|strain)|lumbar|cervical spond/i },
  { key: 'gastrointestinal', label: 'Acid-peptic / gastrointestinal disease',    match: /gastr|acid|reflux|gerd|peptic|ulcer|dyspep/i },
  { key: 'skin',             label: 'Chronic skin condition',                    match: /derma|eczema|psorias|skin|fungal|scabies|urticar/i },
  { key: 'mental',           label: 'Anxiety / depressive disorder',             match: /anxiet|depress|\bphq\b|\bgad\b|mental|psych/i },
];

export function classifyCondition(text) {
  const found = CONDITIONS.find((c) => c.match.test(String(text || '')));
  return found ? { key: found.key, label: found.label, source: text } : null;
}

/* ------------------------------------------------------------------ *
 * 2. Drug catalogue
 *    `classes` drives every safety check below. Adding a drug without
 *    its classes will silently bypass the checks — always fill them in.
 * ------------------------------------------------------------------ */

const DRUGS = {
  amlodipine: {
    generic: 'amlodipine',
    name: 'Amlodipine 5 mg',
    dosage: '1 tablet',
    frequency: 'Once daily, morning',
    duration: '30 days',
    classes: ['ccb', 'antihypertensive'],
  },
  telmisartan: {
    generic: 'telmisartan',
    name: 'Telmisartan 40 mg',
    dosage: '1 tablet',
    frequency: 'Once daily, morning',
    duration: '30 days',
    classes: ['arb', 'antihypertensive', 'raas'],
  },
  metformin: {
    generic: 'metformin',
    name: 'Metformin 500 mg',
    dosage: '1 tablet',
    frequency: 'Twice daily, after meals',
    duration: '30 days',
    classes: ['biguanide', 'antidiabetic'],
  },
  salbutamol: {
    generic: 'salbutamol',
    name: 'Salbutamol inhaler 100 mcg',
    dosage: '2 puffs',
    frequency: 'As required, up to 4 times daily',
    duration: '1 inhaler',
    classes: ['saba', 'bronchodilator'],
  },
  amoxicillin: {
    generic: 'amoxicillin',
    name: 'Amoxicillin 500 mg',
    dosage: '1 capsule',
    frequency: 'Three times daily',
    duration: '5 days',
    classes: ['penicillin', 'antibiotic'],
  },
  azithromycin: {
    generic: 'azithromycin',
    name: 'Azithromycin 500 mg',
    dosage: '1 tablet',
    frequency: 'Once daily',
    duration: '3 days',
    classes: ['macrolide', 'antibiotic'],
  },
  paracetamol: {
    generic: 'paracetamol',
    name: 'Paracetamol 500 mg',
    dosage: '1 tablet',
    frequency: 'Three times daily, after food',
    duration: '5 days · max 3 g in 24 hours',
    classes: ['analgesic', 'antipyretic'],
  },
  ibuprofen: {
    generic: 'ibuprofen',
    name: 'Ibuprofen 400 mg',
    dosage: '1 tablet',
    frequency: 'Twice daily, after food',
    duration: '5 days',
    classes: ['nsaid', 'analgesic'],
  },
  diclofenacGel: {
    generic: 'diclofenac topical',
    name: 'Diclofenac 1% topical gel',
    dosage: 'Thin layer to affected area',
    frequency: 'Twice daily',
    duration: '7 days',
    classes: ['nsaid-topical', 'analgesic'],
  },
  pantoprazole: {
    generic: 'pantoprazole',
    name: 'Pantoprazole 40 mg',
    dosage: '1 tablet',
    frequency: 'Once daily, before breakfast',
    duration: '14 days',
    classes: ['ppi', 'gastroprotective'],
  },
  ors: {
    generic: 'oral rehydration salts',
    name: 'Oral Rehydration Salts (WHO formula)',
    dosage: '1 sachet in 1 litre of clean water',
    frequency: 'After each loose stool',
    duration: 'As required',
    classes: ['rehydration'],
  },
  cetirizine: {
    generic: 'cetirizine',
    name: 'Cetirizine 10 mg',
    dosage: '1 tablet',
    frequency: 'Once daily, at night',
    duration: '7 days',
    classes: ['antihistamine'],
  },
  mupirocin: {
    generic: 'mupirocin',
    name: 'Mupirocin 2% ointment',
    dosage: 'Thin layer to affected area',
    frequency: 'Twice daily',
    duration: '7 days',
    classes: ['antibiotic-topical'],
  },
};

/* ------------------------------------------------------------------ *
 * 3. Condition → candidate agents, in priority order
 * ------------------------------------------------------------------ */

const RULES = {
  hypertension: {
    basis: 'First-line antihypertensive therapy for uncomplicated Stage 1–2 hypertension.',
    candidates: ['amlodipine', 'telmisartan'],
  },
  diabetes: {
    basis: 'First-line oral hypoglycaemic for type 2 diabetes. Renal function to be confirmed before issue.',
    candidates: ['metformin'],
  },
  respiratory: {
    basis: 'Symptomatic bronchodilation, with antibiotic cover where bacterial infection is documented.',
    candidates: ['salbutamol', 'amoxicillin', 'azithromycin'],
  },
  musculoskeletal: {
    basis: 'Stepped analgesia — simple analgesic first, anti-inflammatory only where not contraindicated.',
    candidates: ['paracetamol', 'ibuprofen', 'diclofenacGel'],
  },
  gastrointestinal: {
    basis: 'Acid suppression with rehydration support.',
    candidates: ['pantoprazole', 'ors'],
  },
  skin: {
    basis: 'Antihistamine for pruritus with topical antibacterial cover for localised lesions.',
    candidates: ['cetirizine', 'mupirocin'],
  },
  // Deliberately no candidates — see module header.
  mental: {
    basis: 'Psychotropic initiation is not automated. Refer to the counsellor and treating physician.',
    candidates: [],
  },
};

/* ------------------------------------------------------------------ *
 * 4. Safety checks
 * ------------------------------------------------------------------ */

/** Recorded allergy text → the drug classes it blocks. */
const ALLERGY_BLOCKS = [
  { match: /penicillin|amoxicillin|ampicillin/i, blocks: ['penicillin'], label: 'penicillin class' },
  { match: /sulfa|sulpha|cotrimoxazole/i,        blocks: ['sulfonamide'], label: 'sulfonamide class' },
  { match: /nsaid|aspirin|ibuprofen|diclofenac/i, blocks: ['nsaid', 'nsaid-topical'], label: 'NSAID class' },
  { match: /macrolide|azithromycin|erythromycin/i, blocks: ['macrolide'], label: 'macrolide class' },
];

/**
 * Drug class vs. co-existing condition. Suppresses a candidate when the
 * worker also carries a condition the class would worsen.
 */
const CLASS_CONDITION_CONFLICTS = [
  {
    classes: ['nsaid'],
    condition: 'hypertension',
    reason: 'Systemic NSAIDs raise blood pressure and blunt antihypertensive control.',
  },
  {
    classes: ['nsaid'],
    condition: 'gastrointestinal',
    reason: 'Systemic NSAIDs aggravate acid-peptic disease and risk GI bleeding.',
  },
];

/** Drug class vs. a class already on the active medication list. */
const CLASS_CLASS_CONFLICTS = [
  {
    classes: ['arb'],
    againstClasses: ['acei'],
    reason: 'Dual RAAS blockade (ARB with ACE inhibitor) is not recommended.',
  },
];

/** Coarse generic-name lookup over free-text medication strings. */
function activeGenerics(currentMedications = []) {
  const text = currentMedications.join(' | ').toLowerCase();
  return Object.values(DRUGS)
    .filter((d) => text.includes(d.generic.split(' ')[0]))
    .map((d) => d.generic);
}

/** Classes represented on the active medication list. */
function activeClasses(currentMedications = []) {
  const text = currentMedications.join(' | ').toLowerCase();
  const classes = new Set();
  Object.values(DRUGS).forEach((d) => {
    if (text.includes(d.generic.split(' ')[0])) d.classes.forEach((c) => classes.add(c));
  });
  if (/enalapril|ramipril|lisinopril|perindopril/.test(text)) classes.add('acei');
  return classes;
}

/* ------------------------------------------------------------------ *
 * 5. Engine
 * ------------------------------------------------------------------ */

/**
 * @param {object} worker  demoWorker-shaped record
 * @returns {{ conditions, recommendations, suppressed, fallback, notes }}
 */
export function buildRecommendations(worker) {
  const chronic = worker?.chronicConditions || [];
  const allergies = worker?.allergies || [];
  const meds = worker?.currentMedications || [];

  const onGenerics = activeGenerics(meds);
  const onClasses = activeClasses(meds);

  const blockedClasses = new Set();
  const allergyLabels = [];
  allergies.forEach((a) => {
    ALLERGY_BLOCKS.forEach((rule) => {
      if (rule.match.test(a)) {
        rule.blocks.forEach((c) => blockedClasses.add(c));
        allergyLabels.push({ allergy: a, label: rule.label });
      }
    });
  });

  const conditions = [];
  const unmatched = [];
  chronic.forEach((c) => {
    const hit = classifyCondition(c);
    if (hit) conditions.push(hit);
    else unmatched.push(c);
  });

  const conditionKeys = conditions.map((c) => c.key);
  const recommendations = [];
  const suppressed = [];
  const notes = [];
  const emitted = new Set();

  conditions.forEach((cond) => {
    const rule = RULES[cond.key];
    if (!rule) return;

    if (rule.candidates.length === 0) {
      notes.push(`${cond.label}: ${rule.basis}`);
      return;
    }

    rule.candidates.forEach((id) => {
      const drug = DRUGS[id];
      if (!drug || emitted.has(id)) return;

      // (a) allergy
      const allergyHit = drug.classes.find((c) => blockedClasses.has(c));
      if (allergyHit) {
        const src = allergyLabels.find((l) => l.label.toLowerCase().includes(allergyHit.split('-')[0]));
        suppressed.push({
          name: drug.name,
          reason: `Withheld — recorded allergy${src ? ` to ${src.allergy}` : ''} (${allergyHit} class).`,
        });
        return;
      }

      // (b) already on it
      if (onGenerics.includes(drug.generic)) {
        suppressed.push({ name: drug.name, reason: 'Already on the active medication list — continue as prescribed.' });
        return;
      }

      // (c) drug class vs. co-existing condition
      const condConflict = CLASS_CONDITION_CONFLICTS.find(
        (r) => r.classes.some((c) => drug.classes.includes(c)) && conditionKeys.includes(r.condition),
      );
      if (condConflict) {
        suppressed.push({ name: drug.name, reason: `Withheld — ${condConflict.reason}` });
        return;
      }

      // (d) drug class vs. active medication class
      const classConflict = CLASS_CLASS_CONFLICTS.find(
        (r) => r.classes.some((c) => drug.classes.includes(c)) &&
               r.againstClasses.some((c) => onClasses.has(c)),
      );
      if (classConflict) {
        suppressed.push({ name: drug.name, reason: `Withheld — ${classConflict.reason}` });
        return;
      }

      emitted.add(id);
      recommendations.push({
        name: drug.name,
        dosage: drug.dosage,
        frequency: drug.frequency,
        duration: drug.duration,
        indication: cond.label,
        basis: rule.basis,
      });
    });
  });

  unmatched.forEach((c) => {
    notes.push(`"${c}" is not covered by the rule set — ${FALLBACK_TEXT}`);
  });

  return {
    conditions,
    recommendations,
    suppressed,
    notes,
    fallback: recommendations.length === 0,
  };
}
