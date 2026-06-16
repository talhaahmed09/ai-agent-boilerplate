import { makeStore } from '../../index';
import { registerThunk } from '../../thunks/auth/registerThunk';
import { loginThunk } from '../../thunks/auth/loginThunk';
import { logout } from './authSlice';
import {
  selectAuthStatus,
  selectFieldErrors,
  selectFormError,
  selectCurrentUser,
} from '../../selectors/auth/authSelectors';
import type { AuthService } from '../../../services/authService';

function storeWith(overrides: Partial<AuthService>) {
  return makeStore({
    services: {
      authService: {
        register: overrides.register ?? (() => Promise.reject(new Error('not implemented'))),
        login: overrides.login ?? (() => Promise.reject(new Error('not implemented'))),
      },
    },
  });
}

describe('auth slice + registerThunk', () => {
  it('AC-3: a successful register authenticates and stores the user + token', async () => {
    const store = storeWith({
      register: async () => ({
        user: { id: 'usr_1', email: 'a@b.com' },
        token: 'sess_abc',
      }),
    });
    await store.dispatch(registerThunk({ email: 'a@b.com', password: 'hunter2hunter2' }));
    expect(selectAuthStatus(store.getState())).toBe('authenticated');
    expect(selectCurrentUser(store.getState())).toEqual({ id: 'usr_1', email: 'a@b.com' });
  });

  it('AC-5: a rejected register with fieldErrors stores them as field errors (no form error)', async () => {
    const store = storeWith({
      register: async () => {
        throw { fieldErrors: { email: 'An account with that email already exists.' } };
      },
    });
    await store.dispatch(registerThunk({ email: 'a@b.com', password: 'hunter2hunter2' }));
    expect(selectAuthStatus(store.getState())).toBe('error');
    expect(selectFieldErrors(store.getState())).toEqual({
      email: 'An account with that email already exists.',
    });
    expect(selectFormError(store.getState())).toBeNull();
  });

  it('AC-9 / ERR-5: a network failure (no fieldErrors) becomes a single form-level error', async () => {
    const store = storeWith({
      register: async () => {
        throw { message: 'Something went wrong. Please try again.' };
      },
    });
    await store.dispatch(registerThunk({ email: 'a@b.com', password: 'hunter2hunter2' }));
    expect(selectAuthStatus(store.getState())).toBe('error');
    expect(selectFormError(store.getState())).toBe('Something went wrong. Please try again.');
    expect(selectFieldErrors(store.getState())).toEqual({});
  });

  it('AC-4: status is "submitting" while the request is in flight', async () => {
    let resolve!: (v: { user: { id: string; email: string }; token: string }) => void;
    const store = storeWith({
      register: () => new Promise((r) => { resolve = r; }),
    });
    const p = store.dispatch(registerThunk({ email: 'a@b.com', password: 'hunter2hunter2' }));
    expect(selectAuthStatus(store.getState())).toBe('submitting');
    resolve({ user: { id: 'usr_1', email: 'a@b.com' }, token: 'sess_abc' });
    await p;
    expect(selectAuthStatus(store.getState())).toBe('authenticated');
  });
});

describe('auth slice + loginThunk', () => {
  it('loginThunk.pending: status becomes "submitting", errors cleared', async () => {
    let resolve!: (v: { user: { id: string; email: string }; token: string }) => void;
    const store = storeWith({
      login: () => new Promise((r) => { resolve = r; }),
    });
    const p = store.dispatch(loginThunk({ email: 'a@b.com', password: 'hunter2' }));
    expect(selectAuthStatus(store.getState())).toBe('submitting');
    expect(selectFieldErrors(store.getState())).toEqual({});
    expect(selectFormError(store.getState())).toBeNull();
    resolve({ user: { id: 'usr_1', email: 'a@b.com' }, token: 'sess_abc' });
    await p;
  });

  it('loginThunk.fulfilled: status becomes "authenticated", user and token stored', async () => {
    const store = storeWith({
      login: async () => ({
        user: { id: 'usr_2', email: 'b@c.com' },
        token: 'sess_login',
      }),
    });
    await store.dispatch(loginThunk({ email: 'b@c.com', password: 'hunter2' }));
    expect(selectAuthStatus(store.getState())).toBe('authenticated');
    expect(selectCurrentUser(store.getState())).toEqual({ id: 'usr_2', email: 'b@c.com' });
    expect(store.getState().auth.token).toBe('sess_login');
    expect(selectFieldErrors(store.getState())).toEqual({});
    expect(selectFormError(store.getState())).toBeNull();
  });

  it('loginThunk.rejected: status becomes "error", formError set, fieldErrors empty (AC-19)', async () => {
    const store = storeWith({
      login: async () => {
        throw { message: 'Incorrect email or password.' };
      },
    });
    await store.dispatch(loginThunk({ email: 'a@b.com', password: 'wrong' }));
    expect(selectAuthStatus(store.getState())).toBe('error');
    expect(selectFormError(store.getState())).toBe('Incorrect email or password.');
    expect(selectFieldErrors(store.getState())).toEqual({});
  });

  it('logout: state resets to initialState', async () => {
    // First authenticate
    const store = storeWith({
      login: async () => ({
        user: { id: 'usr_3', email: 'c@d.com' },
        token: 'sess_logout_test',
      }),
    });
    await store.dispatch(loginThunk({ email: 'c@d.com', password: 'pass1234' }));
    expect(selectAuthStatus(store.getState())).toBe('authenticated');

    // Now logout
    store.dispatch(logout());
    expect(selectAuthStatus(store.getState())).toBe('idle');
    expect(selectCurrentUser(store.getState())).toBeNull();
    expect(store.getState().auth.token).toBeNull();
    expect(selectFieldErrors(store.getState())).toEqual({});
    expect(selectFormError(store.getState())).toBeNull();
  });
});
