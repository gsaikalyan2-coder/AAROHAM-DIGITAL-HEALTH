import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { districtStats, diseaseTrends } from '../../data/mockData.js';

export default function Analytics() {
  const maxCases = Math.max(...diseaseTrends.map((d) => d.cases));

  return (
    <>
      <PageHeader
        title="Health Analytics"
        subtitle="Aggregate, non-identifiable indicators for planning. No individual record is exposed here."
      />

      <div className="grid gap-5 xl:grid-cols-2 mb-5">
        <Card title="Disease Trend (30 days)" bodyClass="p-5 space-y-3">
          {diseaseTrends.map((d) => (
            <div key={d.condition}>
              <div className="flex items-center justify-between text-sm mb-1 gap-2">
                <span className="truncate">{d.condition}</span>
                <span className="text-gov-muted shrink-0">{d.cases.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-2.5 bg-gov-gray rounded-full overflow-hidden border border-gov-border">
                <div className="h-full bg-gov-navy" style={{ width: `${(d.cases / maxCases) * 100}%` }} />
              </div>
            </div>
          ))}
        </Card>

        <Card title="Vaccination Coverage by District" bodyClass="p-5 space-y-3">
          {districtStats.map((d) => (
            <div key={d.district}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>{d.district}</span>
                <span className="text-gov-muted">{d.coverage}</span>
              </div>
              <div className="h-2.5 bg-gov-gray rounded-full overflow-hidden border border-gov-border">
                <div
                  className={`h-full ${parseInt(d.coverage, 10) >= 78 ? 'bg-state-success' : 'bg-gov-saffron'}`}
                  style={{ width: d.coverage }}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-gov-muted pt-1">State target: 85%</p>
        </Card>
      </div>

      <Card title="District Summary" bodyClass="p-0">
        <DataTable
          rows={districtStats.map((d) => ({ ...d, id: d.district }))}
          columns={[
            { key: 'district', header: 'District', render: (r) => <span className="font-medium text-gov-navy">{r.district}</span> },
            { key: 'workers', header: 'Registered workers', render: (r) => r.workers.toLocaleString('en-IN') },
            { key: 'hospitals', header: 'Hospitals' },
            { key: 'visits30d', header: 'Visits (30d)', render: (r) => r.visits30d.toLocaleString('en-IN') },
            { key: 'coverage', header: 'Vaccination', render: (r) => (
                <Badge tone={parseInt(r.coverage, 10) >= 78 ? 'success' : 'warn'}>{r.coverage}</Badge>
              ) },
          ]}
        />
      </Card>
      <p className="text-xs text-gov-muted mt-3">
        All figures are demonstration data. Live SQL aggregates land in Phase 18.
      </p>
    </>
  );
}
