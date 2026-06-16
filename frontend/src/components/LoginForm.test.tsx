import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { makeStore } from '../store';
import { LoginForm } from './LoginForm';
import type { AuthService } from '../services/authService';

const stubRegister: AuthService['register'] = () => Promise.reject(new Error('not used'));

function renderForm(login?: AuthService['login']) {
  const store = makeStore(
    login
      ? { services: { authService: { register: stubRegister, login } } }
      : undefined,
  );
  render(
    <Provider store={store}>
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

describe('LoginForm', () => {
  it('AC-15: submit is disabled when fields are empty (initial render)', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('AC-16: submit is enabled when both email and password are non-empty', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'hunter2');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
  });

  it('AC-16: submit remains disabled when only email is filled', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('AC-16: submit remains disabled when only password is filled', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/^password$/i), 'hunter2');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('AC-18: shows loading state while submitting (button text + aria-busy)', async () => {
    const user = userEvent.setup();
    let resolve!: (v: { user: { id: string; email: string }; token: string }) => void;
    renderForm(() => new Promise((r) => { resolve = r; }));
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'hunter2');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    const busy = screen.getByRole('button', { name: /signing in/i });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    resolve({ user: { id: 'usr_1', email: 'user@example.com' }, token: 'sess_x' });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /signing in/i })).not.toBeInTheDocument(),
    );
  });

  it('AC-19: 401 → form-level error shown, password cleared, email preserved', async () => {
    const user = userEvent.setup();
    renderForm(async () => {
      throw { message: 'Incorrect email or password.' };
    });
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    // Form-level error should appear
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incorrect email or password.',
    );
    // Email is preserved
    expect(screen.getByLabelText(/email address/i)).toHaveValue('user@example.com');
    // Password is cleared
    await waitFor(() =>
      expect(screen.getByLabelText(/^password$/i)).toHaveValue(''),
    );
  });

  it('AC-20: network error → form-level error shown', async () => {
    const user = userEvent.setup();
    renderForm(async () => {
      throw { message: 'Something went wrong. Please try again.' };
    });
    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'hunter2');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
  });

  it('AC-21: password show/hide toggle is present and functional', async () => {
    const user = userEvent.setup();
    renderForm();
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
  });

  it('field validation: empty email on blur shows "Email is required."', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByLabelText(/email address/i));
    await user.tab();
    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
  });

  it('field validation: invalid email format on blur shows "Enter a valid email address."', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.tab();
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('field validation: empty password on blur shows "Password is required."', async () => {
    const user = userEvent.setup();
    renderForm();
    // Focus the password input then leave it
    await user.click(screen.getByLabelText(/^password$/i));
    await user.tab();
    expect(await screen.findByText('Password is required.')).toBeInTheDocument();
  });

  it('sign-up link is present and points to /register', () => {
    renderForm();
    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });
});
