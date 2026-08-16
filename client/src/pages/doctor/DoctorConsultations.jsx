import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { consultations } from '../../data/mockData.js';

export default function DoctorConsultations() {
  return (
    <>
      <PageHeader title="Consultations" subtitle="Consultations you have recorded." />
      <Card title="Recent Consultations" bodyClass="p-0">
        <DataTable
          rows={consultations}
          columns={[
            { key: 'date', header: 'Date' },
            { key: 'diagnosis', header: 'Diagnosis', render: (r) => <span className="font-medium text-gov-navy">{r.diagnosis}</span> },
            { key: 'department', header: 'Department' },
            { key: 'hospital', header: 'Hospital' },
            { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          ]}
        />
      </Card>
      <p className="text-xs text-gov-muted mt-3">Consultation entry becomes functional in Phase 12.</p>
    </>
  );
}
