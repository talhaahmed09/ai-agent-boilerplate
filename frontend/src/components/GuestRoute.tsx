/**
 * Route guard for unauthenticated-only pages (/register, /login).
 * If the user is already authenticated, immediately redirects to /dashboard
 * (AC-13, AC-22). The check is synchronous — no loading state or spinner.
 */
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectAuthStatus } from '../store/selectors/auth/authSelectors';

interface GuestRouteProps {
  children: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const status = useAppSelector(selectAuthStatus);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
