import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/health_management';
const pool = new Pool({ connectionString });

const ALL_TABLES = [
  'consultations',
  'prescriptions',
  'vaccinations',
  'lab_reports',
  'appointments',
  'mental_health_screenings',
  'audit_logs',
  'health_records',
  'workers',
  'doctors',
  'government_users',
  'users',
  'hospitals',
  'schemes'
];

async function clearDatabase() {
  console.log('\n======================================================');
  console.log('🗑️  AAROHAM DATABASE CLEANER');
  console.log('Connecting to PostgreSQL database...');
  console.log(`Target: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
  console.log('======================================================\n');

  const client = await pool.connect();
  try {
    // Check which tables actually exist in PostgreSQL
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existingTables = res.rows.map(r => r.table_name);
    const tablesToTruncate = ALL_TABLES.filter(t => existingTables.includes(t));

    if (tablesToTruncate.length === 0) {
      console.log('ℹ️  No matching tables found. Database is already clean.');
    } else {
      console.log(`Found ${tablesToTruncate.length} active tables to clear: ${tablesToTruncate.join(', ')}`);
      
      const truncateQuery = `TRUNCATE TABLE ${tablesToTruncate.join(', ')} RESTART IDENTITY CASCADE;`;
      await client.query(truncateQuery);
      
      console.log('\n✅ SUCCESS: All records deleted and ID sequences reset to 1!');
      console.log('✅ PostgreSQL database is now fresh and ready for new registrations.\n');
    }
  } catch (err) {
    console.error('❌ [Database Clear Error]:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

clearDatabase();
