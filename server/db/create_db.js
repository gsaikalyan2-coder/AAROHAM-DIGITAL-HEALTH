import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

// We try to connect to postgres server using default postgres db first
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/health_management';

// Extract base URL without database name or with default 'postgres'
let adminUrl = dbUrl;
if (dbUrl.includes('/health_management')) {
  adminUrl = dbUrl.replace('/health_management', '/postgres');
}

console.log(`Connecting to PostgreSQL admin URL: ${adminUrl}`);

const adminPool = new Pool({
  connectionString: adminUrl,
  connectionTimeoutMillis: 5000,
});

async function main() {
  let client;
  try {
    client = await adminPool.connect();
    console.log('✅ Successfully connected to local PostgreSQL server!');

    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'health_management'");
    if (res.rows.length === 0) {
      console.log("Database 'health_management' does not exist. Creating database now...");
      await client.query('CREATE DATABASE health_management');
      console.log("✅ Database 'health_management' created successfully!");
    } else {
      console.log("✅ Database 'health_management' already exists!");
    }
  } catch (err) {
    console.error('❌ Could not connect to PostgreSQL with credentials in .env:', err.message);
    console.log('\nPlease check:');
    console.log('1. Is your PostgreSQL service running on localhost:5432?');
    console.log('2. What is your PostgreSQL username and password?');
    console.log('   (You can update server/.env with your actual DATABASE_URL)');
  } finally {
    if (client) client.release();
    await adminPool.end();
  }
}

main();
