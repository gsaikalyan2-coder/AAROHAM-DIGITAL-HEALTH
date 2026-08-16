import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { prescriptions, demoWorker, consultations } from '../../data/mockData.js';
import { downloadPrescription } from '../../lib/prescription/document.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Prescriptions() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onDownload = async () => {
    setBusy(true);
    setError('');
    try {
      const activeWorker = user
        ? {
            ...demoWorker,
            name: user.full_name || user.name || demoWorker.name,
            mhid: user.ABHA_id || demoWorker.mhid,
            age: user.age || demoWorker.age,
            gender: user.gender || demoWorker.gender,
            bloodGroup: user.blood_group || demoWorker.bloodGroup,
            nativeState: user.home_state || demoWorker.nativeState,
            address: user.current_address || demoWorker.address,
            employer: user.employer_name || demoWorker.employer,
          }
        : demoWorker;

      await downloadPrescription({ worker: activeWorker, consultations, prescriptions });
    } catch {
      setError('Could not generate the prescription. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Prescriptions"
        subtitle="Medicines prescribed to you across all hospitals."
        actions={
          <div className="text-right">
            <button type="button" onClick={onDownload} disabled={busy} className="gov-btn-outline">
              {busy
                ? <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                : <FileDown size={16} aria-hidden="true" />}
              {busy ? 'Preparing…' : 'Download Prescription'}
            </button>
            {error && <p className="text-xs text-state-danger mt-1.5">{error}</p>}
          </div>
        }
      />
      <Card title="All Prescriptions" bodyClass="p-0">
        <DataTable
          rows={prescriptions}
          emptyTitle="No prescriptions recorded"
          columns={[
            { key: 'date', header: 'Date' },
            { key: 'medicine', header: 'Medicine', render: (r) => <span className="font-medium text-gov-navy">{r.medicine}</span> },
            { key: 'dosage', header: 'Dosage' },
            { key: 'frequency', header: 'Frequency' },
            { key: 'duration', header: 'Duration' },
            { key: 'doctor', header: 'Prescribed by' },
            { key: 'active', header: 'Status', render: (r) => (
                <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Completed'}</Badge>
              ) },
          ]}
        />
      </Card>
    </>
  );
}
