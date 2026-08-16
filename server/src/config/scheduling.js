/**
 * ============================================================================
 * Outpatient scheduling policy — single source of truth
 * ----------------------------------------------------------------------------
 * The slot grid, the clinic day and the consultation catalogue live here and
 * nowhere else. The client renders exactly what GET /directory/booking-options
 * returns, so the two cannot drift: a duration removed here disappears from the
 * booking wizard on the next page load, and the CHECK constraint added by
 * migration 007 refuses anything the catalogue does not offer.
 *
 * All wall-clock reasoning is in Asia/Kolkata. Instants are stored as
 * TIMESTAMPTZ; only the presentation of a slot is local.
 * ============================================================================
 */

export const CLINIC_TIME_ZONE = 'Asia/Kolkata';

/** Outpatient hours, inclusive of the opening minute, exclusive of the closing one. */
export const CLINIC_DAY = {
  opensAt: '09:00',
  closesAt: '17:00',
  /** Outpatient services do not run on Sunday (0). */
  closedWeekdays: [0],
};

/**
 * Midday break. A slot may not start inside it and may not run through it —
 * a three-hour assessment beginning at 11:00 would otherwise silently consume
 * the break.
 */
export const CLINIC_BREAK = { startsAt: '13:00', endsAt: '14:00' };

/** Start times are offered on this grid, in minutes. */
export const SLOT_GRID_MINUTES = 30;

/**
 * How far ahead a worker may book. Long enough to be useful, short enough that
 * a practitioner's roster six months out is not treated as settled.
 */
export const MAX_ADVANCE_DAYS = 60;

/**
 * The consultation catalogue. `durationMinutes` must appear in the
 * appointments_duration_allowed CHECK constraint (migration 007); adding a
 * fourth type therefore requires a migration, which is the intended friction.
 */
export const CONSULTATION_TYPES = [
  {
    code: 'GENERAL',
    label: 'General consultation',
    durationMinutes: 60,
    description: 'Routine complaint, review of an ongoing condition, or a follow-up visit.',
  },
  {
    code: 'EXTENDED',
    label: 'Extended consultation',
    durationMinutes: 120,
    description: 'Multiple complaints, a new chronic diagnosis, or a visit needing on-site tests.',
  },
  {
    code: 'COMPREHENSIVE',
    label: 'Comprehensive assessment',
    durationMinutes: 180,
    description: 'Pre-employment or periodic health examination, including screening and counselling.',
  },
];

export const APPOINTMENT_STATUSES = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'];

/** Statuses a worker may still act on. A completed visit is a historical record. */
export const WORKER_MUTABLE_STATUSES = ['Scheduled', 'Confirmed'];

export const CONSULTATION_TYPE_BY_CODE = Object.fromEntries(
  CONSULTATION_TYPES.map((t) => [t.code, t])
);

export const ALLOWED_DURATIONS = CONSULTATION_TYPES.map((t) => t.durationMinutes);

/** 'HH:MM' -> minutes since midnight. */
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** minutes since midnight -> 'HH:MM'. */
export function toClock(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Every start time the clinic day offers for a visit of `durationMinutes`,
 * before any practitioner's existing bookings are considered.
 * Availability subtracts from this list; it never adds to it.
 */
export function candidateStartTimes(durationMinutes) {
  const opens = toMinutes(CLINIC_DAY.opensAt);
  const closes = toMinutes(CLINIC_DAY.closesAt);
  const breakStart = toMinutes(CLINIC_BREAK.startsAt);
  const breakEnd = toMinutes(CLINIC_BREAK.endsAt);

  const starts = [];
  for (let start = opens; start + durationMinutes <= closes; start += SLOT_GRID_MINUTES) {
    const end = start + durationMinutes;
    const overlapsBreak = start < breakEnd && end > breakStart;
    if (overlapsBreak) continue;
    starts.push(toClock(start));
  }
  return starts;
}

/** The payload the booking wizard is built from. */
export function bookingOptions() {
  return {
    timeZone: CLINIC_TIME_ZONE,
    clinicDay: CLINIC_DAY,
    clinicBreak: CLINIC_BREAK,
    slotGridMinutes: SLOT_GRID_MINUTES,
    maxAdvanceDays: MAX_ADVANCE_DAYS,
    consultationTypes: CONSULTATION_TYPES,
    statuses: APPOINTMENT_STATUSES,
  };
}
