import pg from 'pg';
import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function rebuild() {
  const client = await pool.connect();
  try {
    console.log('[DB Rebuild] Dropping old tables to align with exact user schema...');
    await client.query('DROP TABLE IF EXISTS consultations, vaccinations, lab_reports, workers, doctors, government_users CASCADE');

    const sql = await readFile(join(__dirname, 'init_tables.sql'), 'utf8');
    await client.query(sql);
    console.log('✅ Rebuilt PostgreSQL tables according to exact schema!');
  } finally {
    client.release();
    await pool.end();
  }
}

rebuild();
