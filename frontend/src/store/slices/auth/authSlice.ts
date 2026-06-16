/**
 * Auth domain slice. Holds session/client state: status, the current user,
 * field errors and a form-level error from the last submit. The async result of
 * registerThunk and loginThunk land in extraReducers; the rejected handler
 * unpacks the shared error shape with extractThunkError (constitution §4).
 *
 * logout: resets state to initialState. The makeStore subscriber in index.ts
 * removes "bloomcart_auth" from localStorage when user/token become null (AC-25).
 */
import { createSlice } from '@reduxjs/toolkit';
import { registerThunk } from '../../thunks/auth/registerThunk';
import { loginThunk } from '../../thunks/auth/loginThunk';
import { extractThunkError } from '../../../lib/extractThunkError';
import type { RegisteredUser } from '../../../services/authService';

export type AuthStatus = 'idle' | 'submitting' | 'authenticated' | 'error';

export interface AuthState {
  status: AuthStatus;
  user: RegisteredUser | null;
  token: string | null;
  fieldErrors: Record<string, string>;
  formError: string | null;
}

const initialState: AuthState = {
  status: 'idle',
  user: null,
  token: null,
  fieldErrors: {},
  formError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearErrors(state) {
      state.fieldErrors = {};
      state.formError = null;
    },
    logout() {
      // Return initialState to reset the entire slice. The makeStore subscriber
      // will detect user/token === null and remove "bloomcart_auth" from
      // localStorage (AC-25, spec §3.5).
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- register ---
      .addCase(registerThunk.pending, (state) => {
        state.status = 'submitting';
        state.fieldErrors = {};
        state.formError = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.fieldErrors = {};
        state.formError = null;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = 'error';
        const err = extractThunkError(action.payload, action.error.message);
        state.fieldErrors = err.fieldErrors ?? {};
        // Show a form-level error only when there is no field-specific error.
        state.formError =
          err.fieldErrors && Object.keys(err.fieldErrors).length > 0
            ? null
            : err.message ?? 'Something went wrong. Please try again.';
      })
      // --- login ---
      .addCase(loginThunk.pending, (state) => {
        state.status = 'submitting';
        state.fieldErrors = {};
        state.formError = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.fieldErrors = {};
        state.formError = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'error';
        // Login errors are always form-level — never field-level (spec §7, AC-19).
        const err = extractThunkError(action.payload, action.error.message);
        state.fieldErrors = {};
        state.formError = err.message ?? 'Something went wrong. Please try again.';
      });
  },
});

export const { clearErrors, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
