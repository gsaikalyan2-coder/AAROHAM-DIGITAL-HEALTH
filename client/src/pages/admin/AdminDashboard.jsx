import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Stethoscope, Syringe, BarChart3, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import { api } from '../../lib/api.js';

import { CSV_RAW_DATA } from '../../data/csvDataset.js';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await api.get('/analytics/surveillance');
        setMetrics(res);
      } catch (err) {
        console.warn('Analytics API note:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const totalWorkers = metrics?.totalWorkers || CSV_RAW_DATA.length;
  const vaccinationRate = metrics?.vaccinationPercentage || Math.round((CSV_RAW_DATA.filter(r => r.covid === 'Yes').length / CSV_RAW_DATA.length) * 100);
  const totalConsultations = metrics?.totalConsultations || CSV_RAW_DATA.filter(r => r.chronic !== 'None').length;

  const districtData = (metrics?.districtDistribution && metrics.districtDistribution.length > 0)
    ? metrics.districtDistribution
    : [
        { current_address: 'Tamil Nadu (Native)', count: CSV_RAW_DATA.filter(r => r.state.includes('Tamil')).length },
        { current_address: 'Telangana (Native)', count: CSV_RAW_DATA.filter(r => r.state.includes('Telangana')).length },
        { current_address: 'Andhra Pradesh (Native)', count: CSV_RAW_DATA.filter(r => r.state.includes('Andhra')).length },
        { current_address: 'Kerala (Host State)', count: CSV_RAW_DATA.filter(r => r.state.includes('Kerala')).length },
      ];

  const maxDistrict = Math.max(...districtData.map((d) => parseInt(d.count || 0, 10)), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Health Surveillance & Migrant Data Portal"
        subtitle="Government of Kerala — Department of Health Services (SIH PS #82)"
        actions={
          <Link to="/admin/analytics" className="px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded-lg shadow-sm text-sm flex items-center gap-2">
            <BarChart3 size={16} /> Detailed Analytics
          </Link>
        }
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registered Migrant Workers"
          value={totalWorkers.toLocaleString('en-IN')}
          sub="Indexed with Portable ABHA IDs"
          icon={Users}
          tone="teal"
        />
        <StatCard
          label="Vaccination Coverage Rate"
          value={`${vaccinationRate}%`}
          sub="Target: 95% full coverage"
          icon={Syringe}
          tone="success"
        />
        <StatCard
          label="Total Consultations Logged"
          value={totalConsultations.toLocaleString('en-IN')}
          sub="Across 14 Districts in Kerala"
          icon={Stethoscope}
          tone="saffron"
        />
        <StatCard
          label="Empanelled Health Facilities"
          value="148"
          sub="Govt. General Hospitals & PHCs"
          icon={Building2}
          tone="navy"
        />
      </div>

      {/* Disease Outbreak & District Surveillance */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Migrant Population Distribution by District" className="xl:col-span-2 p-5">
          <div className="space-y-4">
            {districtData.map((d) => {
              const countNum = parseInt(d.count || 0, 10);
              const percentage = Math.round((countNum / maxDistrict) * 100);
              return (
                <div key={d.current_address}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">{d.current_address}</span>
                    <span className="text-slate-500 font-mono text-xs">{countNum.toLocaleString('en-IN')} workers</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="h-full bg-brand-600 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Public Health Disease Outbreak Monitor */}
        <Card title="Communicable Disease Surveillance" icon={ShieldAlert} className="p-5">
          <div className="space-y-3">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-l-amber-500 rounded-r-xl space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-amber-900 dark:text-amber-300">
                <span>Pulmonary TB Screening</span>
                <Badge tone="warn">Active Monitoring</Badge>
              </div>
              <p className="text-xs text-slate-700 dark:text-amber-200">12 suspected cases under sputum lab evaluation in Perumbavoor camp.</p>
            </div>

            <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border-l-4 border-l-red-500 rounded-r-xl space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-red-900 dark:text-red-300">
                <span>Dengue / Vector Control</span>
                <Badge tone="danger">Alert Issued</Badge>
              </div>
              <p className="text-xs text-slate-700 dark:text-red-200">Ernakulam labour camps flagged for fumigation and standing water inspection.</p>
            </div>

            <div className="p-3.5 bg-slate-100 dark:bg-slate-800 border-l-4 border-l-brand-600 rounded-r-xl space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                <span>Acute Respiratory Infections</span>
                <Badge tone="success">Controlled</Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">Incidence decreased by 14% following mobile clinic health camps.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
