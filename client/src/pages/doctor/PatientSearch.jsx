import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, CreditCard, Plus, ShieldCheck, Eye } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import AbhaCardModal from '../../components/common/AbhaCardModal.jsx';
import CreateAbhaModal from '../../components/common/CreateAbhaModal.jsx';
import { api } from '../../lib/api.js';
import { searchableWorkers } from '../../data/mockData.js';

export default function PatientSearch() {
  const [query, setQuery] = useState('');
  const [dbPatients, setDbPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorkerForCard, setSelectedWorkerForCard] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadPatients = async () => {
    try {
      const res = await api.get('/doctor/patients');
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map((w) => ({
          id: w.id,
          mhid: w.ABHA_id || `14-1000-2000-${w.id}`,
          ABHA_id: w.ABHA_id,
          full_name: w.full_name,
          name: w.full_name,
          email: w.email,
          employer_phone_number: w.employer_phone_number,
          date_of_birth: w.date_of_birth,
          age: w.age || 30,
          gender: w.gender || 'Male',
          bloodGroup: w.blood_group || 'B+',
          district: w.home_state || 'Tamil Nadu',
          lastVisit: w.created_at ? new Date(w.created_at).toLocaleDateString() : 'Active',
          dbRecord: true,
          rawUser: w,
        }));
        setDbPatients(mapped);
      }
    } catch (err) {
      // Fallback to mock data if DB table empty
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const allRecords = [...dbPatients, ...searchableWorkers.filter(sw => !dbPatients.some(dp => dp.mhid === sw.mhid))];
  const q = query.trim().toLowerCase();
  const results = q
    ? allRecords.filter((w) =>
        (w.mhid && w.mhid.toLowerCase().includes(q)) ||
        (w.name && w.name.toLowerCase().includes(q)) ||
        (w.employer_phone_number && w.employer_phone_number.includes(q)) ||
        (w.email && w.email.toLowerCase().includes(q))
      )
    : allRecords;

  const handleOpenCard = (worker) => {
    setSelectedWorkerForCard(worker.rawUser || worker);
    setIsCardModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Patient Search & ABHA Registry"
        subtitle="Search any registered worker in Kerala by ABHA ID (e.g. 91-5330-6818-7855), Name, or Mobile Number."
        actions={
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#1A3B70] hover:bg-brand-800 text-white font-bold rounded-lg shadow-sm text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Register New ABHA Card
          </button>
        }
      />

      <Card bodyClass="p-5" className="mb-5">
        <label htmlFor="q" className="gov-label">ABHA ID, ABHA Address, or Worker Name</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gov-muted" aria-hidden="true" />
            <input
              id="q"
              className="gov-input pl-10 font-medium"
              placeholder="e.g. 91-5330-6818-7855, kalgiswar@abdm, or Kalgiswar V"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="button" className="gov-btn-primary sm:w-auto">
            <Search size={16} aria-hidden="true" /> Search DB
          </button>
        </div>
        <p className="text-xs text-gov-muted mt-2">
          Showing {results.length} registered patient profiles ({dbPatients.length} live from PostgreSQL).
        </p>
      </Card>

      <Card title="Patient Registry Results" bodyClass="p-0">
        <DataTable
          rows={results}
          emptyTitle="No matching worker record"
          emptyMessage="Check the ABHA ID or name and try again."
          columns={[
            { key: 'mhid', header: 'ABHA / Health ID', render: (r) => <span className="font-mono font-bold text-slate-900 dark:text-white">{r.mhid}</span> },
            { key: 'name', header: 'Worker Name', render: (r) => <span className="font-bold text-gov-navy">{r.name}</span> },
            { key: 'age', header: 'Age' },
            { key: 'gender', header: 'Gender' },
            { key: 'bloodGroup', header: 'Blood' },
            { key: 'district', header: 'Native State' },
            {
              key: 'card',
              header: 'ABHA Digital Card',
              render: (r) => (
                <button
                  type="button"
                  onClick={() => handleOpenCard(r)}
                  className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded font-semibold text-xs flex items-center gap-1.5"
                >
                  <Eye size={13} />
                  <span>View Official Card</span>
                </button>
              ),
            },
            {
              key: 'action',
              header: '',
              render: (r) => (
                <Link to={`/doctor/patient/${r.mhid}`} className="gov-btn-outline">Open Record</Link>
              ),
            },
          ]}
        />
      </Card>

      {/* Official ABHA Card Viewer Modal */}
      <AbhaCardModal
        worker={selectedWorkerForCard}
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      {/* Create New ABHA Card Modal */}
      <CreateAbhaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => loadPatients()}
      />
    </>
  );
}
