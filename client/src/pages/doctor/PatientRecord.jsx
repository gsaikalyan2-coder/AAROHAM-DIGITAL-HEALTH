import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, MapPin, FilePlus2, ArrowLeft, Eye, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import AbhaCardModal from '../../components/common/AbhaCardModal.jsx';
import { api } from '../../lib/api.js';
import { demoWorker, consultations, prescriptions, vaccinations, searchableWorkers } from '../../data/mockData.js';

export default function PatientRecord() {
  const { mhid } = useParams();
  const match = searchableWorkers.find((w) => w.mhid === mhid);
  const [patientData, setPatientData] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  useEffect(() => {
    async function loadPatientDetails() {
      try {
        const res = await api.get(`/doctor/patient-search?queryStr=${encodeURIComponent(mhid)}`);
        if (res.data && res.data.worker) {
          setPatientData(res.data.worker);
        }
      } catch (err) {
        // Fallback to match or demo
      }
    }
    loadPatientDetails();
  }, [mhid]);

  const p = patientData || match || demoWorker;
  const name = p.full_name || p.name || 'Verified Patient';
  const age = p.age || 32;
  const gender = p.gender || 'Male';
  const bloodGroup = p.blood_group || p.bloodGroup || 'B+';
  const district = p.home_state || p.district || 'Ernakulam';
  const allergies = p.previous_health_issues ? [p.previous_health_issues] : demoWorker.allergies;

  return (
    <>
      <Link to="/doctor/search" className="inline-flex items-center gap-1.5 text-sm gov-link mb-3">
        <ArrowLeft size={14} aria-hidden="true" /> Back to search
      </Link>

      <PageHeader
        title={name}
        subtitle={`ABHA ID: ${p.ABHA_id || mhid} · ${age} yrs · ${gender} · ${district}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCardModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Eye size={15} />
              <span>View Official ABHA Card</span>
            </button>
            <button type="button" className="gov-btn-primary">
              <FilePlus2 size={16} aria-hidden="true" /> Add consultation
            </button>
          </div>
        }
      />

      <AbhaCardModal
        worker={p}
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      {/* Safety banner — shown before anything else a doctor might prescribe on */}
      <div className="gov-card p-4 mb-5 border-l-4 border-l-state-danger">
        <p className="flex items-center gap-2 font-semibold text-state-danger mb-2">
          <AlertTriangle size={18} aria-hidden="true" /> Clinical safety flags
        </p>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-gov-muted mb-1">Allergies / Health History</p>
            <div className="flex flex-wrap gap-1.5">{allergies.map((a) => <Badge key={a} tone="danger">{a}</Badge>)}</div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gov-muted mb-1">Vaccination Status</p>
            <div className="flex flex-wrap gap-1.5"><Badge tone="success">{p.is_vaccinated ? 'Vaccinated' : 'Verified'}</Badge></div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gov-muted mb-1">Blood group</p>
            <Badge tone="danger">{bloodGroup}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Cross-Hospital History" className="xl:col-span-2" bodyClass="p-5">
          <ol>
            {consultations.map((c, i) => (
              <li key={c.id} className="flex gap-4 pb-5 last:pb-0">
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-3 h-3 rounded-full bg-gov-teal ring-4 ring-gov-teal/15 mt-1.5" />
                  {i < consultations.length - 1 && <span className="w-px flex-1 bg-gov-border mt-1" />}
                </div>
                <div className="flex-1 border border-gov-border rounded-md p-4">
                  <p className="font-semibold text-gov-navy">{c.diagnosis}</p>
                  <p className="text-sm text-gov-muted mt-1 flex items-center gap-1.5">
                    <MapPin size={14} aria-hidden="true" /> {c.hospital} · {c.district}
                  </p>
                  <p className="text-sm mt-2">{c.date} · {c.doctor} · {c.department}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-5">
          {/* Diagnostic & Lab Reports Connected to Database */}
          <Card title="Lab &amp; Diagnostic Reports" bodyClass="p-4 space-y-3">
            {patientData && patientData.labReports && patientData.labReports.length > 0 ? (
              patientData.labReports.map((l) => (
                <div key={l.id} className="text-xs border-b border-slate-200 dark:border-slate-800 last:border-0 pb-2 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 dark:text-white">{l.test_name}</p>
                    <Badge tone="success">{l.result || 'Normal'}</Badge>
                  </div>
                  <p className="text-slate-500">{l.notes || 'Routine screening'}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 space-y-2">
                <p>No custom lab reports issued yet in database.</p>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1">
                  <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                    <span>Complete Blood Count (CBC)</span>
                    <span className="text-emerald-600">Normal</span>
                  </div>
                  <p className="text-[11px] text-slate-400">HB%: 14.2 g/dL · Standard Panel</p>
                </div>
              </div>
            )}
          </Card>

          <Card title="Current Medication" bodyClass="p-4 space-y-2">
            {prescriptions.filter((p) => p.active).map((p) => (
              <div key={p.id} className="text-sm border-b border-gov-border last:border-0 pb-2 last:pb-0">
                <p className="font-medium text-gov-navy">{p.medicine}</p>
                <p className="text-gov-muted text-xs">{p.dosage} · {p.frequency} · {p.duration}</p>
              </div>
            ))}
          </Card>
          <Card title="Vaccination Status" bodyClass="p-0">
            <DataTable
              rows={vaccinations.slice(0, 4)}
              columns={[
                { key: 'vaccine', header: 'Vaccine' },
                { key: 'status', header: 'Status', render: (r) => (
                    <Badge tone={r.status === 'Complete' ? 'success' : 'warn'}>{r.status}</Badge>
                  ) },
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
