/**
 * Login thunk. Mirrors registerThunk but calls authService.login().
 * Login errors are always form-level (no fieldErrors) — spec §7, AC-19.
 * Services come from `extra`, never imported directly (constitution §4).
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState, AppDispatch, ThunkExtra } from '../../index';
import type { RegisterInput, RegisterResponse } from '../../../services/authService';
import { extractThunkError, ThunkError } from '../../../lib/extractThunkError';

export const loginThunk = createAsyncThunk<
  RegisterResponse,
  RegisterInput,
  { state: RootState; dispatch: AppDispatch; extra: ThunkExtra; rejectValue: ThunkError }
>('auth/login', async (input, { extra, rejectWithValue }) => {
  try {
    return await extra.services.authService.login(input);
  } catch (err) {
    const e = err as { message?: string; fieldErrors?: Record<string, string> };
    return rejectWithValue(extractThunkError(e, e?.message));
  }
});
