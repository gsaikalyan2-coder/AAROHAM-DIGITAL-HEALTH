import { ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { auditLogs } from '../../data/mockData.js';

export default function AuditLogs() {
  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="Append-only record of every read and write against health data."
      />

      <div className="gov-card p-4 mb-5 flex gap-3 border-l-4 border-l-gov-teal">
        <ShieldCheck size={20} className="text-gov-teal shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-gov-muted">
          Audit rows are never edited or deleted. Workers can see who accessed their own record
          from their profile page.
        </p>
      </div>

      <Card title="Access Trail" bodyClass="p-0">
        <DataTable
          rows={auditLogs}
          columns={[
            { key: 'time', header: 'Timestamp', render: (r) => <span className="font-mono text-sm">{r.time}</span> },
            { key: 'actor', header: 'Actor', render: (r) => <span className="font-medium text-gov-navy">{r.actor}</span> },
            { key: 'role', header: 'Role', render: (r) => <Badge tone={r.role === 'Admin' ? 'info' : 'neutral'}>{r.role}</Badge> },
            { key: 'action', header: 'Action', render: (r) => <span className="font-mono text-sm">{r.action}</span> },
            { key: 'entity', header: 'Entity', render: (r) => <span className="font-mono text-sm">{r.entity}</span> },
            { key: 'ip', header: 'IP' },
          ]}
        />
      </Card>
      <p className="text-xs text-gov-muted mt-3">Live audit middleware lands in Phase 19.</p>
    </>
  );
}
