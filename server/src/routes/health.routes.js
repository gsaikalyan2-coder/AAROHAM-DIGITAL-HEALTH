import { Router } from 'express';
import { ok } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { getDatabaseHealth } from '../services/health.service.js';

const router = Router();

/**
 * Liveness and readiness in one response.
 *
 * Phase 5A: the database section now reports the result of an actual query and
 * the number of migrations applied, rather than merely whether a connection
 * string is present. "Configured" is not the same as "reachable", and during a
 * demonstration the difference is the whole question.
 *
 * A database that is unreachable does not fail the request — the API itself is
 * still up, and an operator needs the diagnostic more than an error page.
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const database = await getDatabaseHealth();

    return ok(
      res,
      {
        service: 'Aaroham-api',
        status: 'up',
        env: env.nodeEnv,
        database,
        timestamp: new Date().toISOString(),
      },
      'API is running'
    );
  })
);

export default router;
