import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarPlus, CheckCircle2, RefreshCw, X } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Modal from '../../components/common/Modal.jsx';
import BookAppointmentModal from '../../components/appointments/BookAppointmentModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  STATUS_TONE,
  cancelAppointment,
  formatDate,
  formatDuration,
  getWorkerAppointments,
  todayIso,
} from '../../lib/appointments.js';

/**
 * The worker's own appointment list, read from the register rather than from
 * demonstration data. Booking, rescheduling and cancelling all write through
 * /api/v1/appointments, and every one of those writes is visible in the doctor
 * portal on its next load — the two portals read the same rows.
 */
export default function WorkerAppointments() {
  const { user } = useAuth();
  const mhid = user?.mhid || null;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [booking, setBooking] = useState(false);
  const [rescheduling, setRescheduling] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const load = useCallback(() => {
    if (!mhid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getWorkerAppointments(mhid)
      .then((list) => {
        setAppointments(list);
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [mhid]);

  useEffect(load, [load]);

  const onWritten = (appointment, action) => {
    setNotice(
      action === 'rescheduled'
        ? `Appointment moved to ${formatDate(appointment.date)} at ${appointment.time}.`
        : `Appointment confirmed for ${formatDate(appointment.date)} at ${appointment.time}.`
    );
    load();
  };

  const confirmCancel = async () => {
    setCancelBusy(true);
    try {
      await cancelAppointment(cancelling.id, { mhid, reason: cancelReason.trim() || undefined });
      setNotice(`Appointment on ${formatDate(cancelling.date)} cancelled.`);
      setCancelling(null);
      setCancelReason('');
      load();
    } catch (err) {
      setError(err);
      setCancelling(null);
    } finally {
      setCancelBusy(false);
    }
  };

  const today = todayIso();
  const canAct = (a) => ['Scheduled', 'Confirmed'].includes(a.status);

  /* ----------------------------- unregistered ---------------------------- */

  if (!mhid) {
    return (
      <>
        <PageHeader title="Appointments" subtitle="Upcoming visits and follow-up schedule." />
        <Card bodyClass="p-0">
          <EmptyState
            icon={AlertCircle}
            title="This session is not linked to a registered beneficiary"
            message="Sign in with a mobile number that exists in the register to view and book appointments."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle="Upcoming visits and follow-up schedule."
        actions={
          <>
            <button type="button" className="gov-btn-outline" onClick={load} disabled={loading}>
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
            <button type="button" className="gov-btn-primary" onClick={() => setBooking(true)}>
              <CalendarPlus size={16} aria-hidden="true" />
              Book appointment
            </button>
          </>
        }
      />

      {notice && (
        <div
          role="status"
          className="flex items-start gap-2 mb-4 px-3 py-2 border border-green-200 bg-green-50 rounded-md"
        >
          <CheckCircle2 size={16} className="text-state-success mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-state-success flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
            className="text-state-success/70 hover:text-state-success transition-colors duration-150"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2 mb-4 px-3 py-2 border border-red-200 bg-red-50 rounded-md">
          <AlertCircle size={16} className="text-state-danger mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-state-danger">
            {error.message}
            {error.code === 'REQUEST_FAILED' || error.message?.includes('fetch')
              ? ' — check that the API server is running.'
              : ''}
          </p>
        </div>
      )}

      <Card title="All Appointments" bodyClass="p-0">
        {loading ? (
          <p className="px-5 py-6 text-sm text-gov-muted">Loading appointments…</p>
        ) : (
          <DataTable
            rows={appointments}
            emptyTitle="No appointments yet"
            emptyMessage="Use “Book appointment” to reserve a slot at any participating facility."
            columns={[
              {
                key: 'date',
                header: 'Date',
                render: (r) => (
                  <div>
                    <p className="font-medium text-gov-navy">{formatDate(r.date)}</p>
                    {r.date === today && <p className="text-xs text-gov-saffron">Today</p>}
                  </div>
                ),
              },
              {
                key: 'time',
                header: 'Time',
                render: (r) => (
                  <div>
                    <p>{r.time}–{r.endTime}</p>
                    <p className="text-xs text-gov-muted">{formatDuration(r.durationMinutes)}</p>
                  </div>
                ),
              },
              { key: 'hospital', header: 'Hospital', render: (r) => r.hospital.name },
              { key: 'department', header: 'Department' },
              { key: 'doctor', header: 'Doctor', render: (r) => r.doctor?.name || '—' },
              {
                key: 'consultation',
                header: 'Consultation',
                render: (r) => (
                  <div>
                    <p>{r.consultationLabel}</p>
                    {r.reason && <p className="text-xs text-gov-muted max-w-[16rem]">{r.reason}</p>}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <div className="space-y-1">
                    <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    {r.wasRescheduled && r.status !== 'Cancelled' && (
                      <p className="text-xs text-gov-muted">Rescheduled</p>
                    )}
                    {r.status === 'Cancelled' && r.cancellationReason && (
                      <p className="text-xs text-gov-muted max-w-[12rem]">{r.cancellationReason}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (r) =>
                  canAct(r) ? (
                    <div className="flex gap-3 whitespace-nowrap">
                      <button type="button" className="text-sm gov-link" onClick={() => setRescheduling(r)}>
                        Reschedule
                      </button>
                      <button
                        type="button"
                        className="text-sm text-state-danger hover:underline"
                        onClick={() => { setCancelling(r); setCancelReason(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gov-muted">—</span>
                  ),
              },
            ]}
          />
        )}
      </Card>

      <BookAppointmentModal
        open={booking}
        onClose={() => setBooking(false)}
        onBooked={onWritten}
        mhid={mhid}
        workerDistrict={user?.currentDistrict}
      />

      <BookAppointmentModal
        open={Boolean(rescheduling)}
        onClose={() => setRescheduling(null)}
        onBooked={onWritten}
        mhid={mhid}
        workerDistrict={user?.currentDistrict}
        rescheduleOf={rescheduling}
      />

      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        size="md"
        title="Cancel this appointment?"
        subtitle={
          cancelling
            ? `${formatDate(cancelling.date)} at ${cancelling.time} · ${cancelling.doctor?.name || 'Practitioner'}`
            : ''
        }
        footer={
          <div className="flex items-center justify-between gap-3">
            <button type="button" className="gov-btn-outline" onClick={() => setCancelling(null)} disabled={cancelBusy}>
              Keep appointment
            </button>
            <button
              type="button"
              className="gov-btn bg-state-danger text-white hover:bg-red-800"
              onClick={confirmCancel}
              disabled={cancelBusy}
            >
              {cancelBusy ? 'Cancelling…' : 'Cancel appointment'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gov-text">
          The slot is released immediately and the practitioner's list is updated. The record of the
          booking is kept — health-service records are never deleted.
        </p>
        <label htmlFor="cancel-reason" className="gov-label mt-4">
          Reason (optional)
        </label>
        <input
          id="cancel-reason"
          className="gov-input"
          maxLength={300}
          placeholder="For example: returning to native place"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>
    </>
  );
}
