import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  cancelAppointmentHandler,
  createAppointment,
  getAvailabilityHandler,
  listAppointments,
  rescheduleAppointmentHandler,
} from '../controllers/appointment.controller.js';
import {
  availabilityQuerySchema,
  bookingSchema,
  cancelSchema,
  idParamSchema,
  listQuerySchema,
  rescheduleSchema,
} from '../validation/appointment.schemas.js';

/** Thin: path + middleware + controller reference (CLAUDE.md §5). */
const router = Router();

router.get(
  '/appointments/availability',
  validate('query', availabilityQuerySchema),
  asyncHandler(getAvailabilityHandler)
);

router.get(
  '/appointments',
  validate('query', listQuerySchema),
  asyncHandler(listAppointments)
);

router.post(
  '/appointments',
  validate('body', bookingSchema),
  asyncHandler(createAppointment)
);

router.patch(
  '/appointments/:id/cancel',
  validate('params', idParamSchema),
  validate('body', cancelSchema),
  asyncHandler(cancelAppointmentHandler)
);

router.patch(
  '/appointments/:id/reschedule',
  validate('params', idParamSchema),
  validate('body', rescheduleSchema),
  asyncHandler(rescheduleAppointmentHandler)
);

export default router;
