import { Link } from 'react-router-dom';
import { HardHat, Stethoscope, Landmark, ArrowRight } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar.jsx';
import Footer from '../../components/layout/Footer.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import VideoBackground from '../../components/common/VideoBackground.jsx';

const PORTALS = [
  {
    to: '/login/worker',
    icon: HardHat,
    title: 'Worker',
    badge: 'Worker Portal',
    badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-400/30',
    method: 'ABHA ID / Mobile + Twilio SMS OTP or Password',
    points: ['View profile and Migrant Health ID', 'View complete medical history', 'View prescriptions and lab reports', 'Book appointments and see reminders', 'Check eligible government schemes'],
  },
  {
    to: '/login/doctor',
    icon: Stethoscope,
    title: 'Doctor',
    badge: 'Clinical Portal',
    badgeColor: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400/30',
    method: 'Hospital email / Mobile + Twilio SMS OTP or Password',
    points: ['Search patient by Migrant Health ID', 'Review full cross-hospital history', 'Record diagnosis and consultation', 'Issue prescriptions, upload reports', 'Schedule follow-up visits'],
  },
  {
    to: '/login/admin',
    icon: Landmark,
    title: 'Government Admin',
    badge: 'Administrative Portal',
    badgeColor: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-400/30',
    method: 'Official email / Mobile + Twilio SMS OTP or Password',
    points: ['Import Google Form / CSV registrations', 'View district-wise health analytics', 'Manage participating hospitals', 'Monitor vaccination coverage', 'Review access audit logs'],
  },
];

export default function LoginSelectPage() {
  return (
    <div className="relative min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <VideoBackground videoSrc="/bg-video.mp4" overlayOpacity="bg-black/20 dark:bg-slate-950/40" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <PublicNavbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-14">
          <SectionTitle
            eyebrow="Portal access"
            title="Select your role to continue"
            description="Each role sees only the data it is authorised to see. Every access is audit-logged."
          />
          <div className="grid gap-6 lg:grid-cols-3 mt-6">
            {PORTALS.map(({ to, icon: Icon, title, badge, badgeColor, method, points }) => (
              <div key={title} className="mac-glass-card p-6 flex flex-col hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-blue-600/90 text-white shadow-lg shadow-blue-500/30 border border-blue-400/30">
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${badgeColor}`}>
                    {badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-0.5">{method}</p>

                <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300 flex-1">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                      <span className="leading-snug">{p}</span>
                    </li>
                  ))}
                </ul>

                <Link to={to} className="gov-btn-primary mt-6 w-full rounded-xl">
                  Continue as {title} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
