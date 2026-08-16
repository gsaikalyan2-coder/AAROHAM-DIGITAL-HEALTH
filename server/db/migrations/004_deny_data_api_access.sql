-- ============================================================================
-- 004_deny_data_api_access
-- ----------------------------------------------------------------------------
-- Rationale.
-- A managed Postgres provider may expose the `public` schema through an
-- automatically generated REST API. Supabase does exactly this: PostgREST
-- serves every table in `public` to the `anon` and `authenticated` roles, and
-- the key that authenticates as `anon` is publishable by design.
--
-- Without the statements below, `health_records` and
-- `mental_health_screenings` are readable and writable over the public
-- internet by anyone holding that key — bypassing Express, the role checks in
-- server/src/middleware, and the audit trail entirely. Supabase's own linter
-- reports this as 14 ERROR-level findings.
--
-- Aaroham does not use PostgREST. Every query goes through
-- server/src/services (CLAUDE.md §5). The correct posture is therefore to deny
-- the Data API at the database rather than to author RLS policies for an
-- interface we do not serve.
--
-- Mechanism.
--   1. Enable RLS on every table, and create NO policies. RLS with no policy
--      denies all access to non-owner roles. `anon` and `authenticated` are
--      non-owners, so PostgREST sees empty tables and rejects every write.
--   2. Revoke the schema and table grants those roles hold, so the denial does
--      not depend on RLS alone.
--   3. Revoke default privileges, so a table added by a later migration is not
--      silently exposed.
--
-- The application is unaffected. It connects as the role that owns these
-- tables, and a table owner bypasses RLS unless FORCE ROW LEVEL SECURITY is
-- set, which it deliberately is not.
--
-- Portability. A plain local PostgreSQL instance has no `anon` or
-- `authenticated` role, so the grant statements are wrapped in existence
-- checks. On a local instance this migration enables RLS and does nothing else.
--
-- This is defence in depth, not a substitute for application authorisation.
-- Phase 6 still delivers JWT verification and role gating; Phase 16 still
-- delivers the consent tier. This migration only ensures there is no second,
-- unguarded door into the register.
-- ============================================================================

ALTER TABLE hospitals                ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_health_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs               ENABLE ROW LEVEL SECURITY;

-- The migration ledger is created by db/migrate.js rather than by a migration,
-- so it is covered here. It reveals the schema history, which is of no use to
-- an anonymous caller.
ALTER TABLE schema_migrations        ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  api_role TEXT;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON SCHEMA public FROM %I', api_role);
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I',
        api_role
      );
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I',
        api_role
      );
      RAISE NOTICE 'Data API access revoked for role %', api_role;
    ELSE
      RAISE NOTICE 'Role % not present — no Data API exposure to revoke', api_role;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Pin the search_path on the trigger functions from migration 003.
--
-- A function with a mutable search_path resolves unqualified names using the
-- caller's search_path. A role able to create objects in an earlier schema on
-- that path could shadow a built-in and have its own code run inside the
-- trigger. These two functions reference nothing but built-ins, so the risk is
-- small — but pinning the path costs nothing and clears the two WARN findings.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION refuse_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % is not permitted', TG_OP;
END;
$$;
