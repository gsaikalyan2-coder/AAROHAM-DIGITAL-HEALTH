import http from 'node:http';

async function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testRealDBAuth() {
  console.log('🧪 Testing Strict Real PostgreSQL Authentication...\n');

  // Test 1: Register worker in DB
  const workerReg = await post('/auth/worker/register', {
    full_name: 'Suresh Chandra Roy',
    ABHA_id: '14-9988-7766-5544',
    email: 'suresh.roy@example.com',
    password: 'Password@123',
    age: 36,
    home_state: 'West Bengal',
    current_address: 'Kalamassery, Ernakulam, Kerala',
    gender: 'Male',
    blood_group: 'O+',
    employer_name: 'Meridian Constructions',
    employer_phone_number: '9847000000',
    is_vaccinated: true,
    spoken_language: 'Bengali',
    previous_health_issues: 'Mild Hypertension',
  });

  console.log('1. Worker DB Registration:', workerReg.status === 201 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   Response:', JSON.stringify(workerReg.data));

  // Test 2: Login with correct password
  const workerLoginOk = await post('/auth/worker/login', {
    identifier: '14-9988-7766-5544',
    password: 'Password@123',
  });

  console.log('\n2. Worker DB Login (Correct Password):', workerLoginOk.status === 200 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   Worker ID in DB:', workerLoginOk.data?.data?.user?.id);

  // Test 3: Login with wrong password
  const workerLoginBad = await post('/auth/worker/login', {
    identifier: '14-9988-7766-5544',
    password: 'WrongPassword!',
  });

  console.log('\n3. Worker DB Login (Wrong Password Rejected):', workerLoginBad.status === 401 ? '✅ REJECTED AS EXPECTED' : '❌ FAILED');

  // Test 4: Register Doctor in DB
  const docReg = await post('/auth/doctor/register', {
    full_name: 'Dr. Rajesh Nair',
    email: 'dr.nair@kerala.gov.in',
    password: 'DoctorPassword@123',
    registration_number: 'KL-MED-9912',
    specialisation: 'Pulmonology',
    hospital_name: 'District Hospital Kozhikode',
    district: 'Kozhikode',
  });

  console.log('\n4. Doctor DB Registration:', docReg.status === 201 ? '✅ SUCCESS' : '❌ FAILED');

  // Test 5: Login Doctor
  const docLogin = await post('/auth/doctor/login', {
    email: 'dr.nair@kerala.gov.in',
    password: 'DoctorPassword@123',
  });

  console.log('\n5. Doctor DB Login:', docLogin.status === 200 ? '✅ SUCCESS' : '❌ FAILED');
}

testRealDBAuth().catch(console.error);
