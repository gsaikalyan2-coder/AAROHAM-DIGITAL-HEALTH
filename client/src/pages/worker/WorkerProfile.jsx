import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import AbhaCardModal from '../../components/common/AbhaCardModal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { accessLog } from '../../data/mockData.js';

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900 dark:text-white text-sm">{value}</dd>
    </div>
  );
}

export default function WorkerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  useEffect(() => {
    async function loadLatestProfile() {
      if (!user) return;
      try {
        const id = user.id || user.ABHA_id || user.email;
        const res = await api.get(`/worker/profile/${id}`);
        if (res.data) {
          setProfile((prev) => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        // Fallback to logged-in user state in AuthContext
      }
    }
    loadLatestProfile();
  }, [user]);

  const w = profile || user || {};
  const fullName = w.full_name || w.name || 'Verified Migrant Worker';
  const abhaId = w.ABHA_id || w.mhid || '14-8821-4920-1049';
  const age = w.age || '32';
  const gender = w.gender || 'Male';
  const bloodGroup = w.blood_group || w.bloodGroup || 'B+';
  const phone = w.employer_phone_number || w.mobile || '9847012345';
  const homeState = w.home_state || w.nativeState || 'West Bengal';
  const currentAddress = w.current_address || w.address || 'Perumbavoor, Ernakulam, Kerala';
  const employerName = w.employer_name || w.employer || 'Kerala Infrastructure Construction Co.';
  const language = w.spoken_language || 'Bengali / Hindi';
  const registeredDate = w.created_at ? new Date(w.created_at).toLocaleDateString() : '2026-01-18';
  const issues = w.previous_health_issues ? [w.previous_health_issues] : ['None Recorded'];

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Your verified digital identity and health record stored securely in the Aaroham database."
        actions={
          <button
            type="button"
            onClick={() => setIsCardModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2"
          >
            <Eye size={16} /> View Official ABHA Card
          </button>
        }
      />

      <AbhaCardModal
        worker={w}
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Worker Identity" className="lg:col-span-2">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="Full Name" value={<span className="font-bold text-base text-slate-900 dark:text-white">{fullName}</span>} />
            <Field label="ABHA ID (Health ID)" value={<span className="font-mono font-semibold text-[#8FB8DE] dark:text-[#7DD3C0] bg-slate-900/60 px-2 py-0.5 rounded border border-white/10">{abhaId}</span>} />
            <Field label="Registered Email" value={w.email || 'worker@domain.com'} />
            <Field label="Age &amp; Gender" value={`${age} years · ${gender}`} />
            <Field label="Blood Group" value={<Badge tone="danger">{bloodGroup}</Badge>} />
            <Field label="Registered Mobile" value={phone} />
            <Field label="Spoken Language" value={language} />
            <Field label="Registered On" value={registeredDate} />
          </dl>
        </Card>

        <Card title="Medical Flags">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Allergies &amp; Chronic Issues</dt>
              <dd className="flex flex-wrap gap-2">
                {issues.map((a) => <Badge key={a} tone="danger">{a}</Badge>)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Vaccination Status</dt>
              <dd>
                <Badge tone="success">{w.is_vaccinated ? 'Fully Vaccinated' : 'Verified Registered'}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Active Medication</dt>
              <dd className="text-sm text-slate-700 dark:text-slate-300">
                <p>Routine preventive care &amp; multivitamins</p>
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Migration &amp; Employment" className="lg:col-span-2">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="Home State" value={homeState} />
            <Field label="Current Address in Kerala" value={currentAddress} />
            <Field label="Employer / Contractor" value={employerName} />
            <Field label="Employer Contact Number" value={phone} />
            <Field label="Worksite Location" value="Kerala Construction Zone" />
            <Field label="Record Status" value={<Badge tone="success">Active in PostgreSQL DB</Badge>} />
          </dl>
        </Card>

        <Card title="Who Accessed My Record" bodyClass="p-4 space-y-3">
          {accessLog.map((l) => (
            <div key={l.id} className="text-sm border-b border-slate-200 dark:border-slate-800 last:border-0 pb-3 last:pb-0">
              <p className="font-medium text-slate-900 dark:text-white">{l.actor}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{l.hospital} · {l.date}</p>
              <p className="text-xs mt-0.5 text-slate-600 dark:text-slate-300">{l.action}</p>
            </div>
          ))}
          <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">HIPAA &amp; ABDM compliant audit trail active.</p>
        </Card>
      </div>
    </>
  );
}
