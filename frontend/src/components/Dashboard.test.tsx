import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../store/slices/auth/authSlice';
import { httpAuthService } from '../services/authService';
import { Dashboard } from './Dashboard';

// Helper: build a store already in "authenticated" state.
function makeAuthenticatedStore(email = 'user@example.com') {
  return configureStore({
    reducer: { auth: authReducer },
    middleware: (getDefault) =>
      getDefault({ thunk: { extraArgument: { services: { authService: httpAuthService } } } }),
    preloadedState: {
      auth: {
        status: 'authenticated' as const,
        user: { id: 'usr_1', email },
        token: 'sess_test',
        fieldErrors: {},
        formError: null,
      },
    },
  });
}

// Wrapper that captures navigate calls.
let navigatedTo: string | null = null;

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => (path: string) => {
      navigatedTo = path;
    },
  };
});

beforeEach(() => {
  navigatedTo = null;
});

function renderDashboard(email?: string) {
  const store = makeAuthenticatedStore(email);
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

describe('Dashboard', () => {
  it("AC-24: shows the authenticated user's email", () => {
    renderDashboard('alice@example.com');
    expect(screen.getByText(/signed in as alice@example\.com/i)).toBeInTheDocument();
  });

  it('AC-24: shows the "Log out" button', () => {
    renderDashboard();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('AC-25: clicking "Log out" dispatches logout and navigates to /login', async () => {
    const user = userEvent.setup();
    const store = renderDashboard();
    await user.click(screen.getByRole('button', { name: /log out/i }));
    // Auth state should be reset to idle / unauthenticated
    expect(store.getState().auth.status).toBe('idle');
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.token).toBeNull();
    // Navigation should have been triggered
    expect(navigatedTo).toBe('/login');
  });
});
