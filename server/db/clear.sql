-- ============================================================================
-- Clear seeded demo data from the application tables.
-- Run manually with PostgreSQL:
--   psql <connection-string> -f server/db/clear.sql
-- ============================================================================

TRUNCATE TABLE
  audit_logs,
  prescriptions,
  lab_reports,
  consultations,
  vaccinations,
  mental_health_screenings,
  appointments,
  health_records,
  workers,
  doctors,
  users,
  hospitals,
  schemes
RESTART IDENTITY CASCADE;
