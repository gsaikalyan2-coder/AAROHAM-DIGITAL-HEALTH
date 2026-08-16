import {
  LayoutDashboard, User, FileHeart, Pill, CalendarDays, Syringe, Brain, BadgeIndianRupee, TestTube,
  Search, Stethoscope, Users, BarChart3, Upload, Building2, ScrollText,
} from 'lucide-react';

/** Sidebar definition per role. Single source for dashboard navigation. */
export const NAV = {
  worker: {
    title: 'Worker Portal',
    base: '/worker',
    items: [
      { to: '/worker', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/worker/profile', label: 'My Profile', icon: User },
      { to: '/worker/history', label: 'Medical History', icon: FileHeart },
      { to: '/worker/prescriptions', label: 'Prescriptions', icon: Pill },
      { to: '/worker/lab-reports', label: 'Lab Reports', icon: TestTube },
      { to: '/worker/appointments', label: 'Appointments', icon: CalendarDays },
      { to: '/worker/vaccinations', label: 'Vaccinations', icon: Syringe },
      { to: '/worker/mental-health', label: 'Mental Health', icon: Brain },
      { to: '/worker/schemes', label: 'Govt. Schemes', icon: BadgeIndianRupee },
    ],
  },
  doctor: {
    title: 'Doctor Portal',
    base: '/doctor',
    items: [
      { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/doctor/search', label: 'Patient Search', icon: Search },
      { to: '/doctor/consultations', label: 'Consultations', icon: Stethoscope },
      { to: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
      { to: '/doctor/patients', label: 'My Patients', icon: Users },
    ],
  },
  admin: {
    title: 'Government Admin',
    base: '/admin',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/analytics', label: 'Health Analytics', icon: BarChart3 },
      { to: '/admin/import', label: 'Data Import', icon: Upload },
      { to: '/admin/hospitals', label: 'Hospitals', icon: Building2 },
      { to: '/admin/workers', label: 'Worker Registry', icon: Users },
      { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
    ],
  },
};
