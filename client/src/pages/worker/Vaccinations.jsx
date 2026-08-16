import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { vaccinations } from '../../data/mockData.js';

const TONE = { Complete: 'success', Due: 'danger', Pending: 'warn' };

export default function Vaccinations() {
  const complete = vaccinations.filter((v) => v.status === 'Complete').length;
  return (
    <>
      <PageHeader title="Vaccinations" subtitle="Immunisation history and what is due next." />

      <div className="gov-card p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium text-gov-navy">Coverage</p>
          <p className="text-sm text-gov-muted">{complete} of {vaccinations.length} complete</p>
        </div>
        <div className="h-2 bg-gov-gray rounded-full overflow-hidden border border-gov-border">
          <div className="h-full bg-gov-teal" style={{ width: `${(complete / vaccinations.length) * 100}%` }} />
        </div>
      </div>

      <Card title="Immunisation Record" bodyClass="p-0">
        <DataTable
          rows={vaccinations}
          columns={[
            { key: 'vaccine', header: 'Vaccine', render: (r) => <span className="font-medium text-gov-navy">{r.vaccine}</span> },
            { key: 'dose', header: 'Dose' },
            { key: 'date', header: 'Administered' },
            { key: 'nextDue', header: 'Next due' },
            { key: 'status', header: 'Status', render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
          ]}
        />
      </Card>
    </>
  );
}
