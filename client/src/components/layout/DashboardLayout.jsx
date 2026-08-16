import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function DashboardLayout({ role }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gov-gray dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      <Sidebar role={role} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
