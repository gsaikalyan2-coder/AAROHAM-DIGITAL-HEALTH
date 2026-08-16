/**
 * ============================================================================
 * PostgreSQL connection — single Pool for the whole process.
 * ----------------------------------------------------------------------------
 * One Pool, created once, shared by every service. A Pool created per request
 * exhausts the server's connection slots under load and is the most common
 * cause of "too many clients already" in Node services.
 *
 * PostgreSQL is the only supported engine — see PROJECT_PLAN.md §4.
 * SQL belongs in server/src/services. This module provides the transport only.
 * ============================================================================
 */

import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

/**
 * TLS policy.
 *
 * A local instance normally presents no certificate, so TLS is off. Every
 * managed provider (Supabase, Neon, RDS) requires it, and beneficiary health
 * records must never cross a public network unencrypted. The rule is therefore
 * "encrypt unless the host is local", not "encrypt if the URL asks", because a
 * connection string copied from a provider dashboard usually omits `sslmode`
 * and the omission would silently downgrade the connection.
 *
 * `rejectUnauthorized` is enabled only for verify-ca / verify-full. Supabase
 * and Neon present certificates from their own authority, which Node does not
 * trust by default; demanding verification without installing the provider's
 * root certificate fails the connection rather than securing it. Traffic is
 * still encrypted. To pin the certificate properly, download the provider's
 * root certificate and set `sslmode=verify-full` with NODE_EXTRA_CA_CERTS.
 */
function sslConfig(connectionString) {
  if (!connectionString) return false;

  if (/sslmode=disable/i.test(connectionString)) return false;

  if (/sslmode=(require|prefer|no-verify)/i.test(connectionString)) {
    return { rejectUnauthorized: false };
  }

  if (/sslmode=verify-(ca|full)/i.test(connectionString)) {
    return { rejectUnauthorized: true };
  }

  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)[:/]/i.test(
    connectionString
  );

  return isLocal ? false : { rejectUnauthorized: false };
}

/**
 * Supabase's transaction pooler (port 6543) does not support prepared
 * statements, session-scoped advisory locks or multi-statement transactions —
 * all three of which the migration runner relies on. Silently connecting
 * through it produces confusing mid-migration failures, so name the problem at
 * connection time instead.
 *
 * Session mode (port 5432 on the pooler host) and the direct connection are
 * both correct.
 */
function assertSessionCapableConnection(connectionString) {
  const isSupavisor = /pooler\.supabase\.com/i.test(connectionString);
  const isTransactionPort = /pooler\.supabase\.com:6543/i.test(connectionString);

  if (isSupavisor && isTransactionPort) {
    throw new Error(
      'DATABASE_URL points at the Supabase transaction pooler (port 6543), which ' +
        'does not support prepared statements or session-scoped advisory locks. ' +
        'Use the Session pooler string (same host, port 5432) or the direct ' +
        'connection. Dashboard: Connect -> Session pooler.'
    );
  }
}

let pool = null;

/**
 * Returns the process-wide Pool, creating it on first use.
 * Throws loudly if DATABASE_URL is unset — a silent fallback to a default
 * connection string would hide a misconfigured environment until first query.
 */
export function getPool() {
  if (pool) return pool;

  if (!env.databaseUrl) {
    throw new Error(
      'DATABASE_URL is not set. Add a PostgreSQL connection string to server/.env ' +
        '(see .env.example). PostgreSQL is the only supported engine.'
    );
  }

  assertSessionCapableConnection(env.databaseUrl);

  pool = new Pool({
    connectionString: env.databaseUrl,
    ssl: sslConfig(env.databaseUrl),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on('error', (err) => {
    // An idle client failing is not fatal to the process; the Pool replaces it.
    console.error('[db] idle client error:', err.message);
  });

  return pool;
}

/** Parameterised query. Never interpolate values into SQL text. */
export function query(text, params) {
  return getPool().query(text, params);
}

/**
 * Runs `fn` inside a single transaction on one dedicated client.
 * Commits on return, rolls back on throw, always releases the client.
 */
export async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Closes the Pool. Called on SIGTERM/SIGINT and at the end of CLI scripts. */
export async function closePool() {
  if (!pool) return;
  const p = pool;
  pool = null;
  await p.end();
}
