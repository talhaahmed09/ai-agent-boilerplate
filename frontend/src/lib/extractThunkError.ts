/**
 * The one place the rejected-thunk error shape is unpacked. Thunks reject with
 * { fieldErrors?, message? } (mirrors the backend envelope's error object). For
 * uncaught exceptions we fall back to action.error.message. Keeping this in one
 * helper is the constitution's "one error shape" rule (§4).
 */
export interface ThunkError {
  fieldErrors?: Record<string, string>;
  message?: string;
}

export function extractThunkError(
  payload: unknown,
  fallbackMessage?: string,
): ThunkError {
  if (payload && typeof payload === 'object') {
    const p = payload as ThunkError;
    if (p.fieldErrors || p.message) {
      return { fieldErrors: p.fieldErrors, message: p.message };
    }
  }
  return { message: fallbackMessage ?? 'Something went wrong. Please try again.' };
}
