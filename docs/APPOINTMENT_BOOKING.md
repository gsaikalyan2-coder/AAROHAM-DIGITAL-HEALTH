# Appointment booking — worker portal to doctor portal

Living specification for the booking feature. Covers the data model, the API,
the wizard, the rules that are enforced where, and how to verify the whole path
end to end.

---

## 1. What the feature does

A worker books an outpatient visit from the worker portal by choosing, in order:

1. **Facility** — any participating hospital, in any district (the worker's own
   district is listed first, never exclusively — continuity of care across
   districts is the point of the system).
2. **Department** — derived from the practitioners actually posted to that
   facility, so an empty department cannot be offered.
3. **Practitioner** — within that department.
4. **Consultation type** — General (1 hr), Extended (2 hr), Comprehensive (3 hr).
5. **Date and time** — a month calendar, then the free start times for that day
   at that length.

The booking is written to `appointments`. The doctor portal reads the same rows,
so the visit appears in the practitioner's schedule with the worker's name, MHID,
age, consultation length and the reason the worker typed. Cancelling or
rescheduling from the worker portal is reflected there too.

**The consultation length is chosen before the date on purpose.** The length
determines which start times can exist; choosing it afterwards would mean
offering a grid and then withdrawing half of it.

---

## 2. Data model

Migration `007_appointment_booking.sql` extends the `appointments` table created
in `001_initial_schema.sql`. No new table is introduced.

| Column | Type | Purpose |
|---|---|---|
| `duration_minutes` | INTEGER NOT NULL DEFAULT 60 | Slot length. `CHECK (60, 120, 180)`. |
| `consultation_type` | TEXT | `GENERAL` / `EXTENDED` / `COMPREHENSIVE`. |
| `ends_at` | TIMESTAMPTZ NOT NULL | `scheduled_at + duration`, maintained by trigger. |
| `booked_by_role` | user_role | Who made the booking. |
| `cancelled_at` | TIMESTAMPTZ | Set by trigger when status becomes `Cancelled`. |
| `cancellation_reason` | TEXT | Free text, optional. |
| `rescheduled_from` | TIMESTAMPTZ | The instant the visit previously held. |

### Rules enforced in the database, not merely in code

| Constraint | What it prevents |
|---|---|
| `appointments_no_doctor_overlap` (EXCLUDE gist) | Two live bookings overlapping in one practitioner's diary. |
| `appointments_no_worker_overlap` (EXCLUDE gist) | One worker holding two overlapping visits, at any facility. |
| `appointments_duration_allowed` | A length outside the published catalogue. |
| `appointments_status_allowed` | A status the portals cannot render. |
| `appointments_cancellation_consistent` | A row that claims to be cancelled with no cancellation time, or the reverse. |
| `appointments_ends_after_start` | A zero or negative-length visit. |

The overlap constraints are the authoritative check, not an optimisation.
Availability is computed from a read and the booking is a later write; between
the two, another worker can take the slot. Only the database sees both
transactions. `appointment.service.js` catches SQLSTATE `23P01` and returns
`SLOT_TAKEN` (409) or `WORKER_DOUBLE_BOOKED` (409).

`ends_at` is trigger-maintained rather than `GENERATED`, because
`timestamptz + interval` is STABLE and PostgreSQL refuses a stable expression in
both generated columns and index expressions.

Ranges are half-open `[)`, so a visit ending at 11:00 and one starting at 11:00
do not conflict.

---

## 3. Scheduling policy

One file: `server/src/config/scheduling.js`. The client renders whatever
`GET /directory/booking-options` returns, so the two cannot drift.

| Setting | Value |
|---|---|
| Time zone | `Asia/Kolkata` |
| Clinic day | 09:00 – 17:00 |
| Closed | Sunday |
| Midday break | 13:00 – 14:00 (no slot may start in it or run through it) |
| Slot grid | Start times every 30 minutes |
| Booking window | Today to +60 days |
| Consultation types | GENERAL 60 · EXTENDED 120 · COMPREHENSIVE 180 |

A one-hour visit therefore has 12 possible start times: 09:00–16:00 on the
half hour, less 12:30, 13:00 and 13:30, which run into the break.

Adding a fourth consultation length requires a migration, because
`appointments_duration_allowed` names the permitted values. That friction is
intended.

**All wall-clock reasoning happens in the database**, via
`(date + time) AT TIME ZONE 'Asia/Kolkata'` on write and the inverse on read.
Node's process timezone is never trusted, so a server running in UTC and a
worker standing in Kerala agree on what 10:30 means.

---

## 4. API — `/api/v1`

Every response uses the envelope from CLAUDE.md §7.

### Directory

| Method | Route | Purpose |
|---|---|---|
| GET | `/directory/booking-options` | Consultation catalogue, clinic hours, booking window |
| GET | `/directory/hospitals?district=` | Participating facilities that have practitioners |
| GET | `/directory/hospitals/:hospitalId/departments` | Departments derived from posted practitioners |
| GET | `/directory/doctors?hospitalId=&department=` | Practitioners |
| GET | `/directory/workers/lookup?mobile=` | Resolve a beneficiary (prototype sign-in) |
| GET | `/directory/doctors/lookup?email=` | Resolve a practitioner (prototype sign-in) |

### Appointments

| Method | Route | Purpose |
|---|---|---|
| GET | `/appointments/availability?doctorId=&date=&durationMinutes=` | Every start time, free and taken |
| GET | `/appointments?mhid=` | A worker's own list |
| GET | `/appointments?doctorId=&date=&from=&includeCancelled=` | A practitioner's schedule |
| POST | `/appointments` | Book |
| PATCH | `/appointments/:id/cancel` | Cancel |
| PATCH | `/appointments/:id/reschedule` | Move, optionally changing the length |

`GET /appointments` requires **exactly one** of `mhid` or `doctorId`. Without
that rule an empty query would return every appointment in the system.

Availability returns unavailable slots too, marked `available: false` with an
`unavailableReason` of `Booked` or `Past`. A worker who is shown only three
times cannot tell a busy clinic from a broken page.

### Error codes

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Shape failure; `details[]` carries `{field, message}` |
| `DATE_IN_PAST` / `DATE_TOO_FAR` / `CLINIC_CLOSED` | 422 | Calendar rules |
| `SLOT_NOT_OFFERED` | 422 | Start time not on the grid for that length |
| `DOCTOR_NOT_AT_FACILITY` | 422 | Practitioner does not hold that department there |
| `UNKNOWN_CONSULTATION_TYPE` | 422 | Not in the catalogue |
| `SLOT_TAKEN` | 409 | Lost the race, or the time has passed |
| `WORKER_DOUBLE_BOOKED` | 409 | Overlaps the worker's own booking |
| `ALREADY_CANCELLED` / `NOT_CANCELLABLE` / `NOT_RESCHEDULABLE` | 409 | Status forbids the action |
| `NOT_YOUR_APPOINTMENT` | 403 | MHID does not match the booking |
| `WORKER_NOT_FOUND` / `DOCTOR_NOT_FOUND` / `HOSPITAL_NOT_FOUND` / `APPOINTMENT_NOT_FOUND` | 404 | — |

---

## 5. Known limitation — authorisation

**There is no authentication yet.** Phase 6 introduces JWT and RBAC; until then:

- The prototype sign-in screens resolve a mobile number or email against the
  register so the session refers to a real row. They verify no credential and
  issue no token.
- `NOT_YOUR_APPOINTMENT` compares the MHID in the request body with the MHID on
  the appointment. That is a **consistency check, not an authorisation check** —
  it stops a mistyped identifier from mutating someone else's booking; it does
  not stop a determined caller who knows another MHID.

When Phase 6 lands, the subject must come from the verified token and the `mhid`
field should be dropped from the request bodies. Nothing else in this feature
needs to change: the service already takes the subject as an argument rather
than reading it from the request.

An unrecognised mobile number or email still signs in, with no identifier
attached; both appointment screens then say the session is not linked to the
register rather than failing later with an opaque error.

---

## 6. Files

**Server**

```
db/migrations/007_appointment_booking.sql   schema, constraints, trigger
src/config/scheduling.js                    clinic day, slot grid, catalogue
src/services/directory.service.js           facilities, departments, practitioners, lookups
src/services/appointment.service.js         availability, book, cancel, reschedule (all SQL)
src/controllers/directory.controller.js
src/controllers/appointment.controller.js
src/validation/appointment.schemas.js       Zod
src/validation/directory.schemas.js         Zod
src/middleware/validate.js                  Zod -> VALIDATION_ERROR envelope
src/routes/directory.routes.js
src/routes/appointment.routes.js
src/routes/index.js                         mounts both routers
```

**Client**

```
src/lib/appointments.js                            API access + formatting
src/lib/api.js                                     + patch(), + error.details
src/components/common/Modal.jsx                    accessible dialog
src/components/appointments/CalendarPicker.jsx     month grid, closed days struck through
src/components/appointments/BookAppointmentModal.jsx  the 5-step wizard, also used to reschedule
src/pages/worker/WorkerAppointments.jsx            live list, book / reschedule / cancel
src/pages/doctor/DoctorAppointments.jsx            live schedule, Today / Upcoming
src/pages/doctor/DoctorDashboard.jsx                today's queue from the register
src/pages/auth/WorkerLogin.jsx                     resolves MHID from mobile
src/pages/auth/DoctorLogin.jsx                     resolves doctor id from email
```

---

## 7. Verifying it works

### 7.1 Set up

```bash
# server/.env must contain a DATABASE_URL (Supabase session pooler, port 5432)
cd server
npm install
npm run db:migrate      # expect: 007_appointment_booking.sql applied
npm run db:seed         # expect: 241 rows, idempotent on re-run
npm run dev             # http://localhost:5000/api/v1

cd ../client
npm install
npm run dev             # http://localhost:5173
```

Check the API is talking to the database:

```bash
curl http://localhost:5000/api/v1/health
# database.reachable: true, migrationsApplied: 7, seeded: true
```

### 7.2 The end-to-end path

1. Sign in at `/login/worker` with **9946010001**, OTP **123456**.
   The topbar should read *Ramesh Prasad Yadav · MHID KL-EKM-26-000001-8*.
   If it reads *not linked to the register*, the API is not reachable.
2. Go to **Appointments** → **Book appointment**.
3. Facility **Government General Hospital, Ernakulam** → department
   **General Medicine** → practitioner **Dr. Meera Raghavan** →
   **Extended consultation — 2 hr**.
4. Pick a weekday within 60 days. Confirm that Sundays and past dates are struck
   through and cannot be clicked.
5. Confirm the slot grid shows no start time between 12:30 and 13:30 — a
   two-hour visit cannot run through the midday break.
6. Choose **10:00**, type a reason of at least 4 characters, confirm.
   The row appears immediately: `10:00–12:00`, `2 hr`, status **Scheduled**.
7. Open a second browser profile (or log out) and sign in at `/login/doctor`
   with **meera.raghavan@ggh-ekm.kerala.gov.in** and any password.
8. **Appointments** → set the range to **Upcoming**. The booking is there, with
   the worker's name, MHID, age, `2 hr` and the reason typed in step 6.

### 7.3 The rules

| Try this | Expect |
|---|---|
| Book the same practitioner, same day, 11:00 for 1 hr | Slot struck through — it overlaps 10:00–12:00 |
| Book a second visit at another facility overlapping 10:00–12:00 | 409 *You already have an appointment that overlaps this time* |
| Book 11:00–12:00 immediately after another visit ends at 11:00 | Accepted — ranges are half-open |
| A Sunday in the calendar | Struck through, not clickable |
| A date more than 60 days out | Struck through |
| Reason of one character | Inline error under the field |
| Reschedule the booking to 14:00 | Worker list shows 14:00 and *Rescheduled*; doctor list agrees; 10:00 is free again |
| Cancel it | Status **Cancelled** in both portals, reason shown, slot released |
| Doctor portal, uncheck **Show cancelled** | The cancelled row disappears from the practitioner's view only |
| Cancel it a second time (via API) | 409 `ALREADY_CANCELLED` |

### 7.4 Automated check

`server/tests/appointments.e2e.mjs` exercises all of the above against a running
API and a real database — 48 assertions across the directory, availability,
booking, cross-portal visibility, rescheduling and cancellation.

```bash
cd server
npm run dev                    # terminal 1
npm run test:appointments      # terminal 2
# API_BASE_URL=http://localhost:5000/api/v1 by default
```

It writes to the database and expects the demonstration seed, so it must never
be pointed at an environment holding real records.

---

## 8. What this feature deliberately does not do

- **No reminders.** `reminder_sent` exists on the table and is untouched; SMS
  arrives with the OTP provider in Phase 7.
- **No practitioner-side booking.** `booked_by_role` records who booked, and the
  service accepts the role as an argument, but only the worker portal calls it.
  A doctor cannot yet create or move an appointment.
- **No leave or roster.** Availability is the clinic day minus existing
  bookings. A practitioner on leave still appears bookable; a roster table is
  the correct fix and is not in scope here.
- **No per-facility hours.** One clinic day applies to every facility.
