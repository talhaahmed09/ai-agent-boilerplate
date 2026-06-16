import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from './PasswordInput';

function renderInput(overrides?: Partial<React.ComponentProps<typeof PasswordInput>>) {
  const props = {
    id: 'test-pw',
    label: 'Test password',
    value: 'secret123',
    onChange: jest.fn(),
    onBlur: jest.fn(),
    ...overrides,
  };
  render(<PasswordInput {...props} />);
  return props;
}

describe('PasswordInput', () => {
  it('renders masked by default (type="password")', () => {
    renderInput();
    expect(screen.getByLabelText(/test password/i)).toHaveAttribute('type', 'password');
  });

  it('clicking toggle reveals the value (input type becomes "text")', async () => {
    const user = userEvent.setup();
    renderInput();
    const toggle = screen.getByRole('button', { name: /show password/i });
    await user.click(toggle);
    expect(screen.getByLabelText(/test password/i)).toHaveAttribute('type', 'text');
  });

  it('clicking toggle again masks the value (input type returns to "password")', async () => {
    const user = userEvent.setup();
    renderInput();
    const toggle = screen.getByRole('button', { name: /show password/i });
    await user.click(toggle);
    // now revealed; toggle again
    const hideToggle = screen.getByRole('button', { name: /hide password/i });
    await user.click(hideToggle);
    expect(screen.getByLabelText(/test password/i)).toHaveAttribute('type', 'password');
  });

  it('shows error message when error prop is provided', () => {
    renderInput({ error: 'Password is required.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Password is required.');
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'test-pw-error');
  });

  it('toggle aria-label updates: "Show password" when masked, "Hide password" when revealed', async () => {
    const user = userEvent.setup();
    renderInput();
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
  });

  it('toggling one instance does not affect a sibling instance', async () => {
    const user = userEvent.setup();
    render(
      <>
        <PasswordInput
          id="pw-a"
          label="Password A"
          value="abc"
          onChange={jest.fn()}
          onBlur={jest.fn()}
        />
        <PasswordInput
          id="pw-b"
          label="Password B"
          value="def"
          onChange={jest.fn()}
          onBlur={jest.fn()}
        />
      </>,
    );

    const inputA = screen.getByLabelText(/password a/i);
    const inputB = screen.getByLabelText(/password b/i);

    // Both start masked
    expect(inputA).toHaveAttribute('type', 'password');
    expect(inputB).toHaveAttribute('type', 'password');

    // Toggle A
    const toggles = screen.getAllByRole('button', { name: /show password/i });
    // reason: getAllByRole always returns at least one element when found; index access is safe here
    await user.click(toggles[0]!);

    // A is revealed, B still masked
    expect(inputA).toHaveAttribute('type', 'text');
    expect(inputB).toHaveAttribute('type', 'password');
  });

  it('input has aria-invalid=true and aria-describedby pointing to error element when error is present', () => {
    renderInput({ error: 'Some error.' });
    const input = screen.getByLabelText(/test password/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'test-pw-error');
  });

  it('disables input and toggle when disabled prop is true', () => {
    renderInput({ disabled: true });
    expect(screen.getByLabelText(/test password/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /show password/i })).toBeDisabled();
  });
});
