/**
 * ============================================================================
 * Source reader — the ONLY module that knows how the received file is encoded.
 * ----------------------------------------------------------------------------
 * Everything downstream consumes `{ headers, rows }` where each row is a plain
 * object keyed by header text. Nothing downstream knows or cares whether the
 * bytes arrived as CSV, TSV or a spreadsheet.
 *
 * Why this is hand-written rather than a dependency.
 * The beneficiary dataset's format is confirmed on 6 August 2026. Until then
 * adding a parser dependency would be a guess, and CLAUDE.md §3 rule 9 forbids
 * unapproved dependencies. This reader is RFC 4180 correct for the cases that
 * actually occur in a Google Forms export: quoted fields, commas and newlines
 * inside quotes, escaped quotes, a UTF-8 byte order mark, and CRLF endings.
 *
 * If the export arrives as .xlsx, replace `readDelimited` with a SheetJS call
 * inside THIS FILE and nothing else changes. That is the whole point of the
 * boundary.
 * ============================================================================
 */

import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

/** Formats this reader can decode today. */
export const SUPPORTED_EXTENSIONS = ['.csv', '.tsv', '.txt'];

/**
 * Parses delimited text into rows of raw strings.
 *
 * A state machine rather than a split on commas, because a split corrupts any
 * field containing a comma — and "Kalamassery, Ernakulam" is an address we must
 * expect in this dataset.
 */
function parseDelimited(text, delimiter) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  let i = 0;

  // A byte order mark would otherwise become part of the first header name,
  // so the first column would never match its mapping.
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  const endField = () => {
    row.push(field);
    field = '';
  };

  const endRow = () => {
    endField();
    // A trailing newline produces one empty final row; discard it.
    const isBlank = row.length === 1 && row[0].trim() === '';
    if (!isBlank) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'; // an escaped quote
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"' && field === '') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === delimiter) {
      endField();
      i += 1;
      continue;
    }

    if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1; // CRLF
      endRow();
      i += 1;
      continue;
    }

    if (ch === '\n') {
      endRow();
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  // Final row when the file does not end with a newline.
  if (field !== '' || row.length > 0) endRow();

  return rows;
}

function inferDelimiter(filePath, firstLine) {
  if (extname(filePath).toLowerCase() === '.tsv') return '\t';
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  return tabs > commas ? '\t' : ',';
}

/**
 * Reads a delimited file into `{ headers, rows, delimiter }`.
 *
 * `rows` are objects keyed by header text, with every value a raw string —
 * untrimmed and untransformed. Normalisation is the transformation layer's
 * responsibility, and doing any of it here would hide what was received from
 * the exception report.
 *
 * A row with fewer cells than the header is padded with empty strings, so a
 * short trailing row surfaces as a missing required field rather than as a
 * crash. A row with MORE cells than the header is a structural fault and
 * throws, because silently dropping a cell would violate the no-silent-discard
 * principle in docs/DATA_INGESTION.md §2.
 */
export async function readSource(filePath) {
  const ext = extname(filePath).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported source format "${ext}". This reader handles ` +
        `${SUPPORTED_EXTENSIONS.join(', ')}. If the export is a spreadsheet, ` +
        'either save it as CSV or extend server/src/services/import/sourceReader.js ' +
        '— no other module needs to change.'
    );
  }

  const text = await readFile(filePath, 'utf8');

  if (text.trim() === '') {
    throw new Error(`Source file is empty: ${filePath}`);
  }

  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const delimiter = inferDelimiter(filePath, firstLine);
  const matrix = parseDelimited(text, delimiter);

  if (matrix.length === 0) {
    throw new Error(`Source file contains no parseable rows: ${filePath}`);
  }

  const headers = matrix[0].map((h) => h.trim());

  const duplicates = headers.filter((h, idx) => headers.indexOf(h) !== idx);
  if (duplicates.length > 0) {
    throw new Error(
      `Source file has duplicate column headings: ${[...new Set(duplicates)].join(', ')}. ` +
        'Mapping would be ambiguous, so the file is refused rather than guessed at.'
    );
  }

  const rows = matrix.slice(1).map((cells, index) => {
    if (cells.length > headers.length) {
      throw new Error(
        `Row ${index + 2} has ${cells.length} cells but the header has ` +
          `${headers.length}. Refusing the file rather than discarding data.`
      );
    }

    const record = {};
    headers.forEach((header, col) => {
      record[header] = cells[col] === undefined ? '' : cells[col];
    });
    return record;
  });

  return { headers, rows, delimiter };
}
