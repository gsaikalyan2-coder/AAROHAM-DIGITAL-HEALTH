import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, FlaskConical, Repeat, Search } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { doctorStats, doctorQueue, diseaseTrends } from '../../data/mockData.js';
import {
  STATUS_TONE,
  formatDuration,
  getDoctorAppointments,
  todayIso,
} from '../../lib/appointments.js';

const ICONS = [CalendarDays, Users, FlaskConical, Repeat];
const TONES = ['teal', 'navy', 'saffron', 'success'];

/**
 * The queue is read from the appointments register when the session is linked
 * to a registered practitioner, and falls back to the demonstration rows when
 * it is not. Showing live bookings beside stale demonstration rows in the same
 * table would be worse than showing either alone.
 */
export default function DoctorDashboard() {
  const { user } = useAuth();
  const doctorId = user?.doctorId || null;

  const [live, setLive] = useState(null);
  const [dbQueue, setDbQueue] = useState([]);

  useEffect(() => {
    async function loadDbQueue() {
      try {
        const res = await api.get('/doctor/patients');
        if (res.data && res.data.length > 0) {
          const mapped = res.data.slice(0, 5).map((w, idx) => ({
            id: `db_q_${w.id}`,
            time: `09:${30 + idx * 20}`,
            mhid: w.ABHA_id || `14-1000-2000-${1000 + idx}`,
            name: w.full_name,
            age: w.age || 30,
            reason: w.previous_health_issues ? w.previous_health_issues.split('|')[0] : 'Occupational Health Check',
            status: idx === 0 ? 'In consultation' : idx < 3 ? 'Waiting' : 'Scheduled',
          }));
          setDbQueue(mapped);
        }
      } catch (err) {
        // Fallback to doctorQueue
      }
    }
    loadDbQueue();

    if (!doctorId) return;
    getDoctorAppointments({ doctorId, date: todayIso(), includeCancelled: false })
      .then(setLive)
      .catch(() => setLive(null));
  }, [doctorId]);

  const rows = live
    ? live.map((a) => ({
        id: a.id,
        time: `${a.time}–${a.endTime}`,
        name: a.worker.name,
        mhid: a.worker.mhid,
        age: a.worker.age ?? '—',
        reason: a.reason || a.consultationLabel,
        duration: formatDuration(a.durationMinutes),
        status: a.status,
      }))
    : dbQueue.length > 0
    ? dbQueue
    : doctorQueue.map((q) => ({ ...q, duration: null }));

  const QUEUE_TONE = live
    ? STATUS_TONE
    : { Waiting: 'warn', 'In consultation': 'info', Scheduled: 'neutral' };

  return (
    <>
      <PageHeader
        title="Doctor Dashboard"
        subtitle="Govt. General Hospital, Ernakulam · General Medicine"
        actions={<Link to="/doctor/search" className="gov-btn-primary"><Search size={16} aria-hidden="true" /> Search patient by MHID</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-5">
        {doctorStats.map((s, i) => <StatCard key={s.label} {...s} icon={ICONS[i]} tone={TONES[i]} />)}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card
          title="Today's Patient Queue"
          className="xl:col-span-2"
          bodyClass="p-0"
          action={<Link to="/doctor/appointments" className="text-sm gov-link">All appointments</Link>}
        >
          <DataTable
            rows={rows}
            emptyTitle="No appointments today"
            emptyMessage="Bookings made in the worker portal appear here."
            columns={[
              {
                key: 'time',
                header: 'Time',
                render: (r) => (
                  <div>
                    <p>{r.time}</p>
                    {r.duration && <p className="text-xs text-gov-muted">{r.duration}</p>}
                  </div>
                ),
              },
              { key: 'name', header: 'Patient', render: (r) => (
                  <div>
                    <p className="font-medium text-gov-navy">{r.name}</p>
                    <p className="text-xs text-gov-muted font-mono">{r.mhid}</p>
                  </div>
                ) },
              { key: 'age', header: 'Age' },
              { key: 'reason', header: 'Reason' },
              { key: 'status', header: 'Status', render: (r) => <Badge tone={QUEUE_TONE[r.status]}>{r.status}</Badge> },
              { key: 'action', header: '', render: (r) => (
                  <Link to={`/doctor/patient/${r.mhid}`} className="text-sm gov-link whitespace-nowrap">Open record</Link>
                ) },
            ]}
          />
        </Card>

        <Card title="Presenting Conditions (30 days)" bodyClass="p-4 space-y-3">
          {diseaseTrends.slice(0, 5).map((d) => (
            <div key={d.condition}>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="truncate">{d.condition}</span>
                <span className="text-gov-muted shrink-0">{d.share}%</span>
              </div>
              <div className="h-1.5 bg-gov-gray rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gov-teal" style={{ width: `${d.share * 4}%` }} />
              </div>
            </div>
          ))}
          <p className="text-xs text-gov-muted pt-2">Chart.js visualisations land in Phase 18.</p>
        </Card>
      </div>
    </>
  );
}
