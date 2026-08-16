import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import { api } from '../../lib/api.js';
import { searchableWorkers } from '../../data/mockData.js';

export default function DoctorPatients() {
  const [patients, setPatients] = useState(searchableWorkers);

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await api.get('/doctor/patients');
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map((w) => ({
            mhid: w.ABHA_id || `KL-EKM-${w.id}`,
            name: w.full_name,
            age: w.age || 30,
            district: w.home_state || 'West Bengal',
            lastVisit: w.created_at ? new Date(w.created_at).toLocaleDateString() : 'Active',
          }));
          setPatients([...mapped, ...searchableWorkers.filter(sw => !mapped.some(m => m.mhid === sw.mhid))]);
        }
      } catch (err) {
        // Fallback to searchableWorkers
      }
    }
    loadPatients();
  }, []);

  return (
    <>
      <PageHeader title="My Patients" subtitle="Workers registered and treated at participating hospitals in Kerala." />
      <Card title="Patient List" bodyClass="p-0">
        <DataTable
          rows={patients}
          columns={[
            { key: 'mhid', header: 'ABHA / Health ID', render: (r) => <span className="font-mono text-sm">{r.mhid}</span> },
            { key: 'name', header: 'Worker Name', render: (r) => <span className="font-medium text-gov-navy">{r.name}</span> },
            { key: 'age', header: 'Age' },
            { key: 'district', header: 'Home State / District' },
            { key: 'lastVisit', header: 'Registration Date' },
            { key: 'action', header: '', render: (r) => (
                <Link to={`/doctor/patient/${r.mhid}`} className="text-sm gov-link font-medium">Open record</Link>
              ) },
          ]}
        />
      </Card>
    </>
  );
}
