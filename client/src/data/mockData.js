import { CSV_RAW_DATA, searchableWorkersCSV } from './csvDataset.js';

export const demoWorker = {
  mhid: '14-1000-2000-3000',
  abhaId: '14-1000-2000-3000',
  name: CSV_RAW_DATA[0].name,
  age: 28,
  gender: CSV_RAW_DATA[0].gender,
  bloodGroup: 'B+',
  mobile: CSV_RAW_DATA[0].phone,
  nativeState: CSV_RAW_DATA[0].state,
  nativeDistrict: 'State Division',
  currentDistrict: 'Ernakulam',
  address: 'Kerala Worksite Camp, Ernakulam',
  employer: `${CSV_RAW_DATA[0].occupation} Works Division`,
  occupation: CSV_RAW_DATA[0].occupation,
  emergencyContact: `Verified Contact · ${CSV_RAW_DATA[0].phone}`,
  registeredOn: '2026-08-05',
  allergies: ['Penicillin'],
  chronicConditions: [CSV_RAW_DATA[0].chronic || 'Hypertension'],
  currentMedications: [CSV_RAW_DATA[0].med || 'Amlodipine 5mg'],
};

export const workerStats = [
  { label: 'Consultations', value: 3, sub: 'Govt. Hospital Network' },
  { label: 'Active Prescriptions', value: 2, sub: 'Verified by Doctor' },
  { label: 'Upcoming Appointment', value: '12 Aug', sub: 'General Medicine, EKM' },
  { label: 'Vaccinations', value: 'Complete', sub: 'Covishield & Booster' },
];

export const consultations = CSV_RAW_DATA.slice(0, 4).map((c, i) => ({
  id: `c${i + 1}`,
  date: '2026-08-05',
  hospital: 'Govt. General Hospital, Ernakulam',
  district: 'Ernakulam',
  doctor: 'Dr. Anitha Menon',
  department: 'General Medicine',
  diagnosis: c.chronic !== 'None' ? c.chronic : 'Routine Preventive Screening',
  status: 'Verified in DB',
}));

export const prescriptions = [
  { id: 'p1', date: '2026-08-05', medicine: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '90 days', doctor: 'Dr. Anitha Menon', active: true },
  { id: 'p2', date: '2026-08-05', medicine: 'Multivitamin & Zinc', dosage: '1 tablet', frequency: 'At night', duration: '30 days', doctor: 'Dr. Anitha Menon', active: true },
];

export const appointments = [
  { id: 'a1', date: '2026-08-12', time: '10:30', hospital: 'Govt. General Hospital, Ernakulam', doctor: 'Dr. Anitha Menon', department: 'General Medicine', status: 'Confirmed' },
  { id: 'a2', date: '2026-09-05', time: '11:15', hospital: 'Govt. General Hospital, Ernakulam', doctor: 'Dr. Anitha Menon', department: 'General Medicine', status: 'Scheduled' },
];

export const vaccinations = [
  { id: 'v1', vaccine: 'COVID-19 (Covishield)', dose: 'Dose 2', date: '2026-08-05', nextDue: '—', status: 'Complete' },
  { id: 'v2', vaccine: 'Hepatitis B', dose: 'Dose 1', date: '2026-08-05', nextDue: '—', status: 'Complete' },
];

export const mentalHealthScreenings = [
  { id: 'm1', date: '2026-08-05', instrument: 'PHQ-9', score: 4, severity: 'Minimal', counsellor: 'Ms. Deepa Thomas', followUp: '—' },
];

export const recommendedSchemes = [
  { id: 's1', name: 'Awaz Health Insurance Scheme', authority: 'Government of Kerala', benefit: '₹2,00,000 medical cover for registered inter-state workers', reason: 'Registered inter-state worker in Kerala' },
  { id: 's2', name: 'Ayushman Bharat PM-JAY', authority: 'Government of India', benefit: '₹5,00,000 per family per year, portable across states', reason: 'Eligible occupation category · inter-state worker' },
];

export const accessLog = [
  { id: 'al1', date: '2026-08-05 12:36', actor: 'Dr. Anitha Menon', hospital: 'GGH Ernakulam', action: 'Viewed health record' },
  { id: 'al2', date: '2026-08-05 12:40', actor: 'Dr. Anitha Menon', hospital: 'GGH Ernakulam', action: 'Added consultation' },
];

/* ---------------------------- Doctor portal ---------------------------- */

export const doctorStats = [
  { label: 'Registered Patients', value: CSV_RAW_DATA.length, sub: 'Real records from data.csv' },
  { label: 'Patients Today', value: 14, sub: 'Scheduled & Queue' },
  { label: 'Vaccinated Count', value: CSV_RAW_DATA.filter(r => r.covid === 'Yes').length, sub: 'COVID & Routine' },
  { label: 'Chronic Alerts', value: CSV_RAW_DATA.filter(r => r.chronic !== 'None').length, sub: 'Hypertension / Diabetes' },
];

export const doctorQueue = CSV_RAW_DATA.slice(0, 5).map((q, idx) => ({
  id: `q${idx + 1}`,
  time: `09:${30 + idx * 20}`,
  mhid: searchableWorkersCSV[idx].mhid,
  name: q.name,
  age: q.age,
  reason: q.chronic !== 'None' ? `${q.chronic} evaluation` : 'Occupational health check',
  status: idx === 0 ? 'In consultation' : idx < 3 ? 'Waiting' : 'Scheduled',
}));

export const searchableWorkers = searchableWorkersCSV;

/* --------------------------- Government admin --------------------------- */

export const adminStats = [
  { label: 'Registered Workers (CSV)', value: CSV_RAW_DATA.length, sub: 'Data.csv Survey Dataset' },
  { label: 'Empanelled Hospitals', value: 148, sub: 'Govt. & Empanelled Network' },
  { label: 'Vaccination Rate', value: `${Math.round((CSV_RAW_DATA.filter(r => r.covid === 'Yes').length / CSV_RAW_DATA.length) * 100)}%`, sub: 'Real survey dataset' },
  { label: 'Chronic Condition Rate', value: `${Math.round((CSV_RAW_DATA.filter(r => r.chronic !== 'None').length / CSV_RAW_DATA.length) * 100)}%`, sub: 'Diabetes & Hypertension' },
];

export const districtStats = [
  { district: 'Tamil Nadu (Native)', workers: CSV_RAW_DATA.filter(r => r.state.includes('Tamil')).length, hospitals: 45, visits30d: 420, coverage: '88%' },
  { district: 'Telangana (Native)', workers: CSV_RAW_DATA.filter(r => r.state.includes('Telangana')).length, hospitals: 28, visits30d: 290, coverage: '85%' },
  { district: 'Andhra Pradesh (Native)', workers: CSV_RAW_DATA.filter(r => r.state.includes('Andhra')).length, hospitals: 18, visits30d: 150, coverage: '82%' },
  { district: 'Kerala (Host)', workers: CSV_RAW_DATA.filter(r => r.state.includes('Kerala')).length, hospitals: 32, visits30d: 380, coverage: '92%' },
];

export const diseaseTrends = [
  { condition: 'Hypertension', cases: CSV_RAW_DATA.filter(r => r.chronic.includes('Hypertension')).length, share: 45.0, change: 'Recorded in CSV' },
  { condition: 'Diabetes', cases: CSV_RAW_DATA.filter(r => r.chronic.includes('Diabetes')).length, share: 35.0, change: 'Recorded in CSV' },
  { condition: 'Asthma', cases: CSV_RAW_DATA.filter(r => r.chronic.includes('Asthma')).length, share: 15.0, change: 'Recorded in CSV' },
  { condition: 'Obesity & Low BP', cases: CSV_RAW_DATA.filter(r => r.chronic.includes('Obesity') || r.chronic.includes('Low BP')).length, share: 5.0, change: 'Recorded in CSV' },
];

export const hospitals = [
  { id: 'h1', name: 'Govt. General Hospital, Ernakulam', district: 'Ernakulam', type: 'Government', doctors: 84, status: 'Active' },
  { id: 'h2', name: 'District Hospital, Kozhikode', district: 'Kozhikode', type: 'Government', doctors: 61, status: 'Active' },
  { id: 'h3', name: 'Taluk Hospital, Perumbavoor', district: 'Ernakulam', type: 'Government', doctors: 35, status: 'Active' },
];

export const importHistory = [
  { id: 'i1', file: 'data.csv', rows: 49, imported: 49, failed: 0, date: '2026-08-05', status: 'Completed' },
];

export const auditLogs = CSV_RAW_DATA.slice(0, 5).map((l, idx) => ({
  id: `g${idx + 1}`,
  time: `2026-08-05 12:${30 + idx * 5}`,
  actor: 'Dr. Anitha Menon',
  role: 'Doctor',
  action: 'READ health_record',
  entity: searchableWorkersCSV[idx].mhid,
  ip: `10.4.12.${80 + idx}`,
}));
