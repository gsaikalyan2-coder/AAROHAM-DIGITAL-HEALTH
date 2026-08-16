/**
 * ============================================================================
 * Health service
 * ----------------------------------------------------------------------------
 * The only layer permitted to hold SQL (CLAUDE.md §5).
 * ============================================================================
 */

import { query } from '../config/db.js';
import { env } from '../config/env.js';

/**
 * Reports whether the database is actually reachable, and how far the schema
 * has been migrated.
 *
 * Never throws: an unreachable database is a diagnostic to be reported, not an
 * error that should take the health endpoint down with it.
 *
 * @returns {Promise<{configured: boolean, reachable: boolean, migrationsApplied: number|null, seeded: boolean|null, error: string|null}>}
 */
export async function getDatabaseHealth() {
  if (!env.databaseUrl) {
    return {
      configured: false,
      reachable: false,
      migrationsApplied: null,
      seeded: null,
      error: 'DATABASE_URL is not set — see server/.env.example',
    };
  }

  try {
    const { rows } = await query(`
      SELECT
        (SELECT count(*)::int FROM schema_migrations)                       AS migrations_applied,
        (SELECT count(*)::int FROM workers WHERE deleted_at IS NULL) > 0    AS seeded
    `);

    return {
      configured: true,
      reachable: true,
      migrationsApplied: rows[0].migrations_applied,
      seeded: rows[0].seeded,
      error: null,
    };
  } catch (err) {
    // The most common cause is that db:migrate has not been run, in which case
    // schema_migrations does not exist. Say so rather than surfacing a raw
    // relation-does-not-exist message.
    const unmigrated = /schema_migrations|does not exist/i.test(err.message);

    return {
      configured: true,
      reachable: !unmigrated ? false : true,
      migrationsApplied: unmigrated ? 0 : null,
      seeded: unmigrated ? false : null,
      error: unmigrated
        ? 'Schema not present — run "npm run db:migrate"'
        : err.message,
    };
  }
}
