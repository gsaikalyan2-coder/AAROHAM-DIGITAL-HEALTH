import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import IORedis from 'ioredis';
import { env } from '../config/env.js';

// Create a Redis client. Use REDIS_URL env var first, otherwise fallback to env.redisUrl or localhost.
const redisUrl = process.env.REDIS_URL || env.redisUrl || 'redis://127.0.0.1:6379';
const redisClient = new IORedis(redisUrl);

// Key generator: prefer identifier (phone/email) when present, fallback to IP.
function identifierKeyGenerator(req) {
  try {
    const body = req.body || {};
    const id = (body.phone || body.identifier || body.email || '').toString().trim().toLowerCase();
    if (id) return `rl:id:${id}`;
  } catch (e) {
    // ignore and fallback to IP
  }
  // req.ip is Express-aware (behind proxy, set trust proxy accordingly in production)
  return `rl:ip:${req.ip}`;
}

export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each key to 5 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: identifierKeyGenerator,
  handler: (req, res) => {
    res.status(429).json({ success: false, error: { message: 'Too many requests. Please try again later.' } });
  },
});
