/**
 * The auth API surface. Injected into the store via thunk `extra` so tests can
 * pass a fake (the constitution forbids importing services directly inside
 * thunks). The real implementation calls POST /register and maps the backend
 * error envelope into the thunk error shape { fieldErrors?, message? }.
 */
import { ThunkError } from '../lib/extractThunkError';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface RegisteredUser {
  id: string;
  email: string;
}

export interface RegisterResponse {
  user: RegisteredUser;
  token: string;
}

export interface AuthService {
  register(input: RegisterInput): Promise<RegisterResponse>;
  login(input: RegisterInput): Promise<RegisterResponse>;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

/** Thrown by the service on a non-2xx; carries the unpacked envelope. */
export class AuthApiError extends Error implements ThunkError {
  fieldErrors?: Record<string, string>;
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'AuthApiError';
    this.fieldErrors = fieldErrors;
  }
}

export const httpAuthService: AuthService = {
  async register(input) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch {
      // Network failure / server unreachable -> form-level error (spec ERR-5).
      throw new AuthApiError('Something went wrong. Please try again.');
    }

    if (res.ok) {
      return (await res.json()) as RegisterResponse;
    }

    let envelope: { error?: { message?: string; fieldErrors?: Record<string, string> } } = {};
    try {
      envelope = await res.json();
    } catch {
      // non-JSON error body -> generic form error
    }
    throw new AuthApiError(
      envelope.error?.message ?? 'Something went wrong. Please try again.',
      envelope.error?.fieldErrors,
    );
  },

  async login(input) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
    } catch {
      // Network failure / server unreachable -> form-level error (spec ERR-8).
      throw new AuthApiError('Something went wrong. Please try again.');
    }

    if (res.ok) {
      return (await res.json()) as RegisterResponse;
    }

    if (res.status === 401) {
      // Wrong credentials — single generic message to prevent enumeration (ERR-7).
      throw new AuthApiError('Incorrect email or password.');
    }

    if (res.status === 429) {
      // Rate limit exceeded (ERR-9).
      throw new AuthApiError('Too many attempts. Please wait a few minutes and try again.');
    }

    let envelope: { error?: { message?: string } } = {};
    try {
      envelope = await res.json();
    } catch {
      // non-JSON error body -> generic form error
    }
    // All login errors are form-level — no fieldErrors (spec §7, AC-19).
    throw new AuthApiError(
      envelope.error?.message ?? 'Something went wrong. Please try again.',
    );
  },
};
