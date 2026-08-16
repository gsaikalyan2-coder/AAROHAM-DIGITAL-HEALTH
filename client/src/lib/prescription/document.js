/**
 * ============================================================================
 * Prescription document builder (.docx) — Workers Portal only.
 * ============================================================================
 *
 * Renders the output of ./rules.js into a Word document and hands it to the
 * browser as a download. Editable by design: the draft is expected to be
 * amended and then signed by a registered medical practitioner.
 *
 * Colour and type follow CLAUDE.md §4 — gov.navy headings, flat 1px rules,
 * no decoration. Nothing here touches the network or the database.
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, VerticalAlign,
} from 'docx';
import { buildRecommendations, FALLBACK_TEXT } from './rules.js';

const NAVY = '0B3D63';
const TEAL = '0F766E';
const MUTED = '5A6675';
const DANGER = 'B91C1C';
const BORDER = 'D4DAE3';
const GRAY = 'F4F6F9';

const thin = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorders = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
};

/* ---------------------------- small helpers ---------------------------- */

const text = (value, opts = {}) =>
  new Paragraph({
    alignment: opts.align,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 60 },
    children: [new TextRun({
      text: String(value),
      bold: opts.bold,
      italics: opts.italics,
      size: opts.size ?? 20,          // half-points → 20 = 10pt
      color: opts.color ?? '1F2933',
      font: 'Calibri',
    })],
  });

const heading = (value) =>
  new Paragraph({
    spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER, space: 2 } },
    children: [new TextRun({ text: value.toUpperCase(), bold: true, size: 19, color: NAVY, font: 'Calibri' })],
  });

const cell = (children, opts = {}) =>
  new TableCell({
    children: Array.isArray(children) ? children : [children],
    borders: opts.borders ?? cellBorders,
    shading: opts.shade ? { fill: opts.shade } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });

const table = (rows) =>
  new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });

/** Two-column label/value block, no visible grid. */
function fieldTable(pairs) {
  return table(pairs.map(([label, value]) => new TableRow({
    children: [
      cell(text(label, { bold: true, color: MUTED, size: 18 }), { borders: noBorders, width: 28 }),
      cell(text(value || '—'), { borders: noBorders, width: 72 }),
    ],
  })));
}

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Most recent consultation by date; the prescriber of record. */
export function latestConsultation(consultations = []) {
  return [...consultations].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
}

/* ------------------------------ builder ------------------------------ */

export function buildPrescriptionDoc({ worker, consultations, prescriptions = [] }) {
  const consult = latestConsultation(consultations);
  const active = prescriptions.filter((p) => p.active);
  const issued = todayISO();

  // Active prescription rows are the authoritative medication list when present;
  // worker.currentMedications is the fallback. The safety checks read from this
  // merged list so an already-dispensed medicine is never suggested again.
  const activeText = active.map(
    (p) => `${p.medicine} — ${p.dosage}, ${p.frequency}${p.duration ? ` (${p.duration})` : ''}`,
  );
  const medicationList = activeText.length ? activeText : (worker.currentMedications || []);
  const result = buildRecommendations({ ...worker, currentMedications: medicationList });

  const body = [];

  /* Departmental letterhead */
  body.push(text('GOVERNMENT OF KERALA', { bold: true, size: 22, color: NAVY, align: AlignmentType.CENTER, after: 20 }));
  body.push(text('Department of Health & Family Welfare', { size: 19, color: MUTED, align: AlignmentType.CENTER, after: 20 }));
  body.push(text('Aaroham · Migrant Worker Health Record System', { size: 18, color: TEAL, align: AlignmentType.CENTER, after: 160 }));

  body.push(new Paragraph({
    spacing: { after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: NAVY, space: 2 } },
    children: [new TextRun({ text: 'MEDICAL PRESCRIPTION', bold: true, size: 26, color: NAVY, font: 'Calibri' })],
  }));
  body.push(text(
    'DRAFT — generated from the worker health record. Not valid until reviewed and signed by a registered medical practitioner.',
    { italics: true, size: 17, color: DANGER, after: 160 },
  ));

  /* Patient */
  body.push(heading('Patient'));
  body.push(fieldTable([
    ['Name', worker.name],
    ['Migrant Health ID', worker.mhid],
    ['Age / Gender', `${worker.age} years · ${worker.gender}`],
    ['Blood group', worker.bloodGroup],
    ['Current district', worker.currentDistrict],
    ['Known allergies', (worker.allergies || []).join(', ') || 'None recorded'],
  ]));

  /* Prescriber */
  body.push(heading('Prescriber & Facility'));
  body.push(fieldTable([
    ['Doctor', consult?.doctor],
    ['Department', consult?.department],
    ['Hospital', consult?.hospital],
    ['District', consult?.district],
    ['Consultation date', consult?.date],
  ]));

  /* Diagnosis */
  body.push(heading('Diagnosis & Current Condition'));
  const chronic = worker.chronicConditions || [];
  if (chronic.length) {
    chronic.forEach((c) => body.push(text(`•  ${c}`, { after: 40 })));
  } else {
    body.push(text('No chronic condition recorded.', { color: MUTED }));
  }
  body.push(text(
    `Current condition (latest consultation): ${consult?.diagnosis || 'Not recorded'}`,
    { before: 80, after: 60 },
  ));

  /* Existing medication — the active rows from the prescription record */
  body.push(heading('Existing Medication (Active)'));
  if (medicationList.length) medicationList.forEach((m) => body.push(text(`•  ${m}`, { after: 40 })));
  else body.push(text('None recorded.', { color: MUTED }));

  /* Recommendations */
  body.push(heading('Recommended Medicines'));
  if (result.fallback) {
    body.push(text(FALLBACK_TEXT, { bold: true, size: 22, color: DANGER, after: 60 }));
    body.push(text(
      'The rule set produced no safe recommendation for the recorded condition. A clinical review is required.',
      { color: MUTED, size: 18 },
    ));
  } else {
    const header = ['#', 'Medicine', 'Dosage', 'Frequency', 'Duration', 'Indication'];
    const widths = [5, 26, 15, 21, 18, 15];
    const rows = [new TableRow({
      tableHeader: true,
      children: header.map((h, i) => cell(
        text(h, { bold: true, size: 17, color: NAVY }),
        { shade: GRAY, width: widths[i] },
      )),
    })];
    result.recommendations.forEach((r, i) => {
      rows.push(new TableRow({
        children: [
          cell(text(String(i + 1), { size: 18 }), { width: widths[0] }),
          cell(text(r.name, { bold: true, size: 18 }), { width: widths[1] }),
          cell(text(r.dosage, { size: 18 }), { width: widths[2] }),
          cell(text(r.frequency, { size: 18 }), { width: widths[3] }),
          cell(text(r.duration, { size: 18 }), { width: widths[4] }),
          cell(text(r.indication, { size: 18, color: MUTED }), { width: widths[5] }),
        ],
      }));
    });
    body.push(table(rows));
  }

  /* Safety trail — why something was NOT given */
  if (result.suppressed.length) {
    body.push(heading('Withheld by Safety Check'));
    result.suppressed.forEach((s) => body.push(text(`•  ${s.name} — ${s.reason}`, { size: 18, after: 40 })));
  }

  if (result.notes.length) {
    body.push(heading('Clinical Notes'));
    result.notes.forEach((n) => body.push(text(`•  ${n}`, { size: 18, after: 40 })));
  }

  /* Signature */
  body.push(heading('Issue & Signature'));
  body.push(text(`Date of prescription: ${issued}`, { after: 400 }));
  body.push(table([new TableRow({
    children: [
      cell([
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1F2933', space: 4 } },
          spacing: { after: 60 }, children: [new TextRun({ text: ' ' })],
        }),
        text('Signature of Prescribing Medical Practitioner', { size: 17, color: MUTED }),
        text(consult?.doctor || '', { size: 18, bold: true }),
        text(consult?.hospital || '', { size: 17, color: MUTED }),
      ], { borders: noBorders, width: 55 }),
      cell([
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1F2933', space: 4 } },
          spacing: { after: 60 }, children: [new TextRun({ text: ' ' })],
        }),
        text('Medical Council Registration No.', { size: 17, color: MUTED }),
        text('Facility seal', { size: 17, color: MUTED, before: 120 }),
      ], { borders: noBorders, width: 45 }),
    ],
  })]));

  body.push(text(
    'This document was generated by Aaroham from the worker health record using a fixed, rule-based mapping. '
    + 'It is clinical decision support only and carries no authority until signed above. Dispensing against an unsigned '
    + 'copy is not permitted.',
    { italics: true, size: 16, color: MUTED, before: 300 },
  ));

  const doc = new Document({
    creator: 'Aaroham',
    title: `Prescription — ${worker.mhid}`,
    description: 'Rule-based draft prescription. Requires prescriber signature.',
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: body,
    }],
  });

  return { doc, filename: `Prescription_${worker.mhid}_${issued}.docx`, result };
}

/** Builds the document and triggers the browser download. */
export async function downloadPrescription({ worker, consultations, prescriptions }) {
  const { doc, filename, result } = buildPrescriptionDoc({ worker, consultations, prescriptions });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { filename, result };
}
