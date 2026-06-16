/**
 * Tests for ProtectedRoute guard (AC-26).
 * AC-26: unauthenticated user navigating to /dashboard is redirected to /login.
 */
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { makeStore } from '../store';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../store/slices/auth/authSlice';

// Build a store seeded with a specific auth state for testing guard logic.
function makeAuthStore(status: 'idle' | 'authenticated') {
  const preloadedState =
    status === 'authenticated'
      ? {
          auth: {
            status: 'authenticated' as const,
            user: { id: 'u1', email: 'a@b.com' },
            token: 'sess_abc',
            fieldErrors: {},
            formError: null,
          },
        }
      : undefined;
  return makeStore({ preloadedState });
}

function renderProtectedRoute(
  store: ReturnType<typeof configureStore<{ auth: ReturnType<typeof authReducer> }>>,
  initialPath: string,
) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>dashboard content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('AC-26: authenticated user on /dashboard sees the child content', () => {
    const store = makeAuthStore('authenticated');
    renderProtectedRoute(store, '/dashboard');
    expect(screen.getByText('dashboard content')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });

  it('AC-26: unauthenticated user on /dashboard is redirected to /login', () => {
    const store = makeAuthStore('idle');
    renderProtectedRoute(store, '/dashboard');
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('dashboard content')).not.toBeInTheDocument();
  });
});
