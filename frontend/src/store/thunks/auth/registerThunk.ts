/**
 * The only place the registration API call lives. Uses a typed thunk so state,
 * dispatch, and the injected services are typed. Rejects with the shared
 * { fieldErrors?, message? } shape via rejectWithValue (constitution "one error
 * shape"). Services come from `extra`, never imported directly.
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState, AppDispatch, ThunkExtra } from '../../index';
import type { RegisterInput, RegisterResponse } from '../../../services/authService';
import { extractThunkError, ThunkError } from '../../../lib/extractThunkError';

export const registerThunk = createAsyncThunk<
  RegisterResponse,
  RegisterInput,
  { state: RootState; dispatch: AppDispatch; extra: ThunkExtra; rejectValue: ThunkError }
>('auth/register', async (input, { extra, rejectWithValue }) => {
  try {
    return await extra.services.authService.register(input);
  } catch (err) {
    const e = err as { message?: string; fieldErrors?: Record<string, string> };
    return rejectWithValue(extractThunkError(e, e?.message));
  }
});
