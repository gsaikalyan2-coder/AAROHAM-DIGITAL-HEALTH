# PR: Add Redis-backed rate limiting to auth endpoints

## Title
Add Redis-backed rate limiting to auth endpoints (fix CodeQL js/missing-rate-limiting)

## What
- Add a Redis-backed rate-limiter and apply it to the sensitive auth endpoints (OTP and password reset).
- New middleware: `server/src/middleware/rateLimiter.js` (ioredis + rate-limit-redis).
- Updated `server/package.json` to add `rate-limit-redis` and `ioredis` dependencies.
- Updated `server/src/routes/auth.routes.js` to use the Redis-backed `authLimiter` for:
  - `POST /send-otp`
  - `POST /verify-otp-login`
  - `POST /forgot-password`
  - `POST /reset-password`

## Why
- Enforces global rate limits across multiple server instances and uses per-identifier keys to mitigate IP rotation attacks. Fixes CodeQL alert `js/missing-rate-limiting` on sensitive endpoints.

## Notes & requirements
- Ensure `REDIS_URL` is configured in production (example: `redis://:password@host:6379`).
- Ensure `JWT_SECRET`, `TWILIO_*` and other required env vars are set in your deployment environment.
- This change is non-destructive (does not rewrite git history).

## Testing
1. In `server/`:
   ```bash
   npm install
   export REDIS_URL="redis://localhost:6379"    # or your Redis URL
   export JWT_SECRET="your_jwt_secret"
   npm run dev
   ```
2. Run the requests to verify limiter behavior:
   ```bash
   for i in {1..7}; do \
     curl -i -X POST http://localhost:5000/send-otp \
       -H "Content-Type: application/json" \
       -d '{"phone":"9999999999"}'; echo; done
   ```
   Expect: first 5 succeed, 6th returns HTTP 429 with JSON error.

## Checklist before merging
- [ ] Add `REDIS_URL`, `JWT_SECRET`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` to production/CI secrets.
- [ ] Run `npm install` in CI so new deps (`rate-limit-redis`, `ioredis`) are available.
- [ ] Verify in staging that rate limiting behaves as expected.
- [ ] Merge to `main` and monitor rate-limit logs/alerts.

## Post-merge recommendations
- Monitor and log rate-limit events (endpoint, identifier, IP).
- Consider hybrid keys (`identifier + IP`) if needed for extra protection.
- Add an integration test asserting 429 after limit is reached.
- Tune `windowMs` / `max` per endpoint as usage data becomes available.

Closes: (link CodeQL alert or issue here if desired)
