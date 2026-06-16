/**
 * Route guard for authenticated-only pages (/dashboard).
 * If the user is not authenticated, immediately redirects to /login (AC-26).
 * The check is synchronous — no loading state or spinner.
 */
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectAuthStatus } from '../store/selectors/auth/authSelectors';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const status = useAppSelector(selectAuthStatus);

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
