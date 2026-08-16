import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Role gate. Milestone I checks in-memory session only.
 * Phase 6 swaps this for JWT verification + refresh handling.
 */
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;

  return children;
}
