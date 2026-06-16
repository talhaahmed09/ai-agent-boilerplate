/**
 * Application entry point. Reads bloomcart_auth from localStorage before the
 * first render so the Redux auth slice starts in the correct state (AC-27:
 * session rehydration with no network call). Wraps the app in Redux Provider
 * and BrowserRouter.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { makeStore } from './store';
import { httpAuthService } from './services/authService';
import type { PreloadedAuthState } from './store';
import { App } from './App';

const STORAGE_KEY = 'bloomcart_auth';

function readPersistedAuth(): PreloadedAuthState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'user' in parsed &&
      'token' in parsed &&
      parsed.user !== null &&
      parsed.token !== null
    ) {
      const { user, token } = parsed as { user: { id: string; email: string }; token: string };
      return {
        auth: {
          status: 'authenticated',
          user,
          token,
          fieldErrors: {},
          formError: null,
        },
      };
    }
  } catch {
    // Malformed JSON or inaccessible storage — start unauthenticated.
  }
  return undefined;
}

const preloadedState = readPersistedAuth();

const store = makeStore({
  services: { authService: httpAuthService },
  preloadedState,
});

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found in the document.');
}

createRoot(rootEl).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
