-- ============================================================================
-- 003_updated_at_triggers
-- ----------------------------------------------------------------------------
-- Rationale.
-- CLAUDE.md §6 requires created_at and updated_at on every table. In 001 both
-- columns default to now(), which is correct for created_at but leaves
-- updated_at frozen at insertion time forever — nothing advances it on UPDATE.
-- An audit surface that reports a stale "last amended" date is worse than one
-- that reports none, because it is believed.
--
-- A single trigger function, applied to every table that carries updated_at.
-- Tables without the column (prescriptions, lab_reports, vaccinations,
-- mental_health_screenings, schemes, audit_logs) are deliberately excluded:
-- their rows are append-only records of an event that occurred.
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hospitals_updated_at
  BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_health_records_updated_at
  BEFORE UPDATE ON health_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- audit_logs is append-only (CLAUDE.md §6, and the closing note of 001).
-- The comment there states that no UPDATE or DELETE grants are issued, but a
-- comment is not an enforcement mechanism and the application connects as the
-- owning role. These triggers refuse the operation outright, so an accidental
-- UPDATE or DELETE fails loudly in development rather than quietly destroying
-- the record of who read a health record.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION refuse_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_no_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION refuse_mutation();

CREATE TRIGGER trg_audit_logs_no_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION refuse_mutation();
