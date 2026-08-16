import { Router } from 'express';

import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  getBookingOptions,
  getDepartments,
  getDoctorByEmail,
  getDoctors,
  getHospitals,
  getWorkerByMobile,
} from '../controllers/directory.controller.js';
import {
  doctorListQuerySchema,
  doctorLookupQuerySchema,
  hospitalIdParamSchema,
  hospitalListQuerySchema,
  workerLookupQuerySchema,
} from '../validation/directory.schemas.js';

/** Thin: path + middleware + controller reference (CLAUDE.md §5). */
const router = Router();

router.get('/directory/booking-options', asyncHandler(getBookingOptions));

router.get(
  '/directory/hospitals',
  validate('query', hospitalListQuerySchema),
  asyncHandler(getHospitals)
);

router.get(
  '/directory/hospitals/:hospitalId/departments',
  validate('params', hospitalIdParamSchema),
  asyncHandler(getDepartments)
);

router.get(
  '/directory/doctors',
  validate('query', doctorListQuerySchema),
  asyncHandler(getDoctors)
);

/**
 * Identity lookups for the prototype sign-in screens. These issue no token and
 * verify no credential — they attach an existing database row to the in-memory
 * session so that a booking can name a real beneficiary and a real
 * practitioner. Phase 6 replaces the caller with a real /auth flow.
 */
router.get(
  '/directory/workers/lookup',
  validate('query', workerLookupQuerySchema),
  asyncHandler(getWorkerByMobile)
);

router.get(
  '/directory/doctors/lookup',
  validate('query', doctorLookupQuerySchema),
  asyncHandler(getDoctorByEmail)
);

export default router;
