import { validateEmail, validatePassword, validateConfirm, isFormValid } from './validation';

describe('validation utils', () => {
  it('AC-7: flags a malformed email and accepts a valid one', () => {
    expect(validateEmail('')).toBe('Email is required.');
    expect(validateEmail('not-an-email')).toBe('Enter a valid email address.');
    expect(validateEmail('a@b.com')).toBeNull();
  });

  it('AC-6: enforces length and letter+number on the password', () => {
    expect(validatePassword('ab1')).toBe('Password must be at least 8 characters.');
    expect(validatePassword('onlyletters')).toBe('Password must include a letter and a number.');
    expect(validatePassword('12345678')).toBe('Password must include a letter and a number.');
    expect(validatePassword('hunter2hunter2')).toBeNull();
  });

  it('AC-8: confirm must equal password', () => {
    expect(validateConfirm('abc12345', 'different')).toBe('Passwords do not match.');
    expect(validateConfirm('abc12345', 'abc12345')).toBeNull();
  });

  it('AC-2: isFormValid is true only when all fields valid and passwords match', () => {
    expect(isFormValid('a@b.com', 'hunter2hunter2', 'hunter2hunter2')).toBe(true);
    expect(isFormValid('a@b.com', 'hunter2hunter2', 'mismatch1')).toBe(false);
    expect(isFormValid('bad', 'hunter2hunter2', 'hunter2hunter2')).toBe(false);
  });
});
