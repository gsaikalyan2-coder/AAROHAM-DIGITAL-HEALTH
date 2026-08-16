import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, RefreshCw } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  STATUS_TONE,
  formatDate,
  formatDuration,
  formatWeekday,
  getDoctorAppointments,
  todayIso,
} from '../../lib/appointments.js';

/**
 * The practitioner's schedule, read from the same `appointments` rows the
 * worker portal writes. A booking made by a worker appears here as soon as the
 * list is loaded; a cancellation appears as a Cancelled row rather than as a
 * silent disappearance, and a rescheduled visit is labelled as moved.
 *
 * Two views:
 *   Today    the clinic day, which is what the queue needs
 *   Upcoming everything from today forward, for planning
 */
export default function DoctorAppointments() {
  const { user } = useAuth();
  const doctorId = user?.doctorId || null;

  const [view, setView] = useState('today');
  const [showCancelled, setShowCancelled] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = todayIso();

  const load = useCallback(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getDoctorAppointments({
      doctorId,
      ...(view === 'today' ? { date: today } : { from: today }),
      includeCancelled: showCancelled,
    })
      .then((list) => {
        setAppointments(list);
        setError(null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [doctorId, view, showCancelled, today]);

  useEffect(load, [load]);

  if (!doctorId) {
    return (
      <>
        <PageHeader title="Appointments" subtitle="Your schedule." />
        <Card bodyClass="p-0">
          <EmptyState
            icon={AlertCircle}
            title="This session is not linked to a registered practitioner"
            message="Sign in with a registered email address to see the appointments booked against you."
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle={
          view === 'today'
            ? `${formatWeekday(today)}, ${formatDate(today)}`
            : `From ${formatDate(today)} onwards`
        }
        actions={
          <>
            <div className="inline-flex rounded-md border border-gov-border overflow-hidden" role="group" aria-label="Schedule range">
              {[
                { id: 'today', label: 'Today' },
                { id: 'upcoming', label: 'Upcoming' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={view === tab.id}
                  onClick={() => setView(tab.id)}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                    view === tab.id ? 'bg-gov-navy text-white' : 'bg-white text-gov-navy hover:bg-gov-gray'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button type="button" className="gov-btn-outline" onClick={load} disabled={loading}>
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
          </>
        }
      />

      {error && (
        <div role="alert" className="flex items-start gap-2 mb-4 px-3 py-2 border border-red-200 bg-red-50 rounded-md">
          <AlertCircle size={16} className="text-state-danger mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-state-danger">{error.message}</p>
        </div>
      )}

      <Card
        title={view === 'today' ? `Today · ${formatDate(today)}` : 'Upcoming schedule'}
        bodyClass="p-0"
        action={
          <label className="flex items-center gap-2 text-sm text-gov-muted">
            <input
              type="checkbox"
              className="rounded border-gov-border text-gov-teal focus:ring-gov-teal"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
            />
            Show cancelled
          </label>
        }
      >
        {loading ? (
          <p className="px-5 py-6 text-sm text-gov-muted">Loading schedule…</p>
        ) : (
          <DataTable
            rows={appointments}
            emptyTitle={view === 'today' ? 'No appointments today' : 'Nothing booked ahead'}
            emptyMessage="Appointments booked by workers in the worker portal appear here."
            columns={[
              {
                key: 'time',
                header: 'Time',
                render: (r) => (
                  <div>
                    <p className="font-medium text-gov-navy">{r.time}–{r.endTime}</p>
                    <p className="text-xs text-gov-muted">{formatDuration(r.durationMinutes)}</p>
                    {view === 'upcoming' && (
                      <p className="text-xs text-gov-muted">{formatDate(r.date)}</p>
                    )}
                  </div>
                ),
              },
              {
                key: 'patient',
                header: 'Patient',
                render: (r) => (
                  <div>
                    <p className="font-medium text-gov-navy">{r.worker.name}</p>
                    <p className="text-xs text-gov-muted">
                      {[r.worker.gender, r.worker.age ? `${r.worker.age} yrs` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                ),
              },
              {
                key: 'mhid',
                header: 'MHID',
                render: (r) => <span className="font-mono text-sm">{r.worker.mhid}</span>,
              },
              {
                key: 'reason',
                header: 'Reason',
                render: (r) => (
                  <div className="max-w-[18rem]">
                    <p>{r.reason || '—'}</p>
                    <p className="text-xs text-gov-muted">{r.consultationLabel}</p>
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
                      <p className="text-xs text-gov-saffron">Rescheduled by worker</p>
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
                render: (r) => (
                  <Link
                    to={`/doctor/patient/${r.worker.mhid}`}
                    className="text-sm gov-link whitespace-nowrap"
                  >
                    Open record
                  </Link>
                ),
              },
            ]}
          />
        )}
      </Card>

      <p className="flex items-center gap-2 text-xs text-gov-muted mt-3">
        <CalendarDays size={14} aria-hidden="true" />
        Live from the appointments register. Bookings, cancellations and reschedules made in the
        worker portal are reflected here on refresh.
      </p>
    </>
  );
}
