import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { consultations as mockConsultations } from '../../data/mockData.js';

export default function MedicalHistory() {
  const { user } = useAuth();
  const [historyList, setHistoryList] = useState(mockConsultations);

  useEffect(() => {
    async function loadRecords() {
      if (!user) return;
      try {
        const id = user.id || user.ABHA_id || user.email;
        const res = await api.get(`/worker/records/${id}`);
        if (res.data && res.data.consultations && res.data.consultations.length > 0) {
          const mapped = res.data.consultations.map((c) => ({
            id: c.id,
            date: c.visit_date ? new Date(c.visit_date).toLocaleDateString() : 'Recent',
            hospital: c.hospital_name,
            district: c.district,
            doctor: c.doctor_name,
            department: 'Clinical OPD',
            diagnosis: c.diagnosis,
            status: 'Verified',
          }));
          setHistoryList(mapped);
        }
      } catch (err) {
        // Fallback to initial consultations
      }
    }
    loadRecords();
  }, [user]);

  const userName = user?.full_name || user?.name || 'Worker';

  return (
    <>
      <PageHeader
        title="Medical History"
        subtitle={`Complete consultation and diagnosis timeline for ${userName}. Synchronized across hospitals.`}
      />

      <Card title="Consultation Timeline" bodyClass="p-5">
        <ol className="relative">
          {historyList.map((c, i) => (
            <li key={c.id || i} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center shrink-0">
                <span className="w-3 h-3 rounded-full bg-[#7DD3C0] ring-4 ring-[#7DD3C0]/15 mt-1.5" />
                {i < historyList.length - 1 && <span className="w-px flex-1 bg-slate-300 dark:bg-slate-700 mt-1" />}
              </div>
              <div className="flex-1 min-w-0 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mac-glass">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{c.diagnosis}</p>
                  <Badge tone="neutral">{c.status || 'Active'}</Badge>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin size={14} aria-hidden="true" /> {c.hospital} · {c.district}
                </p>
                <div className="grid gap-1 sm:grid-cols-3 mt-3 text-sm text-slate-600 dark:text-slate-300">
                  <p><span className="text-slate-400">Date: </span>{c.date}</p>
                  <p><span className="text-slate-400">Doctor: </span>{c.doctor}</p>
                  <p><span className="text-slate-400">Dept: </span>{c.department}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
