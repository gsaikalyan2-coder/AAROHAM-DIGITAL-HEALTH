import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar.jsx';
import Footer from '../../components/layout/Footer.jsx';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 grid place-items-center px-4 py-20 text-center">
        <div>
          <p className="text-5xl font-semibold text-gov-navy">404</p>
          <h1 className="text-xl font-semibold mt-3">Page not found</h1>
          <p className="text-gov-muted mt-2">The page you requested does not exist or has moved.</p>
          <Link to="/" className="gov-btn-primary mt-6">Return to home</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
