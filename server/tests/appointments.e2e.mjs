#!/usr/bin/env node
/**
 * ============================================================================
 * Appointment booking — end-to-end API check
 * ----------------------------------------------------------------------------
 * Exercises the directory, availability, booking, cross-portal visibility,
 * rescheduling and cancellation paths against a RUNNING API and a REAL
 * database. It is not a unit test suite: the point is that the constraints in
 * migration 007 and the Asia/Kolkata conversions actually behave as documented,
 * and neither can be observed without PostgreSQL.
 *
 * It writes to the database, so it expects the demonstration seed
 * (`npm run db:seed`) and must never be pointed at an environment holding real
 * records. It books against beneficiaries KL-EKM-26-000001-8 and
 * KL-EKM-26-000006-7 on a weekday roughly ten days ahead.
 *
 * Usage:
 *   npm run dev                          # in one terminal
 *   npm run test:appointments            # in another
 *   API_BASE_URL=http://localhost:5000/api/v1 npm run test:appointments
 *
 * Exits non-zero on the first failing assertion count.
 * ============================================================================
 */

const BASE = process.env.API_BASE_URL || 'http://127.0.0.1:5000/api/v1';
let pass = 0, fail = 0;

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, payload: await res.json() };
}
function check(label, cond, extra = '') {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${extra}`); }
}

const MHID = 'KL-EKM-26-000001-8';        // Ramesh Prasad Yadav (Ernakulam)
const MHID2 = 'KL-EKM-26-000006-7';       // Bikash Roy

console.log('\n1. Directory');
const opts = await call('GET', '/directory/booking-options');
check('booking options expose 3 consultation types', opts.payload.data.consultationTypes.length === 3);
check('durations are 60/120/180',
  JSON.stringify(opts.payload.data.consultationTypes.map(t => t.durationMinutes)) === '[60,120,180]');

const hosp = await call('GET', '/directory/hospitals');
check('hospitals listed', hosp.payload.data.hospitals.length === 5, JSON.stringify(hosp.payload).slice(0,200));
const ekm = hosp.payload.data.hospitals.find(h => h.district === 'Ernakulam');
const kkd = hosp.payload.data.hospitals.find(h => h.district === 'Kozhikode');

const deps = await call('GET', `/directory/hospitals/${kkd.id}/departments`);
check('Kozhikode has 2 departments (Gen Med + Psychiatry)',
  deps.payload.data.departments.length === 2, JSON.stringify(deps.payload.data));

const docs = await call('GET', `/directory/doctors?hospitalId=${ekm.id}&department=General%20Medicine`);
check('doctor listed for hospital+department', docs.payload.data.doctors.length === 1);
const doctor = docs.payload.data.doctors[0];

const lookupW = await call('GET', '/directory/workers/lookup?mobile=9946010001');
check('worker resolved by mobile', lookupW.payload.data.worker.mhid === MHID);
const lookupD = await call('GET', '/directory/doctors/lookup?email=meera.raghavan@ggh-ekm.kerala.gov.in');
check('doctor resolved by email', lookupD.payload.data.doctor.id === doctor.id);
const lookupBad = await call('GET', '/directory/workers/lookup?mobile=9999999999');
check('unknown mobile -> 404 WORKER_NOT_FOUND',
  lookupBad.status === 404 && lookupBad.payload.error.code === 'WORKER_NOT_FOUND');

console.log('\n2. Availability');
// pick a bookable weekday ~10 days out
function nextWeekday(offset) {
  const d = new Date(Date.now() + offset * 86400000);
  while (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
const DATE = nextWeekday(10);
const av1 = await call('GET', `/appointments/availability?doctorId=${doctor.id}&date=${DATE}&durationMinutes=60`);
// 09:00..16:00 on a 30-min grid = 15 starts, less 12:30/13:00/13:30 which run into the break.
check('1 hr grid offers 12 starts (09:00-16:00, break excluded)',
  av1.payload.data.slots.length === 12, `got ${av1.payload.data.slots.length}`);
check('no 1 hr slot starts inside or across the break',
  !av1.payload.data.slots.some(s => ['12:30','13:00','13:30'].includes(s.start)));
const av3 = await call('GET', `/appointments/availability?doctorId=${doctor.id}&date=${DATE}&durationMinutes=180`);
check('3 hr grid excludes anything crossing the 13:00-14:00 break',
  av3.payload.data.slots.every(s => !(s.start < '14:00' && addMin(s.start,180) > '13:00')),
  JSON.stringify(av3.payload.data.slots.map(s=>s.start)));
function addMin(hhmm, m) {
  const [h, mm] = hhmm.split(':').map(Number);
  const t = h*60+mm+m; return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
}
const avPast = await call('GET', `/appointments/availability?doctorId=${doctor.id}&date=2020-01-06&durationMinutes=60`);
check('past date -> 422 DATE_IN_PAST', avPast.status === 422 && avPast.payload.error.code === 'DATE_IN_PAST');
const avSunday = await call('GET', `/appointments/availability?doctorId=${doctor.id}&date=${(()=>{const d=new Date(Date.now()+86400000*3);while(d.getUTCDay()!==0)d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);})()}&durationMinutes=60`);
check('Sunday -> 422 CLINIC_CLOSED', avSunday.status === 422 && avSunday.payload.error.code === 'CLINIC_CLOSED');
const avBadDur = await call('GET', `/appointments/availability?doctorId=${doctor.id}&date=${DATE}&durationMinutes=45`);
check('45 min -> 422 VALIDATION_ERROR', avBadDur.status === 422 && avBadDur.payload.error.code === 'VALIDATION_ERROR');

console.log('\n3. Booking');
const bookBody = {
  mhid: MHID, hospitalId: ekm.id, doctorId: doctor.id, department: 'General Medicine',
  consultationType: 'EXTENDED', date: DATE, time: '10:00', reason: 'Blood pressure review and repeat prescription',
};
const booked = await call('POST', '/appointments', bookBody);
check('booking created (201)', booked.status === 201, JSON.stringify(booked.payload).slice(0,300));
const appt = booked.payload.data.appointment;
check('stored duration is 120 min', appt.durationMinutes === 120);
check('end time computed as 12:00', appt.endTime === '12:00', appt.endTime);
check('status Scheduled', appt.status === 'Scheduled');
check('worker attached', appt.worker.mhid === MHID);
check('doctor attached', appt.doctor.id === doctor.id);

const dup = await call('POST', '/appointments', { ...bookBody, mhid: MHID2, reason: 'Different worker, same slot' });
check('overlapping slot for same doctor -> 409 SLOT_TAKEN',
  dup.status === 409 && dup.payload.error.code === 'SLOT_TAKEN', JSON.stringify(dup.payload));

const partialOverlap = await call('POST', '/appointments', { ...bookBody, mhid: MHID2, time: '11:00', consultationType: 'GENERAL', reason: 'Overlaps the second hour' });
check('partial overlap also refused', partialOverlap.status === 409, JSON.stringify(partialOverlap.payload).slice(0,160));

// The same worker, at a DIFFERENT facility and practitioner, inside their own
// 10:00-12:00 booking. Nothing about the doctor's diary refuses this; only the
// worker-overlap constraint does.
const kkdDocs = await call('GET', `/directory/doctors?hospitalId=${kkd.id}&department=General%20Medicine`);
const otherDoctor = kkdDocs.payload.data.doctors[0];
const selfOverlap = await call('POST', '/appointments', {
  ...bookBody, hospitalId: kkd.id, doctorId: otherDoctor.id, time: '11:00',
  consultationType: 'GENERAL', reason: 'Same worker, elsewhere, at the same hour',
});
check('same worker double-booked across facilities -> 409 WORKER_DOUBLE_BOOKED',
  selfOverlap.status === 409 && selfOverlap.payload.error.code === 'WORKER_DOUBLE_BOOKED',
  JSON.stringify(selfOverlap.payload).slice(0,200));

const adjacent = await call('POST', '/appointments', {
  ...bookBody, hospitalId: kkd.id, doctorId: otherDoctor.id, time: '09:00',
  consultationType: 'GENERAL', reason: 'Adjacent but not overlapping',
});
check('a slot ending exactly when another begins is allowed', adjacent.status === 201,
  JSON.stringify(adjacent.payload).slice(0,160));

const wrongDept = await call('POST', '/appointments', { ...bookBody, time: '14:00', department: 'Psychiatry', reason: 'Doctor does not hold this department' });
check('doctor/department mismatch -> 422 DOCTOR_NOT_AT_FACILITY',
  wrongDept.status === 422 && wrongDept.payload.error.code === 'DOCTOR_NOT_AT_FACILITY', JSON.stringify(wrongDept.payload));

const noReason = await call('POST', '/appointments', { ...bookBody, time: '14:00', reason: 'x' });
check('short reason -> 422 with field detail',
  noReason.status === 422 && noReason.payload.error.details[0].field === 'reason', JSON.stringify(noReason.payload));

const offGrid = await call('POST', '/appointments', { ...bookBody, time: '10:07', reason: 'Off the slot grid entirely' });
check('off-grid time rejected', offGrid.status === 422, JSON.stringify(offGrid.payload).slice(0,160));

console.log('\n4. Cross-module visibility');
const doctorList = await call('GET', `/appointments?doctorId=${doctor.id}&date=${DATE}`);
check("worker's booking appears in the doctor's day",
  doctorList.payload.data.appointments.some(a => a.id === appt.id), JSON.stringify(doctorList.payload).slice(0,200));
const inDoctorView = doctorList.payload.data.appointments.find(a => a.id === appt.id);
check('doctor view carries MHID and patient name',
  inDoctorView.worker.mhid === MHID && inDoctorView.worker.name.length > 0);
check('doctor view carries the reason the worker typed',
  inDoctorView.reason === bookBody.reason);

const workerList = await call('GET', `/appointments?mhid=${MHID}`);
check("booking appears in the worker's list", workerList.payload.data.appointments.some(a => a.id === appt.id));
const both = await call('GET', `/appointments?mhid=${MHID}&doctorId=${doctor.id}`);
check('naming both subjects -> 422', both.status === 422);
const neither = await call('GET', '/appointments');
check('naming neither subject -> 422', neither.status === 422);

console.log('\n5. Reschedule');
const resched = await call('PATCH', `/appointments/${appt.id}/reschedule`,
  { mhid: MHID, date: DATE, time: '14:00', consultationType: 'GENERAL' });
check('reschedule accepted', resched.status === 200, JSON.stringify(resched.payload).slice(0,200));
check('new time stored', resched.payload.data.appointment.time === '14:00');
check('duration changed to 60', resched.payload.data.appointment.durationMinutes === 60);
check('flagged as rescheduled', resched.payload.data.appointment.wasRescheduled === true);

const doctorList2 = await call('GET', `/appointments?doctorId=${doctor.id}&date=${DATE}`);
const moved = doctorList2.payload.data.appointments.find(a => a.id === appt.id);
check("doctor's list reflects the move", moved.time === '14:00', moved && moved.time);

const freed = await call('GET', `/appointments/availability?doctorId=${doctor.id}&date=${DATE}&durationMinutes=60`);
check('vacated 10:00 slot is free again',
  freed.payload.data.slots.find(s => s.start === '10:00').available === true);
check('newly occupied 14:00 slot is marked Booked',
  freed.payload.data.slots.find(s => s.start === '14:00').unavailableReason === 'Booked');

const wrongOwner = await call('PATCH', `/appointments/${appt.id}/reschedule`, { mhid: MHID2, date: DATE, time: '15:00' });
check('another worker cannot move it -> 403', wrongOwner.status === 403 && wrongOwner.payload.error.code === 'NOT_YOUR_APPOINTMENT');

console.log('\n6. Cancellation');
const cancelled = await call('PATCH', `/appointments/${appt.id}/cancel`, { mhid: MHID, reason: 'Returning to native place' });
check('cancel accepted', cancelled.status === 200 && cancelled.payload.data.appointment.status === 'Cancelled');
check('reason recorded', cancelled.payload.data.appointment.cancellationReason === 'Returning to native place');

const doctorList3 = await call('GET', `/appointments?doctorId=${doctor.id}&date=${DATE}`);
check("doctor's list shows it as Cancelled",
  doctorList3.payload.data.appointments.find(a => a.id === appt.id).status === 'Cancelled');
const doctorList4 = await call('GET', `/appointments?doctorId=${doctor.id}&date=${DATE}&includeCancelled=false`);
check('doctor can exclude cancelled entries',
  !doctorList4.payload.data.appointments.some(a => a.id === appt.id));

const afterCancel = await call('GET', `/appointments/availability?doctorId=${doctor.id}&date=${DATE}&durationMinutes=60`);
check('cancelled slot returns to the pool',
  afterCancel.payload.data.slots.find(s => s.start === '14:00').available === true);

const reCancel = await call('PATCH', `/appointments/${appt.id}/cancel`, { mhid: MHID });
check('second cancel -> 409 ALREADY_CANCELLED', reCancel.status === 409 && reCancel.payload.error.code === 'ALREADY_CANCELLED');

const rebook = await call('POST', '/appointments', { ...bookBody, mhid: MHID2, time: '14:00', consultationType: 'GENERAL', reason: 'Booking the slot the cancellation released' });
check('another worker can now take the released slot', rebook.status === 201, JSON.stringify(rebook.payload).slice(0,200));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
