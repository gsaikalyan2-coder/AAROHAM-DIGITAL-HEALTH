/**
 * Appointment controller — request in, service call, envelope out.
 * No SQL and no scheduling rules live here (CLAUDE.md §5).
 */

import { created, ok } from '../utils/apiResponse.js';
import {
  bookAppointment,
  cancelAppointment,
  getAvailability,
  listForDoctor,
  listForWorker,
  rescheduleAppointment,
} from '../services/appointment.service.js';

export async function getAvailabilityHandler(req, res) {
  const { doctorId, date, durationMinutes } = req.validatedQuery;
  const availability = await getAvailability({ doctorId, date, durationMinutes });
  return ok(
    res,
    availability,
    `${availability.availableCount} of ${availability.slots.length} slots free`
  );
}

/**
 * One endpoint, two portals. The worker portal passes its MHID and receives its
 * own bookings; the doctor portal passes its practitioner id and receives the
 * bookings made against it — including the ones a worker created a moment ago,
 * which is the connection the feature exists to make.
 */
export async function listAppointments(req, res) {
  const { mhid, doctorId, date, from, status, includeCancelled } = req.validatedQuery;

  const appointments = mhid
    ? await listForWorker({ mhid, status })
    : await listForDoctor({
        doctorId,
        date,
        from,
        includeCancelled: includeCancelled ?? true,
      });

  return ok(res, { appointments }, `${appointments.length} appointments`);
}

export async function createAppointment(req, res) {
  const appointment = await bookAppointment({ ...req.body, bookedByRole: 'worker' });
  return created(
    res,
    { appointment },
    `Appointment confirmed for ${appointment.date} at ${appointment.time}.`
  );
}

export async function cancelAppointmentHandler(req, res) {
  const appointment = await cancelAppointment({
    id: req.params.id,
    mhid: req.body.mhid,
    reason: req.body.reason,
  });
  return ok(res, { appointment }, 'Appointment cancelled.');
}

export async function rescheduleAppointmentHandler(req, res) {
  const appointment = await rescheduleAppointment({
    id: req.params.id,
    mhid: req.body.mhid,
    date: req.body.date,
    time: req.body.time,
    consultationType: req.body.consultationType,
  });
  return ok(
    res,
    { appointment },
    `Appointment moved to ${appointment.date} at ${appointment.time}.`
  );
}
