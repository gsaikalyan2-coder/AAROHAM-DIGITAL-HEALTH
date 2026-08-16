/**
 * Directory controller — parses the request, calls the service, shapes the
 * response. No SQL, no business rules (CLAUDE.md §5).
 */

import { ok } from '../utils/apiResponse.js';
import { bookingOptions } from '../config/scheduling.js';
import {
  findDoctorByEmail,
  findWorkerByMobile,
  listDepartments,
  listDoctors,
  listHospitals,
} from '../services/directory.service.js';

export async function getBookingOptions(req, res) {
  return ok(res, bookingOptions(), 'Booking options');
}

export async function getHospitals(req, res) {
  const { district } = req.validatedQuery;
  const hospitals = await listHospitals({ district });
  return ok(res, { hospitals }, `${hospitals.length} participating facilities`);
}

export async function getDepartments(req, res) {
  const departments = await listDepartments(req.params.hospitalId);
  return ok(res, { departments }, `${departments.length} departments`);
}

export async function getDoctors(req, res) {
  const { hospitalId, department } = req.validatedQuery;
  const doctors = await listDoctors({ hospitalId, department });
  return ok(res, { doctors }, `${doctors.length} practitioners`);
}

export async function getWorkerByMobile(req, res) {
  const worker = await findWorkerByMobile(req.validatedQuery.mobile);
  return ok(res, { worker }, 'Beneficiary resolved');
}

export async function getDoctorByEmail(req, res) {
  const doctor = await findDoctorByEmail(req.validatedQuery.email);
  return ok(res, { doctor }, 'Practitioner resolved');
}
