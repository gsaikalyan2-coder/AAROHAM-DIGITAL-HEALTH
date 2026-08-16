/**
 * ============================================================================
 * Request validation middleware
 * ----------------------------------------------------------------------------
 * Zod is the server-side validator (CLAUDE.md §3). One middleware, applied per
 * route, replacing the validated section of the request with the parsed result
 * so controllers receive coerced, trimmed, known-shaped values and never touch
 * `req.body` directly.
 *
 * Failures return the VALIDATION_ERROR envelope with a `details` array of
 * `{ field, message }`, which the booking wizard renders inline against the
 * offending control.
 * ============================================================================
 */

import { fail } from '../utils/apiResponse.js';

/**
 * @param {'body'|'query'|'params'} source
 * @param {import('zod').ZodTypeAny} schema
 */
export function validate(source, schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.') || source,
        message: i.message,
      }));
      return fail(res, 422, 'VALIDATION_ERROR', 'The request could not be accepted.', details);
    }

    // Express 5 makes req.query a getter; assigning to a scratch property keeps
    // the parsed value available without fighting the framework.
    if (source === 'query') req.validatedQuery = result.data;
    else req[source] = result.data;

    return next();
  };
}
