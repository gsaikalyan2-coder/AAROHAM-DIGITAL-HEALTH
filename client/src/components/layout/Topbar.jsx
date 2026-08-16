import { Menu, LogOut, Bell, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.full_name || user?.name || 'Authorized User';
  const roleLabel = user?.role ? `${user.role.toUpperCase()} PORTAL` : 'HEALTH PORTAL';

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-20 transition-colors shadow-sm">
      <button
        type="button"
        onClick={onMenu}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
        <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold truncate flex items-center gap-1">
          <Building size={12} /> {roleLabel} · Kerala Department of Health Services
        </p>
      </div>

      <ThemeToggle />

      <button
        type="button"
        onClick={handleLogout}
        className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
      >
        <LogOut size={15} aria-hidden="true" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </header>
  );
}
