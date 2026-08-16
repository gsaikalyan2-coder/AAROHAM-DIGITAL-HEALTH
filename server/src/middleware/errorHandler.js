import { fail } from '../utils/apiResponse.js';
import { isProd } from '../config/env.js';

export function notFound(req, res) {
  return fail(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  console.error(JSON.stringify({
    level: 'error', code, status, message: err.message, path: req.originalUrl,
  }));
  return fail(res, status, code, isProd && status === 500 ? 'Internal server error' : err.message);
}
