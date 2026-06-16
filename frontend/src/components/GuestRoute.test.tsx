/**
 * Tests for GuestRoute guard (AC-13, AC-22).
 * AC-13: authenticated user navigating to /register is redirected to /dashboard.
 * AC-22: authenticated user navigating to /login is redirected to /dashboard.
 */
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { GuestRoute } from './GuestRoute';
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

function renderGuestRoute(
  store: ReturnType<typeof configureStore<{ auth: ReturnType<typeof authReducer> }>>,
  initialPath: string,
) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/register"
            element={
              <GuestRoute>
                <div>registration content</div>
              </GuestRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <div>login content</div>
              </GuestRoute>
            }
          />
          <Route path="/dashboard" element={<div>dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('GuestRoute', () => {
  it('AC-13 / AC-22: unauthenticated user on /register sees the child content', () => {
    const store = makeAuthStore('idle');
    renderGuestRoute(store, '/register');
    expect(screen.getByText('registration content')).toBeInTheDocument();
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('AC-13: authenticated user on /register is redirected to /dashboard', () => {
    const store = makeAuthStore('authenticated');
    renderGuestRoute(store, '/register');
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText('registration content')).not.toBeInTheDocument();
  });

  it('AC-22: unauthenticated user on /login sees the child content', () => {
    const store = makeAuthStore('idle');
    renderGuestRoute(store, '/login');
    expect(screen.getByText('login content')).toBeInTheDocument();
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument();
  });

  it('AC-22: authenticated user on /login is redirected to /dashboard', () => {
    const store = makeAuthStore('authenticated');
    renderGuestRoute(store, '/login');
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText('login content')).not.toBeInTheDocument();
  });
});
