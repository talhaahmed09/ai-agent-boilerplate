/**
 * Tests for makeStore preloadedState and localStorage subscriber (AC-27).
 * AC-27: on application boot, persisted session is rehydrated into Redux state
 * with no network call so the user remains authenticated.
 */
import { makeStore } from './index';
import {
  selectAuthStatus,
  selectCurrentUser,
} from './selectors/auth/authSelectors';

describe('makeStore — preloadedState rehydration (AC-27)', () => {
  it('AC-27: store seeded with preloadedState starts as authenticated with no network call', () => {
    const preloadedState = {
      auth: {
        status: 'authenticated' as const,
        user: { id: 'u1', email: 'a@b.com' },
        token: 'sess_abc',
        fieldErrors: {},
        formError: null,
      },
    };

    const store = makeStore({ preloadedState });

    // The store is immediately authenticated — no thunk was dispatched.
    expect(selectAuthStatus(store.getState())).toBe('authenticated');
    expect(selectCurrentUser(store.getState())).toEqual({
      id: 'u1',
      email: 'a@b.com',
    });
    expect(store.getState().auth.token).toBe('sess_abc');
  });

  it('AC-27: store without preloadedState starts as idle (unauthenticated)', () => {
    const store = makeStore();
    expect(selectAuthStatus(store.getState())).toBe('idle');
    expect(selectCurrentUser(store.getState())).toBeNull();
  });
});

describe('makeStore — localStorage subscriber', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists { user, token } to localStorage under bloomcart_auth when authenticated', async () => {
    const store = makeStore({
      services: {
        authService: {
          register: async () => ({
            user: { id: 'u2', email: 'b@c.com' },
            token: 'sess_xyz',
          }),
          login: () => Promise.reject(new Error('not used')),
        },
      },
    });

    // Dispatch a successful registration so state transitions to authenticated.
    const { registerThunk } = await import('./thunks/auth/registerThunk');
    await store.dispatch(registerThunk({ email: 'b@c.com', password: 'hunter2hunter2' }));

    const raw = localStorage.getItem('bloomcart_auth');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as { user: { id: string; email: string }; token: string };
    expect(parsed.user).toEqual({ id: 'u2', email: 'b@c.com' });
    expect(parsed.token).toBe('sess_xyz');
  });

  it('AC-25: removes bloomcart_auth from localStorage when logout is dispatched', async () => {
    // Seed the store as already authenticated.
    const store = makeStore({
      preloadedState: {
        auth: {
          status: 'authenticated',
          user: { id: 'u3', email: 'c@d.com' },
          token: 'sess_logout',
          fieldErrors: {},
          formError: null,
        },
      },
    });

    // Simulate what main.tsx does on boot: write the session to localStorage first.
    localStorage.setItem('bloomcart_auth', JSON.stringify({ user: { id: 'u3', email: 'c@d.com' }, token: 'sess_logout' }));
    expect(localStorage.getItem('bloomcart_auth')).not.toBeNull();

    // Dispatch logout — subscriber must remove the key.
    const { logout } = await import('./slices/auth/authSlice');
    store.dispatch(logout());

    expect(localStorage.getItem('bloomcart_auth')).toBeNull();
  });
});
