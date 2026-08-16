import { Link } from 'react-router-dom';
import { HeartPulse, ArrowLeft, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../../components/common/ThemeToggle.jsx';
import CompanyLogo from '../../components/common/CompanyLogo.jsx';

export default function AuthShell({ icon: Icon, title, subtitle, children, note }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col transition-colors">
      {/* Official Enterprise Header Bar */}
      <div className="bg-slate-900 text-white text-xs border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-blue-400" />
            <span>Government of Kerala · Department of Health &amp; Family Welfare</span>
          </div>
          <ThemeToggle className="py-0.5 px-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700" />
        </div>
      </div>

      <div className="flex-1 grid place-items-center px-4 py-10">
        <div className="w-full max-w-xl">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <CompanyLogo size={42} className="transition-transform group-hover:scale-105" />
              <div>
                <span className="block font-bold text-lg text-slate-900 dark:text-white leading-tight">Aaroham</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Enterprise Migrant Health Platform</span>
              </div>
            </Link>
            <ThemeToggle />
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-enterprise border border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-100 dark:border-slate-700">
                <Icon size={24} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{subtitle}</p>
              </div>
            </div>
            {children}
          </div>

          {note && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center leading-relaxed font-medium">{note}</p>
          )}

          <div className="text-center mt-4">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline">
              <ArrowLeft size={14} aria-hidden="true" /> Switch Portal Directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
