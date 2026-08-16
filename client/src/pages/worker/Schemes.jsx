import { BadgeIndianRupee, Info } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card from '../../components/common/Card.jsx';
import { recommendedSchemes, demoWorker } from '../../data/mockData.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Schemes() {
  const { user } = useAuth();
  const w = user || demoWorker;
  const age = w.age || 32;
  const gender = w.gender || 'Male';
  const occupation = w.employer_name || 'Construction & Labour';
  const district = w.current_address ? w.current_address.split(',')[1]?.trim() || 'Ernakulam' : 'Ernakulam';
  const condition = w.previous_health_issues || 'Routine Care';

  return (
    <>
      <PageHeader
        title="Government Schemes"
        subtitle="Schemes you appear eligible for, based on your profile and health record."
      />

      <div className="gov-card p-4 mb-5 flex gap-3">
        <Info size={18} className="text-[#8FB8DE] shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Matched for <strong className="text-slate-900 dark:text-white">{w.full_name || w.name || 'Worker'}</strong>: age <strong className="text-slate-900 dark:text-white">{age}</strong> ·
          gender <strong className="text-slate-900 dark:text-white">{gender}</strong> ·
          district <strong className="text-slate-900 dark:text-white">{district}</strong> ·
          profile <strong className="text-slate-900 dark:text-white">{condition}</strong>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {recommendedSchemes.map((s) => (
          <Card key={s.id} bodyClass="p-5">
            <div className="flex gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-md bg-gov-saffron/10 text-gov-saffron shrink-0">
                <BadgeIndianRupee size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-gov-navy">{s.name}</h3>
                <p className="text-xs text-gov-muted mt-0.5">{s.authority}</p>
                <p className="text-sm mt-2">{s.benefit}</p>
                <p className="text-sm text-gov-muted mt-3 pt-3 border-t border-gov-border">
                  <strong className="text-gov-navy">Why you qualify: </strong>{s.reason}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-gov-muted mt-4">
        Rule-based eligibility engine with live scheme data goes live in Phase 17.
      </p>
    </>
  );
}
