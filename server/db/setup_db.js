import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/health_management';

function sslConfig(url) {
  if (!url || /sslmode=disable/i.test(url)) return false;
  if (/@(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)[:/]/i.test(url)) return false;
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig(databaseUrl),
});

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('[DB Init] Connected to PostgreSQL. Verifying tables...');
    const sqlPath = join(__dirname, 'init_tables.sql');
    const sql = await readFile(sqlPath, 'utf8');

    await client.query(sql);
    console.log('[DB Init] Schema created / verified successfully. No default data seeded.');
  } catch (err) {
    console.error('[DB Init Error]:', err.message);
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase().then(() => pool.end());
}
