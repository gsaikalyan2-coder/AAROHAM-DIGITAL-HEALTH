import { ShieldCheck, Phone } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { mentalHealthScreenings } from '../../data/mockData.js';

const TONE = { Minimal: 'success', Mild: 'warn', Moderate: 'warn', Severe: 'danger' };

export default function MentalHealth() {
  return (
    <>
      <PageHeader
        title="Mental Health"
        subtitle="Screening results are held in a stricter access tier and shared only with your consent."
      />

      <div className="gov-card p-4 mb-5 flex gap-3 border-l-4 border-l-gov-teal">
        <ShieldCheck size={20} className="text-gov-teal shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gov-muted">
          <strong className="text-gov-navy">Sensitive record tier.</strong> Only counsellors and
          doctors you have explicitly consented to can view this section. Every access is recorded
          in your audit log.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Screening History" className="lg:col-span-2" bodyClass="p-0">
          <DataTable
            rows={mentalHealthScreenings}
            emptyTitle="No screenings yet"
            columns={[
              { key: 'date', header: 'Date' },
              { key: 'instrument', header: 'Instrument', render: (r) => <span className="font-medium text-gov-navy">{r.instrument}</span> },
              { key: 'score', header: 'Score' },
              { key: 'severity', header: 'Severity', render: (r) => <Badge tone={TONE[r.severity]}>{r.severity}</Badge> },
              { key: 'counsellor', header: 'Counsellor' },
              { key: 'followUp', header: 'Follow-up' },
            ]}
          />
        </Card>

        <Card title="Support">
          <p className="text-sm text-gov-muted mb-4">
            Talking to someone helps. Support is free and available in multiple languages.
          </p>
          <div className="space-y-3 text-sm">
            <div className="border border-gov-border rounded-md p-3">
              <p className="font-medium text-gov-navy flex items-center gap-1.5">
                <Phone size={14} aria-hidden="true" /> Tele-MANAS
              </p>
              <p className="text-gov-muted">National mental health helpline · 14416</p>
            </div>
            <div className="border border-gov-border rounded-md p-3">
              <p className="font-medium text-gov-navy flex items-center gap-1.5">
                <Phone size={14} aria-hidden="true" /> DISHA Kerala
              </p>
              <p className="text-gov-muted">Kerala health helpline · 1056 / 104</p>
            </div>
          </div>
          <button type="button" className="gov-btn-primary w-full mt-4">Take a screening</button>
          <p className="text-xs text-gov-muted mt-3">PHQ-9 / GAD-7 instruments go live in Phase 16.</p>
        </Card>
      </div>
    </>
  );
}
