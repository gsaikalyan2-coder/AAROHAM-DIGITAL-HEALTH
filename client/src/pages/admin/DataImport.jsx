import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { importHistory } from '../../data/mockData.js';

export default function DataImport() {
  return (
    <>
      <PageHeader
        title="Data Import"
        subtitle="Bring worker registrations in from Google Forms or CSV. Every row is validated before it is stored."
      />

      <div className="grid gap-5 lg:grid-cols-3 mb-5">
        <Card title="Upload File" className="lg:col-span-2">
          <div className="border-2 border-dashed border-gov-border rounded-md p-8 text-center">
            <UploadCloud size={32} className="mx-auto text-gov-muted mb-3" aria-hidden="true" />
            <p className="font-medium text-gov-navy">Drop a CSV file here</p>
            <p className="text-sm text-gov-muted mt-1">or connect a Google Sheet by URL</p>
            <button type="button" className="gov-btn-primary mt-4">Select file</button>
          </div>
          <p className="text-xs text-gov-muted mt-3">
            Import pipeline with per-row Zod validation, dry-run preview and idempotent upsert
            lands in Phase 9.
          </p>
        </Card>

        <Card title="Expected Columns">
          <ul className="text-sm space-y-1.5 text-gov-muted">
            {['name', 'mobile', 'date_of_birth', 'gender', 'native_state', 'current_district', 'employer', 'occupation', 'emergency_contact', 'abha_id (optional)'].map((c) => (
              <li key={c} className="flex items-center gap-2">
                <FileSpreadsheet size={14} className="text-gov-teal shrink-0" aria-hidden="true" />
                <code className="text-xs">{c}</code>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Import History" bodyClass="p-0">
        <DataTable
          rows={importHistory}
          columns={[
            { key: 'date', header: 'Date' },
            { key: 'file', header: 'File', render: (r) => <span className="font-mono text-sm">{r.file}</span> },
            { key: 'rows', header: 'Rows' },
            { key: 'imported', header: 'Imported' },
            { key: 'failed', header: 'Failed' },
            { key: 'status', header: 'Status', render: (r) => (
                <Badge tone={r.failed ? 'warn' : 'success'}>{r.status}</Badge>
              ) },
          ]}
        />
      </Card>
    </>
  );
}
