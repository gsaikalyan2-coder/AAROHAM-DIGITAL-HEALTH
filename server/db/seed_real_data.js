#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import bcrypt from 'bcryptjs';
import { closePool, getPool } from '../src/config/db.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = join(HERE, 'imports', 'uploaded_form.csv');

function parseCsv(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(current);
    current = '';
  };

  const pushRow = () => {
    pushField();
    if (row.some((field) => field.trim() !== '')) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      current += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ',') {
      pushField();
      i += 1;
      continue;
    }

    if (ch === '\n') {
      pushRow();
      i += 1;
      continue;
    }

    if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1;
      pushRow();
      i += 1;
      continue;
    }

    current += ch;
    i += 1;
  }

  if (current !== '' || row.length > 0) pushRow();
  return rows;
}

function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeGender(value) {
  const v = normalizeText(value).toLowerCase();
  if (['male', 'm', 'man'].includes(v)) return 'Male';
  if (['female', 'f', 'woman'].includes(v)) return 'Female';
  return 'Other';
}

function normalizeState(value) {
  const v = normalizeText(value).toLowerCase();
  if (v.includes('tamil')) return 'Tamil Nadu';
  if (v.includes('telangana')) return 'Telangana';
  if (v.includes('andhra')) return 'Andhra Pradesh';
  if (v.includes('kerala')) return 'Kerala';
  return normalizeText(value);
}

function normalizeDistrict(value) {
  const v = normalizeText(value).toLowerCase();
  if (v.includes('kerala')) return 'Ernakulam';
  if (v.includes('tamil')) return 'Ernakulam';
  if (v.includes('telangana')) return 'Ernakulam';
  if (v.includes('andhra')) return 'Ernakulam';
  return 'Ernakulam';
}

function normalizeMobile(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  return null;
}

function parseAge(value) {
  const raw = normalizeText(value);
  if (!raw) return null;
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  const age = Number(match[1]);
  const now = new Date();
  const year = now.getFullYear() - age;
  return `${year}-01-01`;
}

function parseArray(value) {
  const raw = normalizeText(value);
  if (!raw || ['none', 'nil', 'n/a', 'na', '-', 'no', 'nothing', 'no known allergies'].includes(raw.toLowerCase())) {
    return [];
  }
  return raw.split(/[;,|]/).map((item) => normalizeText(item)).filter(Boolean);
}

async function main() {
  const text = await readFile(CSV_PATH, 'utf8');
  const matrix = parseCsv(text);
  const [headers, ...rows] = matrix;

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('Admin@1234', 12);

    const hospital = await client.query(
      `INSERT INTO hospitals (name, district, type, address, contact) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Government General Hospital', 'Ernakulam', 'Government', 'Kochi', '0484-2361251']
    );
    const hospitalId = hospital.rows[0].id;

    const adminUser = await client.query(
      `INSERT INTO users (role, email, password_hash, is_active) VALUES ($1, $2, $3, TRUE) RETURNING id`,
      ['admin', 'admin@Aaroham.gov.in', passwordHash]
    );
    const adminUserId = adminUser.rows[0].id;

    const doctorUser = await client.query(
      `INSERT INTO users (role, email, password_hash, is_active) VALUES ($1, $2, $3, TRUE) RETURNING id`,
      ['doctor', 'doctor@Aaroham.gov.in', passwordHash]
    );
    const doctorUserId = doctorUser.rows[0].id;

    await client.query(
      `INSERT INTO doctors (user_id, hospital_id, full_name, specialisation, registration_number) VALUES ($1, $2, $3, $4, $5)`,
      [doctorUserId, hospitalId, 'Dr. Meera Raghavan', 'General Medicine', 'TCMC-2024-0001']
    );

    let inserted = 0;
    for (const row of rows) {
      const record = Object.fromEntries(headers.map((header, idx) => [header, row[idx] ?? '']));
      const mobile = normalizeMobile(record['Phone Number']);
      if (!mobile) continue;

      const userResult = await client.query(
        `INSERT INTO users (role, mobile, password_hash, is_active) VALUES ($1, $2, $3, TRUE) RETURNING id`,
        ['worker', mobile, null]
      );
      const userId = userResult.rows[0].id;

      const mhid = `KL-EKM-24-${String(inserted + 1).padStart(6, '0')}-8`;
      const workerResult = await client.query(
        `INSERT INTO workers (user_id, mhid, full_name, date_of_birth, gender, mobile, native_state, native_district, current_district, current_address, employer, occupation, emergency_contact, preferred_language)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
        [
          userId,
          mhid,
          normalizeText(record['Full name']),
          parseAge(record['Age']),
          normalizeGender(record['Gender']),
          mobile,
          normalizeState(record['State']),
          null,
          normalizeDistrict(record['State']),
          normalizeText(record['Any previous work location in last few years']) || null,
          normalizeText(record['Occupation']) || null,
          normalizeText(record['Occupation']) || null,
          mobile,
          normalizeText(record['Preferred Languages']) || 'en'
        ]
      );

      const workerId = workerResult.rows[0].id;
      await client.query(
        `INSERT INTO health_records (worker_id, chronic_conditions, current_medications, notes) VALUES ($1, $2, $3, $4)`,
        [
          workerId,
          parseArray(record['Chronic Conditions']),
          parseArray(record['Current Medications']),
          normalizeText(record['Past major treatments/surgeries']) || null
        ]
      );

      await client.query(
        `INSERT INTO audit_logs (actor_id, actor_role, action, entity, entity_id, user_agent) VALUES ($1, $2, $3, $4, $5, $6)`,
        [adminUserId, 'admin', 'IMPORT beneficiary_dataset', 'workers', workerId, 'csv-import']
      );

      inserted += 1;
    }

    await client.query('COMMIT');
    console.log(`Imported ${inserted} workers from CSV.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await closePool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
