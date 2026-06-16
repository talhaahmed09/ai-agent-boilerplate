/**
 * Store factory. makeStore({ services, preloadedState? }) builds a fresh store
 * with services injected as the thunk `extra` argument, so every test gets an
 * isolated store and can inject a fake AuthService (constitution §4 +
 * jest-testing skill).
 *
 * After the store is created a subscriber persists { user, token } to
 * localStorage under "bloomcart_auth" whenever auth state is authenticated,
 * and removes the key on logout. The write is guarded behind a reference
 * equality check so localStorage is only touched when auth state actually
 * changes (spec §4, AC-27).
 */
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './slices/auth/authSlice';
import { httpAuthService, AuthService } from '../services/authService';
import type { AuthState } from './slices/auth/authSlice';

export interface Services {
  authService: AuthService;
}

const STORAGE_KEY = 'bloomcart_auth';

const defaultServices: Services = { authService: httpAuthService };

export interface PreloadedAuthState {
  auth: AuthState;
}

export function makeStore(overrides?: {
  services?: Partial<Services>;
  preloadedState?: PreloadedAuthState;
}) {
  const services: Services = { ...defaultServices, ...overrides?.services };

  const store = configureStore({
    reducer: { auth: authReducer },
    middleware: (getDefault) =>
      getDefault({ thunk: { extraArgument: { services } } }),
    preloadedState: overrides?.preloadedState,
  });

  // Persist auth state to localStorage whenever it changes.
  // Only write when both user and token are present (authenticated);
  // remove the key when either is absent (logged out / never logged in).
  let previousAuth: AuthState | undefined;

  store.subscribe(() => {
    const currentAuth = store.getState().auth;

    // Skip if auth slice reference hasn't changed since last notification.
    if (currentAuth === previousAuth) return;
    previousAuth = currentAuth;

    try {
      if (currentAuth.user !== null && currentAuth.token !== null) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: currentAuth.user, token: currentAuth.token }),
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // SSR-safe / storage quota exceeded — silently ignore.
    }
  });

  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
export interface ThunkExtra {
  services: Services;
}
