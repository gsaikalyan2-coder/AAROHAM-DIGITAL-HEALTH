import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Stethoscope,
} from 'lucide-react';

import Modal from '../common/Modal.jsx';
import CalendarPicker from './CalendarPicker.jsx';
import {
  bookAppointment,
  fieldError,
  formatDate,
  formatDuration,
  formatWeekday,
  getAvailability,
  getBookingOptions,
  getDepartments,
  getDoctors,
  getHospitals,
  rescheduleAppointment,
} from '../../lib/appointments.js';

/**
 * ============================================================================
 * Book / reschedule an outpatient appointment
 * ----------------------------------------------------------------------------
 * Five steps, in the order the choices actually constrain one another:
 *
 *   1 Facility          which participating hospital
 *   2 Department        derived from the practitioners posted there
 *   3 Practitioner      within that department
 *   4 Consultation      1 hr / 2 hr / 3 hr — chosen BEFORE the date, because
 *                       the length determines which start times can exist
 *   5 Date and time     calendar, then the free slots for that day
 *
 * Choosing the length after the time would mean showing a grid that a
 * three-hour visit cannot use and withdrawing half of it a moment later.
 *
 * Reschedule reuses the same component: the facility, department and
 * practitioner are fixed by the existing booking, so it opens at step 4.
 * ============================================================================
 */

const STEPS = [
  { id: 1, label: 'Facility', icon: Building2 },
  { id: 2, label: 'Department', icon: Building2 },
  { id: 3, label: 'Practitioner', icon: Stethoscope },
  { id: 4, label: 'Consultation', icon: Clock },
  { id: 5, label: 'Date & time', icon: CalendarDays },
];

const emptyDraft = {
  hospital: null,
  department: null,
  doctor: null,
  consultationType: null,
  date: '',
  time: '',
  reason: '',
};

export default function BookAppointmentModal({
  open,
  onClose,
  onBooked,
  mhid,
  workerDistrict,
  /** Present when rescheduling; the practitioner and facility are then fixed. */
  rescheduleOf = null,
}) {
  const isReschedule = Boolean(rescheduleOf);

  const [options, setOptions] = useState(null);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(emptyDraft);

  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availability, setAvailability] = useState(null);

  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /* ------------------------------ lifecycle ------------------------------ */

  useEffect(() => {
    if (!open) return;

    setError(null);
    setAvailability(null);

    if (isReschedule) {
      setStep(4);
      setDraft({
        hospital: rescheduleOf.hospital,
        department: rescheduleOf.department,
        doctor: rescheduleOf.doctor,
        consultationType: rescheduleOf.consultationType,
        date: '',
        time: '',
        reason: rescheduleOf.reason || '',
      });
    } else {
      setStep(1);
      setDraft(emptyDraft);
    }

    setLoading(true);
    Promise.all([getBookingOptions(), isReschedule ? [] : getHospitals()])
      .then(([opts, list]) => {
        setOptions(opts);
        setHospitals(list);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [open, isReschedule, rescheduleOf]);

  // Departments depend on the facility; practitioners on both.
  useEffect(() => {
    if (!open || isReschedule || !draft.hospital) return;
    setLoading(true);
    getDepartments(draft.hospital.id).then(setDepartments).catch(setError).finally(() => setLoading(false));
  }, [open, isReschedule, draft.hospital]);

  useEffect(() => {
    if (!open || isReschedule || !draft.hospital || !draft.department) return;
    setLoading(true);
    getDoctors({ hospitalId: draft.hospital.id, department: draft.department })
      .then(setDoctors)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [open, isReschedule, draft.hospital, draft.department]);

  const durationMinutes = useMemo(() => {
    const type = options?.consultationTypes?.find((t) => t.code === draft.consultationType);
    return type?.durationMinutes ?? null;
  }, [options, draft.consultationType]);

  const loadSlots = useCallback(() => {
    if (!draft.doctor || !draft.date || !durationMinutes) return;
    setSlotsLoading(true);
    setError(null);
    getAvailability({ doctorId: draft.doctor.id, date: draft.date, durationMinutes })
      .then(setAvailability)
      .catch((err) => {
        setAvailability(null);
        setError(err);
      })
      .finally(() => setSlotsLoading(false));
  }, [draft.doctor, draft.date, durationMinutes]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  /* -------------------------------- steps -------------------------------- */

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const canContinue =
    (step === 1 && draft.hospital) ||
    (step === 2 && draft.department) ||
    (step === 3 && draft.doctor) ||
    (step === 4 && draft.consultationType) ||
    (step === 5 && draft.date && draft.time && (isReschedule || draft.reason.trim().length >= 4));

  const firstStep = isReschedule ? 4 : 1;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const appointment = isReschedule
        ? await rescheduleAppointment(rescheduleOf.id, {
            mhid,
            date: draft.date,
            time: draft.time,
            consultationType: draft.consultationType,
          })
        : await bookAppointment({
            mhid,
            hospitalId: draft.hospital.id,
            doctorId: draft.doctor.id,
            department: draft.department,
            consultationType: draft.consultationType,
            date: draft.date,
            time: draft.time,
            reason: draft.reason.trim(),
          });

      onBooked(appointment, isReschedule ? 'rescheduled' : 'booked');
      onClose();
    } catch (err) {
      setError(err);
      // A slot lost to another worker between the read and the write is the one
      // failure the person can act on immediately — show the fresh grid.
      if (err.code === 'SLOT_TAKEN') {
        set({ time: '' });
        loadSlots();
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------ rendering ------------------------------ */

  const visibleSteps = isReschedule ? STEPS.filter((s) => s.id >= 4) : STEPS;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isReschedule ? 'Reschedule appointment' : 'Book an appointment'}
      subtitle={
        isReschedule
          ? `${rescheduleOf?.doctor?.name} · ${rescheduleOf?.hospital?.name}`
          : 'Outpatient services at participating government facilities.'
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="gov-btn-outline"
            onClick={() => (step > firstStep ? setStep(step - 1) : onClose())}
            disabled={submitting}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {step > firstStep ? 'Back' : 'Cancel'}
          </button>

          {step < 5 ? (
            <button
              type="button"
              className="gov-btn-primary"
              disabled={!canContinue || loading}
              onClick={() => setStep(step + 1)}
            >
              Continue
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="gov-btn-primary" disabled={!canContinue || submitting} onClick={submit}>
              {submitting ? (
                <Loader2 size={16} aria-hidden="true" />
              ) : (
                <Check size={16} aria-hidden="true" />
              )}
              {isReschedule ? 'Confirm new slot' : 'Confirm booking'}
            </button>
          )}
        </div>
      }
    >
      {/* Step indicator */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-5 text-xs">
        {visibleSteps.map((s, i) => {
          const state = s.id === step ? 'current' : s.id < step ? 'done' : 'todo';
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-md border ${
                  state === 'current'
                    ? 'bg-gov-teal text-white border-gov-teal font-semibold'
                    : state === 'done'
                      ? 'bg-white text-gov-navy border-gov-border'
                      : 'bg-gov-gray text-gov-muted border-gov-border'
                }`}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                {state === 'done' ? '✓ ' : ''}
                {s.label}
              </span>
              {i < visibleSteps.length - 1 && <span className="text-gov-border" aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 mb-4 px-3 py-2 border border-red-200 bg-red-50 rounded-md"
        >
          <AlertCircle size={16} className="text-state-danger mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-sm text-state-danger">
            <p>{error.message}</p>
            {error.details?.length > 1 && (
              <ul className="list-disc ml-4 mt-1">
                {error.details.map((d) => (
                  <li key={d.field}>{d.message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {loading && !options ? (
        <Busy label="Loading booking options" />
      ) : (
        <>
          {step === 1 && (
            <Step title="Choose a facility" hint="Any participating facility, in any district.">
              {loading ? (
                <Busy label="Loading facilities" />
              ) : (
                <RadioList
                  name="hospital"
                  items={sortByHomeDistrict(hospitals, workerDistrict)}
                  selectedId={draft.hospital?.id}
                  onSelect={(h) => set({ hospital: h, department: null, doctor: null })}
                  renderTitle={(h) => h.name}
                  renderMeta={(h) => `${h.district} · ${h.type} · ${h.doctorCount} practitioners`}
                />
              )}
            </Step>
          )}

          {step === 2 && (
            <Step title="Choose a department" hint={draft.hospital?.name}>
              {loading ? (
                <Busy label="Loading departments" />
              ) : (
                <RadioList
                  name="department"
                  items={departments.map((d) => ({ id: d.department, ...d }))}
                  selectedId={draft.department}
                  onSelect={(d) => set({ department: d.department, doctor: null })}
                  renderTitle={(d) => d.department}
                  renderMeta={(d) => `${d.doctorCount} practitioner${d.doctorCount === 1 ? '' : 's'}`}
                />
              )}
            </Step>
          )}

          {step === 3 && (
            <Step title="Choose a practitioner" hint={`${draft.department} · ${draft.hospital?.name}`}>
              {loading ? (
                <Busy label="Loading practitioners" />
              ) : (
                <RadioList
                  name="doctor"
                  items={doctors}
                  selectedId={draft.doctor?.id}
                  onSelect={(d) => set({ doctor: d })}
                  renderTitle={(d) => d.fullName}
                  renderMeta={(d) => `${d.department} · Reg. ${d.registrationNumber}`}
                />
              )}
            </Step>
          )}

          {step === 4 && (
            <Step
              title="Choose the type of consultation"
              hint="This sets how long the practitioner reserves for the visit."
            >
              <RadioList
                name="consultationType"
                items={options?.consultationTypes?.map((t) => ({ id: t.code, ...t })) || []}
                selectedId={draft.consultationType}
                onSelect={(t) => set({ consultationType: t.code, time: '' })}
                renderTitle={(t) => `${t.label} — ${formatDuration(t.durationMinutes)}`}
                renderMeta={(t) => t.description}
              />
            </Step>
          )}

          {step === 5 && (
            <Step
              title="Choose a date and time"
              hint={`${draft.doctor?.fullName || draft.doctor?.name} · ${
                formatDuration(durationMinutes || 0)
              } · ${draft.hospital?.name}`}
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="gov-label">Date</p>
                  <CalendarPicker
                    value={draft.date}
                    onChange={(date) => set({ date, time: '' })}
                    closedWeekdays={options?.clinicDay?.closedWeekdays || [0]}
                    maxAdvanceDays={options?.maxAdvanceDays || 60}
                    timeZone={options?.timeZone}
                  />
                </div>

                <div>
                  <p className="gov-label">
                    Time slot
                    {draft.date && (
                      <span className="font-normal text-gov-muted">
                        {' '}· {formatWeekday(draft.date)}, {formatDate(draft.date)}
                      </span>
                    )}
                  </p>

                  {!draft.date ? (
                    <p className="text-sm text-gov-muted border border-gov-border rounded-md px-3 py-4">
                      Select a date to see the available slots.
                    </p>
                  ) : slotsLoading ? (
                    <Busy label="Checking availability" />
                  ) : (
                    <SlotGrid
                      slots={availability?.slots || []}
                      value={draft.time}
                      onSelect={(time) => set({ time })}
                    />
                  )}

                  {!isReschedule && (
                    <div className="mt-4">
                      <label htmlFor="reason" className="gov-label">
                        Reason for the visit
                      </label>
                      <textarea
                        id="reason"
                        rows={3}
                        maxLength={300}
                        className="gov-input"
                        placeholder="For example: blood pressure review and repeat prescription"
                        value={draft.reason}
                        onChange={(e) => set({ reason: e.target.value })}
                        aria-describedby="reason-help"
                      />
                      <p id="reason-help" className="text-xs text-gov-muted mt-1">
                        {fieldError(error, 'reason') || 'Shown to the practitioner before the visit. 4–300 characters.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {draft.date && draft.time && (
                <Summary
                  draft={draft}
                  durationMinutes={durationMinutes}
                  isReschedule={isReschedule}
                  previous={rescheduleOf}
                />
              )}
            </Step>
          )}
        </>
      )}
    </Modal>
  );
}

/* ------------------------------ sub-components ---------------------------- */

function Step({ title, hint, children }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gov-navy">{title}</h3>
      {hint && <p className="text-sm text-gov-muted mb-3">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Busy({ label }) {
  return (
    <p className="flex items-center gap-2 text-sm text-gov-muted px-3 py-4 border border-gov-border rounded-md">
      <Loader2 size={16} aria-hidden="true" />
      {label}…
    </p>
  );
}

/** Radio semantics, card presentation — the whole row is the target. */
function RadioList({ name, items, selectedId, onSelect, renderTitle, renderMeta }) {
  if (!items.length) {
    return (
      <p className="text-sm text-gov-muted border border-gov-border rounded-md px-3 py-4">
        Nothing available to choose here.
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(item)}
            className={`text-left px-3 py-3 border rounded-md transition-colors duration-150 ${
              selected
                ? 'border-gov-teal bg-teal-50/60 ring-1 ring-gov-teal'
                : 'border-gov-border bg-white hover:bg-gov-gray'
            }`}
          >
            <span className="block text-sm font-medium text-gov-navy">{renderTitle(item)}</span>
            <span className="block text-xs text-gov-muted mt-0.5">{renderMeta(item)}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Unavailable slots stay on screen, disabled and labelled. A worker who sees
 * only three times cannot tell a busy clinic from a broken page.
 */
function SlotGrid({ slots, value, onSelect }) {
  if (!slots.length) {
    return (
      <p className="text-sm text-gov-muted border border-gov-border rounded-md px-3 py-4">
        No slots of this length are offered on this day.
      </p>
    );
  }

  const free = slots.filter((s) => s.available).length;

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Available time slots">
        {slots.map((slot) => {
          const selected = slot.start === value;
          return (
            <button
              key={slot.start}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!slot.available}
              onClick={() => onSelect(slot.start)}
              title={slot.available ? `${slot.start}–${slot.end}` : slot.unavailableReason}
              className={`px-2 py-2 text-sm border rounded-md transition-colors duration-150 ${
                selected
                  ? 'bg-gov-teal text-white border-gov-teal font-semibold'
                  : slot.available
                    ? 'bg-white border-gov-border text-gov-text hover:bg-gov-gray'
                    : 'bg-gov-gray border-gov-border text-gray-400 cursor-not-allowed line-through'
              }`}
            >
              {slot.start}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gov-muted mt-2" aria-live="polite">
        {free} of {slots.length} start times free. Struck-through times are already booked or have passed.
      </p>
    </>
  );
}

function Summary({ draft, durationMinutes, isReschedule, previous }) {
  const rows = [
    ['Facility', draft.hospital?.name],
    ['Department', draft.department],
    ['Practitioner', draft.doctor?.fullName || draft.doctor?.name],
    ['Date', `${formatWeekday(draft.date)}, ${formatDate(draft.date)}`],
    ['Time', `${draft.time} · ${formatDuration(durationMinutes || 0)}`],
  ];

  return (
    <div className="mt-5 border border-gov-border rounded-md">
      <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gov-navy bg-gov-gray border-b border-gov-border">
        {isReschedule ? 'New slot' : 'Confirm these details'}
      </p>
      <dl className="divide-y divide-gov-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4 px-4 py-2 text-sm">
            <dt className="w-32 shrink-0 text-gov-muted">{label}</dt>
            <dd className="text-gov-text">{value || '—'}</dd>
          </div>
        ))}
        {isReschedule && previous && (
          <div className="flex gap-4 px-4 py-2 text-sm">
            <dt className="w-32 shrink-0 text-gov-muted">Replaces</dt>
            <dd className="text-gov-text">
              {formatDate(previous.date)} at {previous.time}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/**
 * The worker's own district first. Continuity of care across districts is the
 * point of the system, so nothing is hidden — but the facility a person is
 * most likely to attend should not be scrolled to.
 */
function sortByHomeDistrict(hospitals, district) {
  if (!district) return hospitals;
  return [...hospitals].sort((a, b) => {
    const aHome = a.district === district ? 0 : 1;
    const bHome = b.district === district ? 0 : 1;
    return aHome - bHome || a.name.localeCompare(b.name);
  });
}
