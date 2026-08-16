#!/usr/bin/env node
/**
 * ==========================================================================
 * Rebuild schema and seed initial project data.
 * -------------------------------------------------------------------------
 * This replaces the separate migrate/seed flow with a single script that:
 *  1. Connects to PostgreSQL using DATABASE_URL
 *  2. Drops and recreates the public schema
 *  3. Applies every migration file in order
 *  4. Seeds a minimal starter dataset with admin credentials
 *
 * Usage:
 *   npm run db:rebuild
 *
 * Notes:
 *   - This is destructive for the target database.
 *   - It is intended for local development or a fresh PostgreSQL database.
 * =========================================================================
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pg from 'pg';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(HERE, 'migrations');

dotenv.config({ path: join(HERE, '..', '.env') });

const { Pool } = pg;
const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'No PostgreSQL connection string was provided. Pass it as the first argument ' +
    'or set DATABASE_URL in server/.env before running this script.'
  );
}

function sslConfig(connectionStringValue) {
  if (!connectionStringValue) return false;
  if (/sslmode=disable/i.test(connectionStringValue)) return false;
  if (/@(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)[:/]/i.test(connectionStringValue)) {
    return false;
  }
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString,
  ssl: sslConfig(connectionString),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

async function loadMigrations() {
  const entries = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  return Promise.all(
    entries.map(async (filename) => ({
      filename,
      sql: await readFile(join(MIGRATIONS_DIR, filename), 'utf8'),
    }))
  );
}

async function applyMigrations(client) {
  const migrations = await loadMigrations();

  for (const migration of migrations) {
    console.log(`Applying ${migration.filename}...`);
    await client.query('BEGIN');
    try {
      await client.query(migration.sql);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`${migration.filename} failed: ${error.message}`);
    }
  }
}

async function seedStarterData(client) {
  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  const hospitalResult = await client.query(
    `INSERT INTO hospitals (name, district, type, address, contact)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      'Government General Hospital',
      'Ernakulam',
      'Government',
      'Hospital Road, Kochi',
      '0484-2361251',
    ]
  );

  const hospitalId = hospitalResult.rows[0].id;

  const adminUser = await client.query(
    `INSERT INTO users (role, email, password_hash, is_active)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id`,
    ['admin', 'admin@Aaroham.gov.in', passwordHash]
  );
  const adminUserId = adminUser.rows[0].id;

  const doctorUser = await client.query(
    `INSERT INTO users (role, email, password_hash, is_active)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id`,
    ['doctor', 'doctor@Aaroham.gov.in', passwordHash]
  );
  const doctorUserId = doctorUser.rows[0].id;

  await client.query(
    `INSERT INTO doctors (user_id, hospital_id, full_name, specialisation, registration_number)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      doctorUserId,
      hospitalId,
      'Dr. Meera Raghavan',
      'General Medicine',
      'TCMC-2024-0001',
    ]
  );

  const workerUser = await client.query(
    `INSERT INTO users (role, mobile, password_hash, is_active)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id`,
    ['worker', '9946010001', null]
  );
  const workerUserId = workerUser.rows[0].id;

  const workerResult = await client.query(
    `INSERT INTO workers (user_id, mhid, full_name, mobile, current_district, current_address, employer, occupation, emergency_contact, preferred_language)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`

  );
  const workerId = workerResult.rows[0].id;

  await client.query(
    `INSERT INTO health_records (worker_id, blood_group, allergies, chronic_conditions, current_medications, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      workerId,
      'O+',
      ['Penicillin'],
      ['Hypertension'],
      ['Amlodipine 5mg'],
      'Starter record created by rebuild script.',
    ]
  );

  console.log('\nStarter credentials created:');
  console.log('  Email: admin@Aaroham.gov.in');
  console.log('  Password: Admin@1234');
  console.log(`  Admin user id: ${adminUserId}`);
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('Rebuilding PostgreSQL schema and seeding starter data...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');

    await applyMigrations(client);
    await seedStarterData(client);

    console.log('\nDatabase rebuild complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`\nRebuild failed: ${error.message}`);
  process.exitCode = 1;
  pool.end().catch(() => { });
});
