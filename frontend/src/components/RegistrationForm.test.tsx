import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { makeStore } from '../store';
import { RegistrationForm } from './RegistrationForm';
import type { AuthService } from '../services/authService';

const stubLogin: AuthService['login'] = () => Promise.reject(new Error('not used'));

function renderForm(register?: AuthService['register']) {
  const store = makeStore(
    register
      ? { services: { authService: { register, login: stubLogin } } }
      : undefined,
  );
  render(
    <Provider store={store}>
      <MemoryRouter>
        <RegistrationForm />
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

const valid = { email: 'new@example.com', password: 'hunter2hunter2' };

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^email$/i), valid.email);
  await user.type(screen.getByLabelText(/^password$/i), valid.password);
  await user.type(screen.getByLabelText(/confirm password/i), valid.password);
}

describe('RegistrationForm', () => {
  it('AC-1: renders with submit disabled and no errors', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('AC-2: enables submit only once all fields are valid and passwords match', async () => {
    const user = userEvent.setup();
    renderForm();
    const submit = screen.getByRole('button', { name: /sign up/i });
    expect(submit).toBeDisabled();
    await fillValid(user);
    expect(submit).toBeEnabled();
  });

  it('AC-8: shows a confirm-field error and keeps submit disabled when passwords differ', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^email$/i), valid.email);
    await user.type(screen.getByLabelText(/^password$/i), valid.password);
    await user.type(screen.getByLabelText(/confirm password/i), 'different1');
    await user.tab();
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
  });

  it('AC-7: shows an email-field error on blur for a malformed email', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email');
    await user.tab();
    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
  });

  it('AC-6: shows a password-field error on blur for a weak password', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^password$/i), 'short1');
    await user.tab();
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('AC-3: a successful submit shows the authenticated welcome state', async () => {
    const user = userEvent.setup();
    renderForm(async () => ({ user: { id: 'usr_1', email: valid.email }, token: 'sess_x' }));
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/welcome/i);
  });

  it('AC-5: a duplicate-email rejection renders a field-level error on email', async () => {
    const user = userEvent.setup();
    renderForm(async () => {
      throw { fieldErrors: { email: 'That email is already registered.' } };
    });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/already registered/i)).toBeInTheDocument();
  });

  it('AC-9 / ERR-5: a server failure renders a single form-level alert and keeps the form filled', async () => {
    const user = userEvent.setup();
    renderForm(async () => {
      throw { message: 'Something went wrong. Please try again.' };
    });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    // form still present and re-submittable
    expect(screen.getByLabelText(/^email$/i)).toHaveValue(valid.email);
    expect(screen.getByRole('button', { name: /sign up/i })).toBeEnabled();
  });

  it('AC-4: the submit button shows a loading state while the request is in flight', async () => {
    const user = userEvent.setup();
    let resolve!: (v: { user: { id: string; email: string }; token: string }) => void;
    renderForm(() => new Promise((r) => { resolve = r; }));
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: /sign up/i }));
    const busy = screen.getByRole('button', { name: /creating account/i });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    resolve({ user: { id: 'usr_1', email: valid.email }, token: 'sess_x' });
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('AC-12: "Already have an account? Sign in" link is present and points to /login', () => {
    renderForm();
    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  it('AC-11: password field show/hide toggle changes input type to text', async () => {
    const user = userEvent.setup();
    renderForm();
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    // The toggle button sits alongside the password field
    const toggles = screen.getAllByRole('button', { name: /show password/i });
    // reason: getAllByRole always returns at least one element when found; index access is safe
    await user.click(toggles[0]!);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('AC-11: confirm-password show/hide toggle is independent from password toggle', async () => {
    const user = userEvent.setup();
    renderForm();
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');
    // Click the confirm toggle (second "Show password" button)
    const toggles = screen.getAllByRole('button', { name: /show password/i });
    // reason: getAllByRole always returns at least one element when found; index access is safe
    await user.click(toggles[1]!);
    // Confirm revealed, password still masked
    expect(confirmInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
