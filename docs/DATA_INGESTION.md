# Data Ingestion Specification
## Google Forms Beneficiary Dataset → Aaroham Register

**Department of Health &amp; Family Welfare, Government of Kerala**
**Document status:** Revision 1 · 5 August 2026
**Applies to:** Phases 5B, 5C, 5D and 9 of the Implementation Plan

---

## 1. Purpose

The initial beneficiary dataset is collected through Google Forms and exported as a
spreadsheet. This document specifies how that export is profiled, mapped, validated and
loaded into the PostgreSQL register without loss, duplication or silent discard.

**The source structure is not known at the time of writing.** This specification is
therefore written so that no application code depends on the source column names. All
source-specific knowledge is confined to a single configuration file.

---

## 2. Governing Principles

1. **No silent discard.** Every source column is either mapped to a canonical field or
   explicitly recorded as excluded with a stated reason. Every rejected row appears in the
   exception report with the rule that rejected it.
2. **Dry run precedes every load.** No write occurs until a dry run has been reviewed.
3. **Idempotent by construction.** Re-processing the same export must not create duplicate
   beneficiary records.
4. **Source file is immutable.** Corrections are applied through the mapping and
   transformation layer, never by editing the received file.
5. **Reconciliation is mandatory.** Rows received must equal rows accepted plus rows
   rejected plus duplicates suppressed.

---

## 3. Processing Pipeline

```
Google Forms export (.csv / .xlsx)
        │
        ▼
[1] Profiling          → column inventory, null rates, distinct values, format samples
        │
        ▼
[2] Field mapping      → fieldMapping.js : source column ──► canonical field
        │
        ▼
[3] Transformation     → normalise dates, mobile numbers, gender, district names
        │
        ▼
[4] Validation         → per-row Zod schema; row passes or enters exception report
        │
        ▼
[5] Dry run            → accepted / rejected counts, no database write
        │
        ▼
[6] Load               → idempotent upsert, MHID assignment, audit entry
        │
        ▼
[7] Reconciliation     → balance statement, retained sample extract
```

---

## 4. Canonical Target Schema

Every source column maps to one of the following fields on the `workers` table. Fields
marked **required** must resolve to a non-empty value or the row is rejected.

| Canonical field | Type | Required | Notes |
|---|---|---|---|
| `full_name` | TEXT | **Yes** | Trimmed; internal whitespace collapsed |
| `mobile` | TEXT | **Yes** | Normalised to 10 digits; country code stripped; deduplication key |
| `date_of_birth` | DATE | No | Accepts multiple input formats; age may be supplied instead |
| `gender` | TEXT | No | Normalised to Male / Female / Other |
| `native_state` | TEXT | No | Free text, title-cased |
| `native_district` | TEXT | No | Free text, title-cased |
| `current_district` | TEXT | **Yes** | Validated against the official 14-district list |
| `current_address` | TEXT | No | Free text |
| `employer` | TEXT | No | Free text |
| `occupation` | TEXT | No | Free text |
| `emergency_contact` | TEXT | No | Name and number, normalised where separable |
| `preferred_language` | TEXT | No | Defaults to `en` |
| `abha_id` | TEXT | No | **Optional.** Absence never blocks registration |

Fields **not** sourced from the form and assigned by the system: `id`, `mhid`, `user_id`,
`created_at`, `updated_at`.

Clinical fields (blood group, allergies, chronic conditions) are written to
`health_records`, not `workers`. If the form collects them, they are mapped to that table
in the same pass.

---

## 5. Transformation Rules

| Rule | Behaviour |
|---|---|
| `trim` | Removes leading and trailing whitespace; collapses internal runs to a single space |
| `titleCase` | Capitalises each word; used for names, states and districts |
| `mobile10` | Strips spaces, hyphens, parentheses and a leading `+91` or `91`; expects exactly 10 remaining digits |
| `dateISO` | Accepts `DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD` and Google Forms timestamps; emits `YYYY-MM-DD` |
| `ageToDOB` | Where only age is supplied, derives an approximate date of birth and flags the row as derived |
| `genderNorm` | Maps `M`, `male`, `MALE`, `പുരുഷൻ` and equivalents to `Male`; likewise for other values |
| `districtNorm` | Matches against the 14 official district names, tolerating common spelling variants |
| `textArray` | Splits a delimited list (comma, semicolon, pipe, newline) into `TEXT[]`; "None", "Nil", "NKA" and equivalents collapse to an empty array |
| `passthrough` | Stores the value unchanged |

**On ambiguity the rule fails the row rather than guessing.** A row rejected for an
unparseable date is preferable to a record carrying a fabricated date of birth.

### Amendments made during implementation (Phase 5B)

**`textArray` was added — a ninth rule.** Revision 1 listed eight transformations, none of
which produced an array. `health_records.allergies`, `chronic_conditions` and
`current_medications` are `TEXT[]` columns, so a string rule would have written a single
string where PostgreSQL expects an array. The rule also treats "None", "Nil", "NKA" and
similar as an empty array, so that the clinical banner reads "no known allergies" rather
than displaying the word *None* as though it were an allergen.

**`ageToDOB` is opt-in only.** It fires solely where the mapping explicitly points it at an
age column, and never as a fallback when `dateISO` fails — that fallback would convert an
unparseable date into an invented one. The derived value is 1 January of the implied birth
year and the row is flagged `dob_derived`, which appears in the exception report and
travels with the record. A clinician reading such a record should treat the age as ±1 year.

**`dateISO` reads day first, by stated convention.** For a slash or dash date whose first
two components are both 12 or less, `05/06/1993` is 5 June under Indian convention and
6 May under United States convention. The implementation reads day first because the data
is collected in Kerala.

> **This must be confirmed against the real export in Phase 5C.** A Google Form whose
> owner's account locale is `en-US` emits month first, and every ambiguous date would then
> be wrong by up to eleven months — silently, because the result is still a valid date.
> Confirm by checking whether any value in the column has a first component above 12; if
> one does, the column is day-first and the convention holds.

A two-digit year is rejected outright. The century cannot be inferred without guessing,
and guessing wrong moves a date of birth by a hundred years.

---

## 6. Validation Rules

A row is **accepted** only if all of the following hold:

- `full_name` is present and at least two characters
- `mobile` normalises to exactly 10 digits and begins with 6, 7, 8 or 9
- `current_district` matches an official district
- `date_of_birth`, where present, is a valid date yielding an age between 14 and 100
- `abha_id`, where present, is 14 digits

A row is **rejected** with a stated reason if any rule fails. A row is **suppressed as a
duplicate** if its normalised mobile number already exists in the register; the existing
record is updated where the incoming values are non-empty, and the suppression is reported.

### Duplicate detection has two sources of truth (clarified in Phase 5B)

The register alone is not sufficient. Deduplication compares against **both**:

1. **the register** — normalised mobile numbers of live beneficiaries; and
2. **every mobile number seen earlier in the same file, whatever that row's outcome was.**

The second is easy to omit and the omission is silent. In `sample_dirty.csv` row 5 is
rejected as under-age and row 7 repeats its mobile number. Tracking only *accepted* rows
would leave row 7 looking novel, and it would be admitted as a second record for the same
person — which is precisely the fault the fixture exists to detect.

A duplicate whose earlier occurrence was itself **rejected** has no stored record to
update. It is reported as `duplicate_suppressed` with that stated reason, and nothing is
written for either row.

**Updates never blank a stored value.** A field arriving empty leaves the existing value in
place, and a `TEXT[]` column arriving empty is not overwritten. A re-submitted form that
omits the allergy question must not erase a recorded penicillin allergy — this is the most
dangerous silent write in the system, and it is prevented in the SQL rather than by
convention.

---

## 7. Exception Report

Produced on every dry run and every load, as a downloadable CSV:

| Column | Content |
|---|---|
| `source_row` | Row number in the received file |
| `outcome` | `accepted` / `rejected` / `duplicate_suppressed` |
| `rule` | The rule that determined the outcome |
| `field` | The field concerned |
| `received_value` | The value as received |
| `note` | Operator guidance for correction |

---

## 8. Reconciliation Statement

Issued at the conclusion of each load and retained as a record:

```
Source file            : <filename>
Received at            : <timestamp>
Rows in source         : N
  Accepted             : A
  Rejected             : R
  Duplicates suppressed: D
Balance check          : A + R + D = N            [must hold]
MHIDs issued           : A
Register count before  : X
Register count after   : X + A                     [must hold]
Sample extract retained: 20 rows → docs/samples/
```

A load whose balance check fails is treated as a failed load and is rolled back.

---

## 9. Procedure on Receipt of the Dataset

**Step 1 — Deposit.** Place the export at `server/db/imports/` under its original filename.
Do not edit it.

**Step 2 — Profile.** Run the profiling pass. It reports every column, its null rate,
distinct value count and five sample values. Review before mapping.

**Step 3 — Map.** Complete `server/src/config/fieldMapping.js`. For each source column,
either record a target field and transformation, or add it to the documented exclusion
list with a reason.

**Step 4 — Dry run.** Execute in dry-run mode. Review the exception report. Adjust mapping
and transformation rules. Repeat until the rejection set contains only genuinely
unusable rows.

**Step 5 — Load.** Execute the load. MHIDs are assigned on acceptance.

**Step 6 — Reconcile.** Verify the balance statement. Retain the sample extract for
regression testing. Record the outcome in the Implementation Plan progress table.

---

## 10. Handling of Sample Data Prior to Receipt

Until the dataset arrives, ingestion is exercised against two labelled fixtures:

| Fixture | Purpose |
|---|---|
| `server/db/fixtures/sample_clean.csv` | Well-formed rows; verifies the acceptance path |
| `server/db/fixtures/sample_dirty.csv` | Deliberately malformed rows; verifies each rejection rule |

These fixtures are synthetic, contain no real personal data, and are **not** loaded into
any environment carrying live records. They are removed at Phase 30 or retained solely as
test fixtures.
