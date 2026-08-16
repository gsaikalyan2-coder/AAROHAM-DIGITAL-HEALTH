/**
 * ============================================================================
 * Directory service
 * ----------------------------------------------------------------------------
 * The facility / department / practitioner tree the booking wizard walks, plus
 * the two identity lookups the prototype sign-in screens use to attach a real
 * database row to an in-memory session.
 *
 * SQL lives here and only here (CLAUDE.md §5).
 * ============================================================================
 */

import { query } from '../config/db.js';

/** A service-layer error that the controller maps straight onto the envelope. */
export class ServiceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Participating facilities, optionally narrowed to one district.
 * A worker in Ernakulam is shown Ernakulam first but is not confined to it —
 * continuity of care across districts is the point of the system.
 */
export async function listHospitals({ district } = {}) {
  const { rows } = await query(
    `SELECT h.id,
            h.name,
            h.district,
            h.type,
            h.address,
            h.contact,
            count(d.id) FILTER (WHERE d.deleted_at IS NULL)::int AS doctor_count
       FROM hospitals h
       LEFT JOIN doctors d ON d.hospital_id = h.id
      WHERE h.deleted_at IS NULL
        AND h.is_active
        AND ($1::text IS NULL OR h.district = $1)
      GROUP BY h.id
      HAVING count(d.id) FILTER (WHERE d.deleted_at IS NULL) > 0
      ORDER BY h.district, h.name`,
    [district ?? null]
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    district: r.district,
    type: r.type,
    address: r.address,
    contact: r.contact,
    doctorCount: r.doctor_count,
  }));
}

/**
 * Departments offered by a facility.
 *
 * There is no `departments` table, and inventing one would mean maintaining a
 * list that can disagree with the practitioners actually posted to the
 * facility. The department list is therefore derived: a facility offers a
 * department precisely when a practitioner of that specialisation works there.
 * An empty department cannot be booked because it cannot appear.
 */
export async function listDepartments(hospitalId) {
  await assertHospitalExists(hospitalId);

  const { rows } = await query(
    `SELECT coalesce(d.specialisation, 'General Medicine') AS department,
            count(*)::int                                  AS doctor_count
       FROM doctors d
      WHERE d.hospital_id = $1
        AND d.deleted_at IS NULL
      GROUP BY 1
      ORDER BY 1`,
    [hospitalId]
  );

  return rows.map((r) => ({ department: r.department, doctorCount: r.doctor_count }));
}

/** Practitioners at a facility, optionally within one department. */
export async function listDoctors({ hospitalId, department } = {}) {
  const { rows } = await query(
    `SELECT d.id,
            d.full_name,
            coalesce(d.specialisation, 'General Medicine') AS department,
            d.registration_number,
            d.hospital_id,
            h.name     AS hospital_name,
            h.district AS hospital_district
       FROM doctors d
       JOIN hospitals h ON h.id = d.hospital_id
      WHERE d.deleted_at IS NULL
        AND ($1::uuid IS NULL OR d.hospital_id = $1)
        AND ($2::text IS NULL OR coalesce(d.specialisation, 'General Medicine') = $2)
      ORDER BY d.full_name`,
    [hospitalId ?? null, department ?? null]
  );

  return rows.map(toDoctorIdentity);
}

/**
 * Resolves the beneficiary behind a mobile number.
 *
 * Sign-in is still the prototype OTP screen — this is deliberately NOT
 * authentication and issues no token. It exists so that a session created by
 * that screen refers to a real `workers` row, which is what makes a booking
 * possible at all. Phase 6 replaces the caller, not this function.
 */
export async function findWorkerByMobile(mobile) {
  const digits = String(mobile).replace(/\D/g, '').slice(-10);

  const { rows } = await query(
    `SELECT w.id,
            w.mhid,
            w.full_name,
            w.mobile,
            w.current_district,
            w.gender,
            w.date_of_birth
       FROM workers w
      WHERE w.deleted_at IS NULL
        AND right(regexp_replace(w.mobile, '\\D', '', 'g'), 10) = $1
      LIMIT 1`,
    [digits]
  );

  if (!rows.length) {
    throw new ServiceError(
      404,
      'WORKER_NOT_FOUND',
      'No beneficiary is registered against this mobile number.'
    );
  }

  const w = rows[0];
  return {
    id: w.id,
    mhid: w.mhid,
    fullName: w.full_name,
    mobile: w.mobile,
    currentDistrict: w.current_district,
    gender: w.gender,
    dateOfBirth: w.date_of_birth,
  };
}

/** Resolves the practitioner behind a registered email. Same caveat as above. */
export async function findDoctorByEmail(email) {
  const { rows } = await query(
    `SELECT d.id,
            d.full_name,
            coalesce(d.specialisation, 'General Medicine') AS department,
            d.registration_number,
            d.hospital_id,
            h.name     AS hospital_name,
            h.district AS hospital_district
       FROM doctors d
       JOIN users u    ON u.id = d.user_id
       JOIN hospitals h ON h.id = d.hospital_id
      WHERE d.deleted_at IS NULL
        AND u.deleted_at IS NULL
        AND lower(u.email) = lower($1)
      LIMIT 1`,
    [String(email).trim()]
  );

  if (!rows.length) {
    throw new ServiceError(
      404,
      'DOCTOR_NOT_FOUND',
      'No practitioner is registered against this email address.'
    );
  }

  return toDoctorIdentity(rows[0]);
}

export async function assertHospitalExists(hospitalId) {
  const { rows } = await query(
    `SELECT 1 FROM hospitals WHERE id = $1 AND deleted_at IS NULL AND is_active`,
    [hospitalId]
  );
  if (!rows.length) {
    throw new ServiceError(404, 'HOSPITAL_NOT_FOUND', 'No such participating facility.');
  }
}

function toDoctorIdentity(r) {
  return {
    id: r.id,
    fullName: r.full_name,
    department: r.department,
    registrationNumber: r.registration_number,
    hospitalId: r.hospital_id,
    hospitalName: r.hospital_name,
    hospitalDistrict: r.hospital_district,
  };
}
