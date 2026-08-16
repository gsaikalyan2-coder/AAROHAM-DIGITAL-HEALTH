import { Link } from 'react-router-dom';
import CompanyLogo from '../common/CompanyLogo.jsx';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white mt-auto border-t border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <CompanyLogo size={32} />
            <span className="font-bold text-base text-white">Aaroham</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Portable digital health records for migrant workers in Kerala, built for
            continuity of care across districts.
          </p>
        </div>
        <div>
          <p className="font-semibold mb-2 text-sm uppercase tracking-wide">Quick Links</p>
          <ul className="space-y-1.5 text-sm text-white/70">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/login" className="hover:text-white">Portal Login</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2 text-sm uppercase tracking-wide">Policies</p>
          <ul className="space-y-1.5 text-sm text-white/70">
            <li>Privacy Policy</li>
            <li>Data Protection &amp; Consent</li>
            <li>Accessibility Statement</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2 text-sm uppercase tracking-wide">Contact</p>
          <ul className="space-y-1.5 text-sm text-white/70">
            <li>Department of Health &amp; Family Welfare</li>
            <li>Government Secretariat, Thiruvananthapuram</li>
            <li>Health Helpline · 104 / 1056</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-white/60 flex flex-col sm:flex-row justify-between gap-2">
          <span>© 2026 Department of Health &amp; Family Welfare, Government of Kerala</span>
          <span>Aligned with SDG 3 — Good Health &amp; Well-being</span>
        </div>
      </div>
    </footer>
  );
}
