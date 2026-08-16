-- ============================================================================
-- 007_appointment_booking
-- ----------------------------------------------------------------------------
-- Rationale.
-- 001 created `appointments` with a single `scheduled_at` instant and nothing
-- else. A booking made from the worker portal has to carry three further facts
-- before a practitioner's day can be built from it:
--
--   1. How long the visit occupies the practitioner. A one-hour review and a
--      three-hour comprehensive assessment cannot both be a point in time.
--   2. What kind of consultation was booked, so the practitioner sees the same
--      description the worker chose rather than inferring it from the duration.
--   3. Why, when and from where a booking was cancelled or moved. A booking
--      that silently disappears from the practitioner's list is indistinguishable
--      from one that was never made.
--
-- Double booking is prevented in the engine rather than in application code.
-- Availability is computed by reading free slots and then writing a row; between
-- those two operations another worker can take the same slot. Only the database
-- sees both transactions, so only the database can refuse the second one. The
-- EXCLUDE constraint below does exactly that, and the service layer translates
-- its error into SLOT_TAKEN.
--
-- `ends_at` is maintained by a trigger rather than declared GENERATED, because
-- `timestamptz + interval` is STABLE, not IMMUTABLE, and PostgreSQL refuses a
-- stable expression both in a generated column and in an index expression.
-- A stored, trigger-maintained column satisfies the EXCLUDE constraint and
-- follows the pattern already established by 003.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------- Booking detail ----------

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS duration_minutes    INTEGER     NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS consultation_type   TEXT,
  ADD COLUMN IF NOT EXISTS ends_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS booked_by_role      user_role,
  ADD COLUMN IF NOT EXISTS cancelled_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS rescheduled_from    TIMESTAMPTZ;

COMMENT ON COLUMN appointments.duration_minutes IS
  'Slot length in minutes. Constrained to the consultation types offered by server/src/config/scheduling.js.';
COMMENT ON COLUMN appointments.consultation_type IS
  'Code of the consultation type chosen at booking (GENERAL | EXTENDED | COMPREHENSIVE).';
COMMENT ON COLUMN appointments.ends_at IS
  'scheduled_at + duration_minutes, maintained by trg_appointments_ends_at. Backs the overlap constraint.';
COMMENT ON COLUMN appointments.rescheduled_from IS
  'The instant this appointment previously occupied, so a moved visit remains traceable.';

-- ---------- Derived columns: backfill, then maintain ----------
--
-- One trigger keeps both derived facts true, so no caller can write a row that
-- the constraints below would have to reject on a technicality. `cancelled_at`
-- is set when a row becomes Cancelled and cleared when it stops being — the
-- alternative is every INSERT in the codebase, and in seed.sql, having to
-- remember a column that the status already implies.

UPDATE appointments
   SET ends_at = scheduled_at + make_interval(mins => duration_minutes)
 WHERE ends_at IS NULL;

UPDATE appointments
   SET cancelled_at = coalesce(cancelled_at, updated_at, created_at)
 WHERE status = 'Cancelled' AND cancelled_at IS NULL;

CREATE OR REPLACE FUNCTION set_appointment_derived_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ends_at = NEW.scheduled_at + make_interval(mins => NEW.duration_minutes);

  IF NEW.status = 'Cancelled' THEN
    NEW.cancelled_at = coalesce(NEW.cancelled_at, now());
  ELSE
    NEW.cancelled_at = NULL;
    NEW.cancellation_reason = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointments_ends_at ON appointments;
DROP TRIGGER IF EXISTS trg_appointments_derived ON appointments;
CREATE TRIGGER trg_appointments_derived
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION set_appointment_derived_fields();

ALTER TABLE appointments ALTER COLUMN ends_at SET NOT NULL;

-- ---------- Domain constraints ----------

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_duration_allowed;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_duration_allowed
  CHECK (duration_minutes IN (60, 120, 180));

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_allowed;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_allowed
  CHECK (status IN ('Scheduled', 'Confirmed', 'Completed', 'Cancelled'));

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_ends_after_start;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_ends_after_start
  CHECK (ends_at > scheduled_at);

-- A cancelled appointment must say when it was cancelled, and one that is not
-- cancelled must not claim to have been. The doctor's list distinguishes the
-- two, and an inconsistent pair would render as a live booking that no longer
-- exists for the worker.
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_cancellation_consistent;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_cancellation_consistent
  CHECK ((status = 'Cancelled') = (cancelled_at IS NOT NULL));

-- ---------- No practitioner is in two places at once ----------

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_no_doctor_overlap;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_doctor_overlap
  EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(scheduled_at, ends_at, '[)') WITH &&
  )
  WHERE (status <> 'Cancelled' AND doctor_id IS NOT NULL);

-- Nor is a worker. A worker holding two overlapping bookings will miss one of
-- them, and the missed slot is a practitioner hour lost.
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_no_worker_overlap;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_worker_overlap
  EXCLUDE USING gist (
    worker_id WITH =,
    tstzrange(scheduled_at, ends_at, '[)') WITH &&
  )
  WHERE (status <> 'Cancelled');

-- ---------- Lookup ----------

-- The practitioner's day view filters by doctor and orders by time; the index
-- from 001 covers the worker's list only.
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_schedule
  ON appointments (doctor_id, scheduled_at)
  WHERE status <> 'Cancelled';

CREATE INDEX IF NOT EXISTS idx_appointments_hospital_schedule
  ON appointments (hospital_id, scheduled_at);
