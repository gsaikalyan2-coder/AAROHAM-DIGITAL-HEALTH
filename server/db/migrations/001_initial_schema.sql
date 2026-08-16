-- ============================================================================
-- 001_initial_schema
-- Aaroham — canonical schema (PostgreSQL)
-- ----------------------------------------------------------------------------
-- This file is the EXECUTABLE canonical DDL. It replaces the former
-- db/schema.sql, which was never executed and would have drifted from the
-- migration set the moment either changed.
--
-- Creates 13 tables and one enum type (user_role).
-- Rules: UUID primary keys · created_at/updated_at everywhere · soft delete via
--        deleted_at · health records are NEVER hard-deleted.
--
-- Applied by: npm run db:migrate   (server/db/migrate.js)
-- Engine:     PostgreSQL 14+ only — see PROJECT_PLAN.md §4
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------- Identity ----------

CREATE TYPE user_role AS ENUM ('worker', 'doctor', 'admin');

CREATE TABLE hospitals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  district      TEXT NOT NULL,
  type          TEXT NOT NULL,              -- Government / Empanelled Private / PHC
  address       TEXT,
  contact       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role            user_role NOT NULL,
  email           TEXT UNIQUE,              -- doctor / admin
  mobile          TEXT UNIQUE,              -- worker
  password_hash   TEXT,                     -- bcrypt; NULL for OTP-only workers
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT users_identifier_present CHECK (email IS NOT NULL OR mobile IS NOT NULL)
);

CREATE TABLE workers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  mhid               TEXT UNIQUE NOT NULL,     -- KL-<DIST>-<YY>-<6 digits>
  abha_id            TEXT UNIQUE,              -- OPTIONAL linkage, never required
  full_name          TEXT NOT NULL,
  date_of_birth      DATE,
  gender             TEXT,
  mobile             TEXT NOT NULL,
  native_state       TEXT,
  native_district    TEXT,
  current_district   TEXT NOT NULL,
  current_address    TEXT,
  employer           TEXT,
  occupation         TEXT,
  emergency_contact  TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX idx_workers_mhid ON workers(mhid);
CREATE INDEX idx_workers_district ON workers(current_district);
CREATE INDEX idx_workers_mobile ON workers(mobile);

CREATE TABLE doctors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id           UUID NOT NULL REFERENCES hospitals(id),
  full_name             TEXT NOT NULL,
  specialisation        TEXT,
  registration_number   TEXT UNIQUE NOT NULL,
  can_access_mental_health BOOLEAN NOT NULL DEFAULT FALSE,  -- sensitive tier scope
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ
);

-- ---------- Health record ----------

CREATE TABLE health_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id           UUID UNIQUE NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  blood_group         TEXT,
  allergies           TEXT[] DEFAULT '{}',
  chronic_conditions  TEXT[] DEFAULT '{}',
  current_medications TEXT[] DEFAULT '{}',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consultations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  doctor_id       UUID NOT NULL REFERENCES doctors(id),
  hospital_id     UUID NOT NULL REFERENCES hospitals(id),
  visit_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  department      TEXT,
  symptoms        TEXT,
  diagnosis       TEXT NOT NULL,
  notes           TEXT,
  follow_up_date  DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_consultations_worker ON consultations(worker_id, visit_date DESC);

CREATE TABLE prescriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  medicine        TEXT NOT NULL,
  dosage          TEXT,
  frequency       TEXT,
  duration_days   INTEGER,
  instructions    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prescriptions_consultation ON prescriptions(consultation_id);

CREATE TABLE lab_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  file_path       TEXT NOT NULL,          -- served through an authorised route only
  mime_type       TEXT,
  file_size       INTEGER,
  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vaccinations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id     UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  vaccine_name  TEXT NOT NULL,
  dose_number   TEXT,
  administered_on DATE,
  next_due_on   DATE,
  hospital_id   UUID REFERENCES hospitals(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vaccinations_worker ON vaccinations(worker_id);

-- ---------- Sensitive tier ----------

CREATE TABLE mental_health_screenings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       UUID NOT NULL REFERENCES workers(id) ON DELETE RESTRICT,
  instrument      TEXT NOT NULL,          -- PHQ-9 | GAD-7
  score           INTEGER NOT NULL,
  severity        TEXT NOT NULL,
  counsellor_id   UUID REFERENCES users(id),
  notes           TEXT,
  consent_given   BOOLEAN NOT NULL DEFAULT FALSE,
  follow_up_date  DATE,
  screened_on     DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_screenings_worker ON mental_health_screenings(worker_id);

-- ---------- Services ----------

CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id       UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  doctor_id       UUID REFERENCES doctors(id),
  hospital_id     UUID NOT NULL REFERENCES hospitals(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  department      TEXT,
  reason          TEXT,
  status          TEXT NOT NULL DEFAULT 'Scheduled',  -- Scheduled|Confirmed|Completed|Cancelled
  reminder_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appointments_worker ON appointments(worker_id, scheduled_at DESC);

CREATE TABLE schemes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  authority         TEXT NOT NULL,          -- Government of Kerala / Government of India
  benefit           TEXT NOT NULL,
  eligibility_rules JSONB NOT NULL DEFAULT '{}',  -- evaluated by the rules engine
  apply_url         TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Governance ----------

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id),
  actor_role  user_role,
  action      TEXT NOT NULL,     -- READ health_record | CREATE consultation | ...
  entity      TEXT NOT NULL,
  entity_id   TEXT,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entity_id);
-- append only: no UPDATE or DELETE grants are issued on this table
