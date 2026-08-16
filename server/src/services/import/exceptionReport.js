/**
 * ============================================================================
 * Exception report and reconciliation statement
 * ----------------------------------------------------------------------------
 * Report columns are fixed by docs/DATA_INGESTION.md §7; the statement format by
 * §8. Both are written for a departmental operator with a spreadsheet, not for a
 * developer with a debugger — every line names the rule that produced it and
 * what to do about it.
 * ============================================================================
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/** §7 — column order is part of the specification and is not rearranged. */
const REPORT_COLUMNS = [
  'source_row',
  'outcome',
  'rule',
  'field',
  'received_value',
  'note',
];

/**
 * Quotes a value for CSV.
 * A diagnosis or address containing a comma must not shift every later column,
 * which would make the report unreadable exactly when it matters.
 */
function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv(entries) {
  const lines = [REPORT_COLUMNS.join(',')];
  for (const entry of entries) {
    lines.push(REPORT_COLUMNS.map((column) => csvCell(entry[column])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Writes the report and returns its path.
 * The filename carries the mode and a timestamp, so a dry run and the load that
 * follows it can be compared side by side rather than one overwriting the other.
 */
export async function writeExceptionReport(entries, { outputDir, sourceName, mode }) {
  await mkdir(outputDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const base = sourceName.replace(/\.[^.]+$/, '');
  const path = join(outputDir, `${base}__${mode}__${stamp}.csv`);

  await writeFile(path, toCsv(entries), 'utf8');
  return path;
}

/**
 * Builds the reconciliation statement of §8.
 *
 * The balance check is the point of the whole document: rows received must equal
 * accepted plus rejected plus duplicates suppressed. A load whose balance fails
 * is a failed load, because it means rows went somewhere unaccounted for.
 */
export function buildReconciliation({
  sourceFile,
  receivedAt,
  rowsInSource,
  accepted,
  rejected,
  duplicatesSuppressed,
  mhidsIssued,
  registerBefore,
  registerAfter,
  mode,
  reportPath,
}) {
  const balances = accepted + rejected + duplicatesSuppressed === rowsInSource;

  const registerExpected =
    registerBefore === null ? null : registerBefore + mhidsIssued;
  const registerBalances =
    registerAfter === null || registerExpected === null
      ? null
      : registerAfter === registerExpected;

  const lines = [
    `Source file            : ${sourceFile}`,
    `Received at            : ${receivedAt}`,
    `Mode                   : ${mode}`,
    `Rows in source         : ${rowsInSource}`,
    `  Accepted             : ${accepted}`,
    `  Rejected             : ${rejected}`,
    `  Duplicates suppressed: ${duplicatesSuppressed}`,
    `Balance check          : ${accepted} + ${rejected} + ${duplicatesSuppressed} = ` +
      `${accepted + rejected + duplicatesSuppressed} of ${rowsInSource}   ` +
      `[${balances ? 'HOLDS' : 'FAILED'}]`,
    `MHIDs issued           : ${mhidsIssued}`,
  ];

  if (registerBefore === null) {
    lines.push(
      'Register count before  : not read (dry run makes no database connection)',
      'Register count after   : not read'
    );
  } else {
    lines.push(
      `Register count before  : ${registerBefore}`,
      `Register count after   : ${registerAfter}   ` +
        `[expected ${registerExpected}` +
        `${registerBalances === null ? '' : registerBalances ? ' — HOLDS' : ' — FAILED'}]`
    );
  }

  lines.push(`Exception report       : ${reportPath}`);

  return { text: lines.join('\n'), balances, registerBalances };
}

/** Ensures the directory for a file path exists. */
export async function ensureDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}
