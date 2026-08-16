import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function verify() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('✅ Tables present in your PostgreSQL database (health_management):');
    res.rows.forEach((r) => console.log(`  • ${r.table_name}`));

    const workerCount = await client.query('SELECT COUNT(*) FROM workers');
    const doctorCount = await client.query('SELECT COUNT(*) FROM doctors');
    const adminCount = await client.query('SELECT COUNT(*) FROM government_users');

    console.log('\n📊 Current record counts:');
    console.log(`  • Registered Workers: ${workerCount.rows[0].count}`);
    console.log(`  • Doctors: ${doctorCount.rows[0].count}`);
    console.log(`  • Government Admins: ${adminCount.rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
}

verify();
