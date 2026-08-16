import { NavLink } from 'react-router-dom';
import { HeartPulse, X, ShieldCheck } from 'lucide-react';
import { NAV } from './navConfig.js';
import CompanyLogo from '../common/CompanyLogo.jsx';

export default function Sidebar({ role, open, onClose }) {
  const nav = NAV[role];
  if (!nav) return null;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-slate-900 text-white border-r border-slate-800
          flex flex-col transition-transform duration-200 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Dashboard navigation"
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo size={36} className="shrink-0" />
            <div className="min-w-0">
              <span className="block font-bold text-sm leading-tight truncate text-white">Aaroham</span>
              <span className="block text-[11px] text-slate-400 font-medium leading-tight truncate">{nav.title}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {nav.items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <ShieldCheck size={14} className="text-brand-500" /> Govt. of Kerala Health Stack
          </div>
          <p className="text-[10px] text-slate-500">Enterprise Digital Record System</p>
        </div>
      </aside>
    </>
  );
}
