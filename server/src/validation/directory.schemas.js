/**
 * Request schemas for the facility / department / practitioner directory and
 * the two prototype identity lookups. Zod (CLAUDE.md §3).
 */

import { z } from 'zod';

export const hospitalListQuerySchema = z.object({
  district: z.string().trim().min(2).max(60).optional(),
});

export const hospitalIdParamSchema = z.object({
  hospitalId: z.uuid('Select a valid facility.'),
});

export const doctorListQuerySchema = z.object({
  hospitalId: z.uuid('Select a valid facility.').optional(),
  department: z.string().trim().min(2).max(120).optional(),
});

export const workerLookupQuerySchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Enter the 10-digit registered mobile number.'),
});

export const doctorLookupQuerySchema = z.object({
  email: z.email('Enter the registered email address.'),
});
