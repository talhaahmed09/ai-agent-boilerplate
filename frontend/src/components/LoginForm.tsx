/**
 * Login form. Controlled inputs validated on blur (email: non-empty + format;
 * password: non-empty only). Dispatches loginThunk on valid submit. All server
 * errors are form-level — login never shows field-level errors from the server
 * (spec §7, AC-19). On 401 the password field is cleared (design §2.3). The
 * form-level error banner gets focused on error for keyboard/SR users (design §4.3).
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginThunk } from '../store/thunks/auth/loginThunk';
import {
  selectAuthStatus,
  selectFormError,
} from '../store/selectors/auth/authSelectors';
import { validateEmail } from '../utils/validation';
import { PasswordInput } from './PasswordInput';

export function LoginForm() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const formError = useAppSelector(selectFormError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  // Track whether the last rejection was a 401 so we can clear the password field.
  const [clearPasswordOnError, setClearPasswordOnError] = useState(false);

  const submitting = status === 'submitting';

  // Field-level errors (client-side only for login).
  const emailError = emailTouched ? (validateEmail(email) ?? undefined) : undefined;
  const passwordError =
    passwordTouched && !password.trim() ? 'Password is required.' : undefined;

  // Submit is enabled only when both fields are non-empty and not submitting (AC-16).
  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const errorBannerRef = useRef<HTMLDivElement>(null);

  // Focus the error banner when a form-level error appears (design §4.3).
  useEffect(() => {
    if (formError && errorBannerRef.current) {
      errorBannerRef.current.focus();
    }
  }, [formError]);

  // Clear password on 401 (design §2.3 — "password field is cleared").
  // Also reset passwordTouched so the empty field doesn't immediately show
  // "Password is required." — the form-level error is the only feedback shown.
  // We detect a 401 by the specific message from authService.login.
  useEffect(() => {
    if (
      status === 'error' &&
      formError === 'Incorrect email or password.' &&
      clearPasswordOnError
    ) {
      setPassword('');
      setPasswordTouched(false);
      setClearPasswordOnError(false);
    }
  }, [status, formError, clearPasswordOnError]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!email.trim() || !password) return;

    // Mark that we want to clear the password if this attempt gets a 401.
    setClearPasswordOnError(true);
    void dispatch(loginThunk({ email: email.trim(), password }));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-md space-y-5 px-8 py-10 bg-white rounded-lg shadow-md mt-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in to your account</h1>

      {formError && (
        <div
          ref={errorBannerRef}
          role="alert"
          tabIndex={-1}
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mb-4"
        >
          {formError}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-1">
        <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          disabled={submitting}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? 'login-email-error' : undefined}
          className={[
            'w-full rounded-md border px-3 py-2 text-sm text-gray-900',
            emailError ? 'border-red-500' : 'border-gray-300',
            submitting ? 'opacity-60 bg-gray-50 cursor-not-allowed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {emailError && (
          <p id="login-email-error" role="alert" className="mt-1 text-sm text-red-600">
            {emailError}
          </p>
        )}
      </div>

      {/* Password field */}
      <PasswordInput
        id="login-password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => setPasswordTouched(true)}
        error={passwordError}
        autocomplete="current-password"
        disabled={submitting}
      />

      {/* Submit button */}
      <button
        type="submit"
        disabled={!canSubmit}
        aria-busy={submitting}
        className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <svg
              className="inline-block animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </button>

      <p className="text-center mt-6 text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
