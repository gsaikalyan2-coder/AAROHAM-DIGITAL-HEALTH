import { Link, NavLink } from 'react-router-dom';
import { HeartPulse, Menu, X, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '../common/ThemeToggle.jsx';
import CompanyLogo from '../common/CompanyLogo.jsx';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/login', label: 'Portals' },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 lg:px-12 pt-3 pb-1">
      {/* Mac Glass Full-Width Floating Navigation Bar */}
      <nav 
        className="w-full mx-auto mac-glass rounded-2xl px-6 sm:px-8 py-3 transition-all duration-300"
        aria-label="Primary"
      >
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <CompanyLogo size={38} className="transition-transform group-hover:scale-105" />

            <div>
              <span className="block font-bold text-base text-slate-900 dark:text-white leading-tight tracking-tight group-hover:text-[#8FB8DE] dark:group-hover:text-[#7DD3C0] transition-colors">
                Aaroham
              </span>
              <span className="block text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                Migrant Health Record System
              </span>
            </div>
          </Link>

          {/* Center / Right Links */}
          <div className="hidden md:flex items-center gap-2">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-[#8FB8DE] dark:text-[#7DD3C0] bg-white/50 dark:bg-white/10 shadow-sm backdrop-blur-md border border-white/40 dark:border-white/10'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="w-px h-5 bg-slate-300/60 dark:bg-slate-700/60 mx-1.5" />
            <ThemeToggle className="text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10 rounded-full p-2" />
            <Link
              to="/login"
              className="ml-2 px-5 py-2 bg-[#1e405f]/80 hover:bg-[#1e405f] active:scale-95 text-[#D6E6F5] font-medium rounded-full text-sm shadow-sm border border-[#8FB8DE]/25 backdrop-blur-md transition-all duration-200"
            >
              Access Portals
            </Link>
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle className="text-slate-700 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10 rounded-full p-1.5" />
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 backdrop-blur-md"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {open && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/20 dark:border-white/10 space-y-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-white/10"
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block text-center mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm shadow-md"
            >
              Access Portals
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
