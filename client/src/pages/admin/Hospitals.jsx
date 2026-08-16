import { Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { hospitals } from '../../data/mockData.js';

export default function Hospitals() {
  return (
    <>
      <PageHeader
        title="Participating Hospitals"
        subtitle="Facilities authorised to read and write worker health records."
        actions={<button type="button" className="gov-btn-primary"><Plus size={16} aria-hidden="true" /> Add hospital</button>}
      />
      <Card title="Hospital Network" bodyClass="p-0">
        <DataTable
          rows={hospitals}
          columns={[
            { key: 'name', header: 'Hospital', render: (r) => <span className="font-medium text-gov-navy">{r.name}</span> },
            { key: 'district', header: 'District' },
            { key: 'type', header: 'Type' },
            { key: 'doctors', header: 'Doctors' },
            { key: 'status', header: 'Status', render: (r) => (
                <Badge tone={r.status === 'Active' ? 'success' : 'warn'}>{r.status}</Badge>
              ) },
          ]}
        />
      </Card>
    </>
  );
}
