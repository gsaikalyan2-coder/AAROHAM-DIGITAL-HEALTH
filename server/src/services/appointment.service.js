/**
 * ============================================================================
 * Appointment service
 * ----------------------------------------------------------------------------
 * Booking, availability, cancellation and rescheduling. The only layer holding
 * SQL (CLAUDE.md §5).
 *
 * Two rules govern everything below.
 *
 * 1. The clock is Asia/Kolkata; the storage is TIMESTAMPTZ. A slot is chosen as
 *    a wall-clock date and time by a person standing in Kerala, so the instant
 *    is composed in the database with `(date + time) AT TIME ZONE 'Asia/Kolkata'`
 *    rather than in Node, whose process timezone is not ours to assume. Reads
 *    convert back the same way, so the practitioner and the worker always see
 *    the same 10:30.
 *
 * 2. Availability is advisory; the constraint is authoritative. Free slots are
 *    computed from a read, and a second worker can book between that read and
 *    the write. The EXCLUDE constraints from migration 007 refuse the loser,
 *    and `translateConstraintViolation` turns that refusal into SLOT_TAKEN.
 * ============================================================================
 */

import { query } from '../config/db.js';
import {
  CLINIC_DAY,
  CLINIC_TIME_ZONE,
  CONSULTATION_TYPE_BY_CODE,
  MAX_ADVANCE_DAYS,
  WORKER_MUTABLE_STATUSES,
  candidateStartTimes,
  toClock,
  toMinutes,
} from '../config/scheduling.js';
import { ServiceError } from './directory.service.js';

/** Columns every appointment read returns, already converted to clinic-local time. */
const APPOINTMENT_SELECT = `
  SELECT a.id,
         a.status,
         a.department,
         a.reason,
         a.duration_minutes,
         a.consultation_type,
         a.cancellation_reason,
         a.created_at,
         to_char(a.scheduled_at AT TIME ZONE '${CLINIC_TIME_ZONE}', 'YYYY-MM-DD') AS local_date,
         to_char(a.scheduled_at AT TIME ZONE '${CLINIC_TIME_ZONE}', 'HH24:MI')    AS local_time,
         to_char(a.ends_at      AT TIME ZONE '${CLINIC_TIME_ZONE}', 'HH24:MI')    AS local_end_time,
         a.scheduled_at,
         a.ends_at,
         a.rescheduled_from,
         w.id       AS worker_id,
         w.mhid     AS worker_mhid,
         w.full_name AS worker_name,
         w.mobile   AS worker_mobile,
         w.gender   AS worker_gender,
         w.date_of_birth AS worker_dob,
         d.id       AS doctor_id,
         d.full_name AS doctor_name,
         h.id       AS hospital_id,
         h.name     AS hospital_name,
         h.district AS hospital_district
    FROM appointments a
    JOIN workers  w ON w.id = a.worker_id
    JOIN hospitals h ON h.id = a.hospital_id
    LEFT JOIN doctors d ON d.id = a.doctor_id
`;

function shape(r) {
  const type = CONSULTATION_TYPE_BY_CODE[r.consultation_type];
  return {
    id: r.id,
    status: r.status,
    date: r.local_date,
    time: r.local_time,
    endTime: r.local_end_time,
    scheduledAt: r.scheduled_at,
    endsAt: r.ends_at,
    durationMinutes: r.duration_minutes,
    consultationType: r.consultation_type,
    consultationLabel: type ? type.label : 'Consultation',
    department: r.department,
    reason: r.reason,
    cancellationReason: r.cancellation_reason,
    wasRescheduled: Boolean(r.rescheduled_from),
    createdAt: r.created_at,
    worker: {
      id: r.worker_id,
      mhid: r.worker_mhid,
      name: r.worker_name,
      mobile: r.worker_mobile,
      gender: r.worker_gender,
      age: ageFrom(r.worker_dob),
    },
    doctor: r.doctor_id ? { id: r.doctor_id, name: r.doctor_name } : null,
    hospital: { id: r.hospital_id, name: r.hospital_name, district: r.hospital_district },
  };
}

function ageFrom(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const before =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (before) age -= 1;
  return age >= 0 ? age : null;
}

/* -------------------------------------------------------------------------- */
/* Calendar rules                                                             */
/* -------------------------------------------------------------------------- */

/** Today's date in clinic-local terms, as 'YYYY-MM-DD'. Never `new Date()` in Node. */
async function clinicToday() {
  const { rows } = await query(
    `SELECT to_char(now() AT TIME ZONE '${CLINIC_TIME_ZONE}', 'YYYY-MM-DD') AS today,
            to_char(now() AT TIME ZONE '${CLINIC_TIME_ZONE}', 'HH24:MI')    AS now_time`
  );
  return rows[0];
}

function daysBetween(fromIso, toIso) {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Day-of-week for an ISO date, 0 = Sunday, computed without local-timezone drift. */
function weekdayOf(iso) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

/**
 * Rejects a date the clinic cannot serve, before any slot work is done.
 * Returns the clinic clock so the caller can also suppress today's past slots.
 */
async function assertBookableDate(dateIso) {
  const { today, now_time: nowTime } = await clinicToday();

  if (daysBetween(today, dateIso) < 0) {
    throw new ServiceError(422, 'DATE_IN_PAST', 'Appointments cannot be booked for a past date.');
  }
  if (daysBetween(today, dateIso) > MAX_ADVANCE_DAYS) {
    throw new ServiceError(
      422,
      'DATE_TOO_FAR',
      `Appointments can be booked up to ${MAX_ADVANCE_DAYS} days ahead.`
    );
  }
  if (CLINIC_DAY.closedWeekdays.includes(weekdayOf(dateIso))) {
    throw new ServiceError(
      422,
      'CLINIC_CLOSED',
      'Outpatient services do not run on this day.'
    );
  }

  return { today, nowTime };
}

/* -------------------------------------------------------------------------- */
/* Availability                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Every start time the practitioner can take on `date` for a visit of
 * `durationMinutes`, with the taken ones marked and given a reason.
 *
 * Unavailable slots are returned rather than filtered out: a worker looking at
 * a wall of greyed-out times understands that the clinic is busy, whereas a
 * short list of three times reads as an arbitrary restriction.
 */
export async function getAvailability({ doctorId, date, durationMinutes }) {
  const { today, nowTime } = await assertBookableDate(date);

  const { rows: doctorRows } = await query(
    `SELECT id FROM doctors WHERE id = $1 AND deleted_at IS NULL`,
    [doctorId]
  );
  if (!doctorRows.length) {
    throw new ServiceError(404, 'DOCTOR_NOT_FOUND', 'No such practitioner.');
  }

  const { rows: booked } = await query(
    `SELECT to_char(scheduled_at AT TIME ZONE '${CLINIC_TIME_ZONE}', 'HH24:MI') AS starts,
            to_char(ends_at      AT TIME ZONE '${CLINIC_TIME_ZONE}', 'HH24:MI') AS ends
       FROM appointments
      WHERE doctor_id = $1
        AND status <> 'Cancelled'
        AND (scheduled_at AT TIME ZONE '${CLINIC_TIME_ZONE}')::date = $2::date`,
    [doctorId, date]
  );

  const taken = booked.map((b) => ({ from: toMinutes(b.starts), to: toMinutes(b.ends) }));
  const isToday = date === today;
  const nowMinutes = toMinutes(nowTime);

  const slots = candidateStartTimes(durationMinutes).map((start) => {
    const from = toMinutes(start);
    const to = from + durationMinutes;

    let reason = null;
    if (isToday && from <= nowMinutes) reason = 'Past';
    else if (taken.some((b) => from < b.to && to > b.from)) reason = 'Booked';

    return {
      start,
      end: toClock(to),
      durationMinutes,
      available: reason === null,
      unavailableReason: reason,
    };
  });

  return {
    doctorId,
    date,
    durationMinutes,
    timeZone: CLINIC_TIME_ZONE,
    slots,
    availableCount: slots.filter((s) => s.available).length,
  };
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

/** A worker's own appointments, most recent first. */
export async function listForWorker({ mhid, status } = {}) {
  const { rows } = await query(
    `${APPOINTMENT_SELECT}
      WHERE w.mhid = $1
        AND w.deleted_at IS NULL
        AND ($2::text IS NULL OR a.status = $2)
      ORDER BY a.scheduled_at DESC`,
    [mhid, status ?? null]
  );
  return rows.map(shape);
}

/**
 * A practitioner's list. `date` narrows it to one clinic day, which is what the
 * doctor portal's "today" view asks for; without it the whole forward book is
 * returned, ordered chronologically.
 */
export async function listForDoctor({ doctorId, date, from, includeCancelled = true } = {}) {
  const { rows } = await query(
    `${APPOINTMENT_SELECT}
      WHERE a.doctor_id = $1
        AND ($2::date IS NULL OR (a.scheduled_at AT TIME ZONE '${CLINIC_TIME_ZONE}')::date = $2::date)
        AND ($3::date IS NULL OR (a.scheduled_at AT TIME ZONE '${CLINIC_TIME_ZONE}')::date >= $3::date)
        AND ($4::boolean OR a.status <> 'Cancelled')
      ORDER BY a.scheduled_at ASC`,
    [doctorId, date ?? null, from ?? null, includeCancelled]
  );
  return rows.map(shape);
}

async function getById(id) {
  const { rows } = await query(`${APPOINTMENT_SELECT} WHERE a.id = $1`, [id]);
  if (!rows.length) throw new ServiceError(404, 'APPOINTMENT_NOT_FOUND', 'No such appointment.');
  return shape(rows[0]);
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Books a visit.
 *
 * The practitioner must actually work at the chosen facility in the chosen
 * department. The client walks that tree in order, so a mismatch means the
 * request was assembled somewhere other than the wizard — which is exactly the
 * case worth refusing.
 */
export async function bookAppointment(input) {
  const {
    mhid,
    hospitalId,
    doctorId,
    department,
    date,
    time,
    consultationType,
    reason,
    bookedByRole = 'worker',
  } = input;

  const type = CONSULTATION_TYPE_BY_CODE[consultationType];
  if (!type) {
    throw new ServiceError(422, 'UNKNOWN_CONSULTATION_TYPE', 'That consultation type is not offered.');
  }

  await assertBookableDate(date);

  const worker = await requireWorker(mhid);
  const doctor = await requirePostedDoctor({ doctorId, hospitalId, department });

  // The slot must still be free at the moment of writing; the EXCLUDE
  // constraint has the final say, but checking first turns the common case
  // into a clear message instead of a constraint name.
  const availability = await getAvailability({
    doctorId,
    date,
    durationMinutes: type.durationMinutes,
  });
  const slot = availability.slots.find((s) => s.start === time);
  if (!slot) {
    throw new ServiceError(
      422,
      'SLOT_NOT_OFFERED',
      'That start time is not offered for the selected consultation length.'
    );
  }
  if (!slot.available) {
    throw new ServiceError(
      409,
      'SLOT_TAKEN',
      slot.unavailableReason === 'Past'
        ? 'That time has already passed today.'
        : 'That slot has just been taken. Choose another time.'
    );
  }

  try {
    const { rows } = await query(
      `INSERT INTO appointments
         (worker_id, doctor_id, hospital_id, scheduled_at, duration_minutes,
          consultation_type, department, reason, status, booked_by_role)
       VALUES
         ($1, $2, $3, ($4::date + $5::time) AT TIME ZONE '${CLINIC_TIME_ZONE}', $6,
          $7, $8, $9, 'Scheduled', $10::user_role)
       RETURNING id`,
      [
        worker.id,
        doctor.id,
        hospitalId,
        date,
        time,
        type.durationMinutes,
        type.code,
        department,
        reason?.trim() || null,
        bookedByRole,
      ]
    );
    return getById(rows[0].id);
  } catch (err) {
    throw translateConstraintViolation(err);
  }
}

/**
 * Cancels a booking. The row is kept and its status changed — the practitioner's
 * day must show that a slot was released rather than silently losing the entry,
 * and a health-service record is never destroyed (CLAUDE.md §6).
 */
export async function cancelAppointment({ id, mhid, reason }) {
  const existing = await getById(id);
  assertOwnedBy(existing, mhid);

  if (existing.status === 'Cancelled') {
    throw new ServiceError(409, 'ALREADY_CANCELLED', 'This appointment is already cancelled.');
  }
  if (!WORKER_MUTABLE_STATUSES.includes(existing.status)) {
    throw new ServiceError(
      409,
      'NOT_CANCELLABLE',
      `An appointment marked ${existing.status} can no longer be cancelled.`
    );
  }

  await query(
    `UPDATE appointments
        SET status = 'Cancelled',
            cancelled_at = now(),
            cancellation_reason = $2
      WHERE id = $1`,
    [id, reason?.trim() || 'Cancelled by the worker']
  );

  return getById(id);
}

/**
 * Moves a booking to a new slot, optionally changing the consultation length.
 * The previous instant is recorded on the row, so the practitioner can see that
 * the visit moved rather than that a new one appeared.
 */
export async function rescheduleAppointment({ id, mhid, date, time, consultationType }) {
  const existing = await getById(id);
  assertOwnedBy(existing, mhid);

  if (!WORKER_MUTABLE_STATUSES.includes(existing.status)) {
    throw new ServiceError(
      409,
      'NOT_RESCHEDULABLE',
      `An appointment marked ${existing.status} can no longer be moved.`
    );
  }
  if (!existing.doctor) {
    throw new ServiceError(
      409,
      'NO_DOCTOR_ASSIGNED',
      'This appointment has no practitioner assigned and cannot be moved from the portal.'
    );
  }

  const type = CONSULTATION_TYPE_BY_CODE[consultationType || existing.consultationType];
  if (!type) {
    throw new ServiceError(422, 'UNKNOWN_CONSULTATION_TYPE', 'That consultation type is not offered.');
  }

  await assertBookableDate(date);

  const availability = await getAvailability({
    doctorId: existing.doctor.id,
    date,
    durationMinutes: type.durationMinutes,
  });
  const slot = availability.slots.find((s) => s.start === time);

  if (!slot) {
    throw new ServiceError(
      422,
      'SLOT_NOT_OFFERED',
      'That start time is not offered for the selected consultation length.'
    );
  }
  // The appointment's own current slot reads as "Booked" against itself; moving
  // to the time it already holds is a no-op rather than a conflict.
  const isOwnSlot = date === existing.date && time === existing.time;
  if (!slot.available && !isOwnSlot) {
    throw new ServiceError(
      409,
      'SLOT_TAKEN',
      slot.unavailableReason === 'Past'
        ? 'That time has already passed today.'
        : 'That slot has just been taken. Choose another time.'
    );
  }

  try {
    await query(
      `UPDATE appointments
          SET rescheduled_from = scheduled_at,
              scheduled_at = ($2::date + $3::time) AT TIME ZONE '${CLINIC_TIME_ZONE}',
              duration_minutes = $4,
              consultation_type = $5,
              status = 'Scheduled'
        WHERE id = $1`,
      [id, date, time, type.durationMinutes, type.code]
    );
  } catch (err) {
    throw translateConstraintViolation(err);
  }

  return getById(id);
}

/* -------------------------------------------------------------------------- */
/* Guards                                                                     */
/* -------------------------------------------------------------------------- */

async function requireWorker(mhid) {
  const { rows } = await query(
    `SELECT id, mhid FROM workers WHERE mhid = $1 AND deleted_at IS NULL`,
    [mhid]
  );
  if (!rows.length) {
    throw new ServiceError(404, 'WORKER_NOT_FOUND', 'No beneficiary is registered against this MHID.');
  }
  return rows[0];
}

async function requirePostedDoctor({ doctorId, hospitalId, department }) {
  const { rows } = await query(
    `SELECT d.id
       FROM doctors d
      WHERE d.id = $1
        AND d.hospital_id = $2
        AND coalesce(d.specialisation, 'General Medicine') = $3
        AND d.deleted_at IS NULL`,
    [doctorId, hospitalId, department]
  );
  if (!rows.length) {
    throw new ServiceError(
      422,
      'DOCTOR_NOT_AT_FACILITY',
      'That practitioner does not hold this department at the selected facility.'
    );
  }
  return rows[0];
}

/**
 * Until Phase 6 issues a token there is no authenticated subject, so ownership
 * is asserted against the MHID the caller supplies. This is a consistency check,
 * not an authorisation check, and is documented as such in
 * docs/APPOINTMENT_BOOKING.md — it stops a mistyped identifier from mutating
 * someone else's booking; it does not stop a determined caller.
 */
function assertOwnedBy(appointment, mhid) {
  if (appointment.worker.mhid !== mhid) {
    throw new ServiceError(
      403,
      'NOT_YOUR_APPOINTMENT',
      'This appointment belongs to a different beneficiary.'
    );
  }
}

/** Turns the database's overlap refusals into the API's vocabulary. */
function translateConstraintViolation(err) {
  if (err.code !== '23P01') return err; // exclusion_violation

  if (err.constraint === 'appointments_no_doctor_overlap') {
    return new ServiceError(
      409,
      'SLOT_TAKEN',
      'That slot has just been taken. Choose another time.'
    );
  }
  if (err.constraint === 'appointments_no_worker_overlap') {
    return new ServiceError(
      409,
      'WORKER_DOUBLE_BOOKED',
      'You already have an appointment that overlaps this time.'
    );
  }
  return err;
}
