/**
 * ============================================================================
 * Appointments — client-side data access and presentation helpers
 * ----------------------------------------------------------------------------
 * Every call goes through lib/api.js, which is the only place fetch() is
 * invoked (CLAUDE.md §5). Pages call the functions below; they never build a
 * path or a query string themselves.
 * ============================================================================
 */

import { api } from './api.js';

const qs = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') search.set(k, v);
  });
  const s = search.toString();
  return s ? `?${s}` : '';
};

/* ------------------------------- directory ------------------------------- */

export const getBookingOptions = () => api.get('/directory/booking-options');

export const getHospitals = (district) =>
  api.get(`/directory/hospitals${qs({ district })}`).then((d) => d.hospitals);

export const getDepartments = (hospitalId) =>
  api.get(`/directory/hospitals/${hospitalId}/departments`).then((d) => d.departments);

export const getDoctors = ({ hospitalId, department } = {}) =>
  api.get(`/directory/doctors${qs({ hospitalId, department })}`).then((d) => d.doctors);

export const lookupWorkerByMobile = (mobile) =>
  api.get(`/directory/workers/lookup${qs({ mobile })}`).then((d) => d.worker);

export const lookupDoctorByEmail = (email) =>
  api.get(`/directory/doctors/lookup${qs({ email })}`).then((d) => d.doctor);

/* ----------------------------- appointments ------------------------------ */

export const getAvailability = ({ doctorId, date, durationMinutes }) =>
  api.get(`/appointments/availability${qs({ doctorId, date, durationMinutes })}`);

export const getWorkerAppointments = (mhid) =>
  api.get(`/appointments${qs({ mhid })}`).then((d) => d.appointments);

export const getDoctorAppointments = ({ doctorId, date, from, includeCancelled }) =>
  api
    .get(`/appointments${qs({ doctorId, date, from, includeCancelled })}`)
    .then((d) => d.appointments);

export const bookAppointment = (payload) =>
  api.post('/appointments', payload).then((d) => d.appointment);

export const cancelAppointment = (id, { mhid, reason }) =>
  api.patch(`/appointments/${id}/cancel`, { mhid, reason }).then((d) => d.appointment);

export const rescheduleAppointment = (id, { mhid, date, time, consultationType }) =>
  api
    .patch(`/appointments/${id}/reschedule`, { mhid, date, time, consultationType })
    .then((d) => d.appointment);

/* ------------------------------ presentation ----------------------------- */

/** Tone map shared by both portals so a status never reads differently by role. */
export const STATUS_TONE = {
  Scheduled: 'info',
  Confirmed: 'success',
  Completed: 'neutral',
  Cancelled: 'danger',
};

/** '2026-08-12' -> '12 Aug 2026'. Parsed as UTC so the day never shifts. */
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** '2026-08-12' -> 'Wednesday'. */
export function formatWeekday(iso) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'long',
    timeZone: 'UTC',
  });
}

/** 90 -> '1 hr 30 min'. */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr` : null, m ? `${m} min` : null].filter(Boolean).join(' ');
}

/** Today, in the clinic's terms, as 'YYYY-MM-DD'. */
export function todayIso(timeZone = 'Asia/Kolkata') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Pulls the message for one field out of a VALIDATION_ERROR. */
export function fieldError(err, field) {
  return err?.details?.find((d) => d.field === field)?.message || null;
}
