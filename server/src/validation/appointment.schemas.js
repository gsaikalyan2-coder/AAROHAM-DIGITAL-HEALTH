/**
 * ============================================================================
 * Appointment request schemas — Zod (CLAUDE.md §3)
 * ----------------------------------------------------------------------------
 * The shape check only. Whether a slot is actually free, whether the clinic is
 * open that day and whether the practitioner holds that department are decided
 * by the service against the database; a schema cannot know any of them.
 *
 * Messages are written to be shown to a beneficiary, because the booking wizard
 * renders `details[].message` verbatim beneath the offending control.
 * ============================================================================
 */

import { z } from 'zod';

import {
  APPOINTMENT_STATUSES,
  CONSULTATION_TYPES,
} from '../config/scheduling.js';

const CONSULTATION_CODES = CONSULTATION_TYPES.map((t) => t.code);

/** KL-<DDD>-<YY>-<NNNNNN>-<C> — see server/src/utils/mhid.js. */
export const mhidSchema = z
  .string()
  .trim()
  .regex(/^KL-[A-Z]{3}-\d{2}-\d{6}-\d$/, 'Enter a valid Migrant Health ID.');

const uuidSchema = z.uuid('Select a valid option.');

const dateSchema = z.iso.date('Choose a date.');

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Choose a start time.');

const departmentSchema = z
  .string()
  .trim()
  .min(2, 'Choose a department.')
  .max(120);

const consultationTypeSchema = z.enum(
  CONSULTATION_CODES,
  'Choose the type of consultation.'
);

export const bookingSchema = z.object({
  mhid: mhidSchema,
  hospitalId: uuidSchema,
  doctorId: uuidSchema,
  department: departmentSchema,
  consultationType: consultationTypeSchema,
  date: dateSchema,
  time: timeSchema,
  reason: z
    .string()
    .trim()
    .min(4, 'Describe the reason for the visit in at least 4 characters.')
    .max(300, 'Keep the reason under 300 characters.'),
});

export const rescheduleSchema = z.object({
  mhid: mhidSchema,
  date: dateSchema,
  time: timeSchema,
  consultationType: consultationTypeSchema.optional(),
});

export const cancelSchema = z.object({
  mhid: mhidSchema,
  reason: z.string().trim().max(300).optional(),
});

export const availabilityQuerySchema = z.object({
  doctorId: uuidSchema,
  date: dateSchema,
  durationMinutes: z.coerce
    .number()
    .int()
    .refine(
      (n) => CONSULTATION_TYPES.some((t) => t.durationMinutes === n),
      'That consultation length is not offered.'
    ),
});

/**
 * The list endpoint serves both portals. Exactly one subject must be named:
 * without that rule an empty query would return every appointment in the
 * system, which is the kind of endpoint that is discovered later rather than
 * designed now.
 */
export const listQuerySchema = z
  .object({
    mhid: mhidSchema.optional(),
    doctorId: uuidSchema.optional(),
    date: dateSchema.optional(),
    from: dateSchema.optional(),
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    includeCancelled: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  })
  .refine((q) => Boolean(q.mhid) !== Boolean(q.doctorId), {
    message: 'Provide exactly one of mhid or doctorId.',
    path: ['mhid'],
  });

export const idParamSchema = z.object({ id: uuidSchema });
