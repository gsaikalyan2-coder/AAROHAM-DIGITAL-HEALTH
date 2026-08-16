-- ============================================================================
-- 002_dedup_and_lookup_constraints
-- ----------------------------------------------------------------------------
-- Rationale.
-- docs/DATA_INGESTION.md §6 nominates the normalised mobile number as the
-- deduplication key, and requires that re-processing the same export creates no
-- duplicate beneficiary. In 001 `workers.mobile` carries only a plain index, so
-- that guarantee would rest entirely on application code. A concurrent import
-- and registration could still produce two rows for one person.
--
-- This migration moves the guarantee into the database. The index is PARTIAL —
-- a soft-deleted record must not block re-registration of the same person.
-- ============================================================================

CREATE UNIQUE INDEX idx_workers_mobile_unique
  ON workers (mobile)
  WHERE deleted_at IS NULL;

-- The plain index from 001 is now redundant: the unique index above serves the
-- same lookups. Dropping it saves a write on every insert and update.
DROP INDEX IF EXISTS idx_workers_mobile;

-- MHID is the system's public identifier and is looked up on every practitioner
-- search. It is already UNIQUE (which creates its own index), so the separate
-- index from 001 duplicates that structure for no benefit.
DROP INDEX IF EXISTS idx_workers_mhid;

-- Beneficiary sign-in resolves a user by mobile; practitioner and administrator
-- sign-in resolve by email. Both columns are UNIQUE and therefore indexed, but
-- only among rows that have not been soft-deleted do we care about liveness.
CREATE INDEX idx_users_active_role ON users (role) WHERE deleted_at IS NULL;

-- Practitioner "my patients" and the departmental facility view both filter by
-- hospital.
CREATE INDEX idx_doctors_hospital ON doctors (hospital_id) WHERE deleted_at IS NULL;

-- Departmental analytics aggregates facilities by district.
CREATE INDEX idx_hospitals_district ON hospitals (district) WHERE deleted_at IS NULL;
