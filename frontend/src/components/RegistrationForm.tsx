/**
 * Registration form. Controlled inputs in React local state (ephemeral UI never
 * goes in Redux). Client validation fires on blur and on submit; the submit
 * button enables only when the whole form is valid (AC-2) and is disabled while a
 * submit is in flight (AC-4). Server field/form errors come from the auth slice
 * and render in the same place as client errors. Tailwind classes are presentation
 * only and are not exercised by tests.
 *
 * Password and confirm-password fields use <PasswordInput> with independent
 * show/hide toggles (AC-11). A sign-in link navigates to /login (AC-12).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { registerThunk } from '../store/thunks/auth/registerThunk';
import {
  selectAuthStatus,
  selectFieldErrors,
  selectFormError,
  selectCurrentUser,
} from '../store/selectors/auth/authSelectors';
import {
  validateEmail,
  validatePassword,
  validateConfirm,
  isFormValid,
} from '../utils/validation';
import { PasswordInput } from './PasswordInput';

type FieldName = 'email' | 'password' | 'confirm';

export function RegistrationForm() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const serverFieldErrors = useAppSelector(selectFieldErrors);
  const formError = useAppSelector(selectFormError);
  const user = useAppSelector(selectCurrentUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    email: false,
    password: false,
    confirm: false,
  });

  const submitting = status === 'submitting';

  const clientErrors = useMemo(
    () => ({
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirm(password, confirm),
    }),
    [email, password, confirm],
  );

  // Show a client error once the field is touched; otherwise show any server
  // field error for that field.
  const errorFor = (name: FieldName): string | undefined => {
    if (touched[name] && clientErrors[name]) return clientErrors[name] ?? undefined;
    return serverFieldErrors[name];
  };

  const canSubmit = isFormValid(email, password, confirm) && !submitting;

  const markTouched = (name: FieldName) =>
    setTouched((t) => ({ ...t, [name]: true }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: true });
    if (!isFormValid(email, password, confirm) || submitting) return;
    void dispatch(registerThunk({ email: email.trim(), password }));
  };

  if (status === 'authenticated' && user) {
    return (
      <div role="status" className="rounded-md bg-green-50 p-4 text-green-800">
        You&apos;re signed in as {user.email}. Welcome!
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Create your account</h1>

      {formError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => markTouched('email')}
          disabled={submitting}
          aria-invalid={Boolean(errorFor('email'))}
          aria-describedby={errorFor('email') ? 'email-error' : undefined}
          className="w-full rounded-md border px-3 py-2 disabled:opacity-60 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        {errorFor('email') && (
          <p id="email-error" role="alert" className="text-sm text-red-600">
            {errorFor('email')}
          </p>
        )}
      </div>

      <PasswordInput
        id="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => markTouched('password')}
        error={errorFor('password')}
        autocomplete="new-password"
        disabled={submitting}
      />

      <PasswordInput
        id="confirm"
        label="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onBlur={() => markTouched('confirm')}
        error={errorFor('confirm')}
        autocomplete="new-password"
        disabled={submitting}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        aria-busy={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting ? 'Creating account…' : 'Sign up'}
      </button>

      <p className="text-center mt-6 text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
