import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/health_management';
const pool = new Pool({ connectionString });

// Parse CSV lines respecting quotes
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length >= headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] ? values[idx].replace(/^"|"$/g, '').trim() : '';
      });
      rows.push(obj);
    }
  }
  return rows;
}

async function seedCSVData() {
  console.log('\n======================================================');
  console.log('📥 AAROHAM CSV DATASET SEEDER (data.csv)');
  console.log('Reading real migrant health survey dataset...');
  console.log('======================================================\n');

  const csvPath = path.join(__dirname, '..', '..', 'client', 'public', 'data.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, 'utf8');
  const records = parseCSV(csvText);
  console.log(`Found ${records.length} records in data.csv.\n`);

  const client = await pool.connect();
  try {
    // Hash default password for seeded accounts
    const defaultPasswordHash = await bcrypt.hash('Aaroham@2026', 10);

    let insertedWorkers = 0;
    let insertedConsultations = 0;
    let insertedVaccinations = 0;

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const name = r['Full name'] || `Migrant Worker ${i + 1}`;
      
      // Clean age from range string like "25-35" -> 30
      let age = 30;
      if (r['Age']) {
        const match = r['Age'].match(/\d+/g);
        if (match && match.length === 2) {
          age = Math.round((parseInt(match[0]) + parseInt(match[1])) / 2);
        } else if (match && match.length === 1) {
          age = parseInt(match[0]);
        }
      }

      const gender = r['Gender'] || 'Male';
      const rawPhone = r['Phone Number'] ? r['Phone Number'].replace(/[^0-9]/g, '') : '';
      const homeState = r['State'] || 'Tamil Nadu';
      const languages = r['Preferred Languages'] || 'English;Tamil';
      const occupation = r['Occupation'] || 'Labourer';
      const duration = r['How long have been working at the current location'] || '1+ year';

      const isKalgiswar = name.toLowerCase().includes('kalgiswar');
      const abhaId = isKalgiswar ? '91-5330-6818-7855' : `14-${String(1000 + i).slice(-4)}-${String(2000 + i).slice(-4)}-${String(3000 + i).slice(-4)}`;
      const email = isKalgiswar ? 'kalgiswar@abdm' : `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}${i+1}@aaroham.worker.in`;
      const phone = isKalgiswar ? '9443907550' : (rawPhone.length >= 10 ? rawPhone.slice(-10) : `98470${String(10000 + i).slice(-5)}`);
      const dob = isKalgiswar ? '2007-05-26' : '1995-06-15';
      
      const chronic = r['Chronic Conditions'] && r['Chronic Conditions'] !== 'None' ? r['Chronic Conditions'] : null;
      const medications = r['Current Medications'] && r['Current Medications'] !== 'Nil' && r['Current Medications'] !== 'None' ? r['Current Medications'] : null;
      const surgeries = r['Past major treatments/surgeries'] && r['Past major treatments/surgeries'] !== 'Nil' && r['Past major treatments/surgeries'] !== 'None' ? r['Past major treatments/surgeries'] : null;
      
      const isVaccinated = r['COVID vaccination done?']?.toLowerCase() === 'yes';

      const healthIssues = [chronic, medications, surgeries].filter(Boolean).join(' | ') || 'Routine Health Profile';

      // Insert Worker
      const workerRes = await client.query(
        `INSERT INTO workers (
          full_name, ABHA_id, email, password_hash, age, home_state, current_address,
          date_of_birth, gender, blood_group, employer_name, employer_phone_number,
          is_vaccinated, spoken_language, previous_health_issues
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, ABHA_id = EXCLUDED.ABHA_id, employer_phone_number = EXCLUDED.employer_phone_number
        RETURNING id`,
        [
          name,
          abhaId,
          email,
          defaultPasswordHash,
          isKalgiswar ? 19 : age,
          homeState,
          `Kerala Construction Camp, Ernakulam (${homeState} Native)`,
          dob,
          gender,
          i % 2 === 0 ? 'B+' : 'O+',
          `${occupation} Worksite - ${homeState} Division`,
          phone,
          isVaccinated,
          languages,
          healthIssues,
        ]
      );

      const workerId = workerRes.rows[0].id;
      insertedWorkers++;

      // Create consultation if chronic conditions exist
      if (chronic) {
        await client.query(
          `INSERT INTO consultations (
            worker_id, doctor_name, hospital_name, district, visit_date, symptoms, diagnosis, prescriptions, notes
          ) VALUES ($1, $2, $3, $4, CURRENT_DATE - INTERVAL '${i} days', $5, $6, $7, $8)`,
          [
            workerId,
            'Dr. Anitha Menon',
            'Govt. General Hospital, Ernakulam',
            'Ernakulam',
            healthIssues,
            chronic,
            medications || 'Standard Routine Care',
            `Work location history: ${duration}. Previous work: ${r['Any previous work location in last few years'] || 'N/A'}.`,
          ]
        );
        insertedConsultations++;
      }

      // Create vaccination record
      if (isVaccinated) {
        await client.query(
          `INSERT INTO vaccinations (
            worker_id, vaccine_name, dose_number, administered_on, hospital_name, status
          ) VALUES ($1, $2, $3, CURRENT_DATE - INTERVAL '${i * 2} days', $4, $5)`,
          [
            workerId,
            'COVID-19 (Covishield)',
            'Dose 2 Complete',
            'District Hospital, Kozhikode',
            'Complete',
          ]
        );
        insertedVaccinations++;
      }
    }

    console.log(`✅ SUCCESS: Seeded ${insertedWorkers} real worker profiles from data.csv into PostgreSQL!`);
    console.log(`✅ Seeded ${insertedConsultations} clinical consultations and ${insertedVaccinations} vaccination records.`);
    console.log('\n======================================================\n');
  } catch (err) {
    console.error('❌ [CSV Seeder Error]:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedCSVData();
