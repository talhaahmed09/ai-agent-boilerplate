/**
 * Route tree. Wraps each route with the appropriate guard:
 *  /register  → GuestRoute  → RegistrationForm
 *  /login     → GuestRoute  → LoginForm
 *  /dashboard → ProtectedRoute → Dashboard
 *  /          → redirect to /register
 *  *          → redirect to /register
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { RegistrationForm } from './components/RegistrationForm';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { GuestRoute } from './components/GuestRoute';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegistrationForm />
          </GuestRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginForm />
          </GuestRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/register" replace />} />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}
