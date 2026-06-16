/**
 * Pure, shared field validation used by the form (and exercised directly by
 * tests). Pure + used in 3+ places + testable in isolation => a shared util per
 * the constitution. Each function returns a user-facing message or null if valid.
 * Messages match spec §5 exactly.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_LETTER = /[A-Za-z]/;
const HAS_NUMBER = /[0-9]/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (email.length > 254 || !EMAIL_RE.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 128) {
    return 'Password must be at least 8 characters.';
  }
  if (!HAS_LETTER.test(password) || !HAS_NUMBER.test(password)) {
    return 'Password must include a letter and a number.';
  }
  return null;
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

/** True only when all three fields are individually valid and the passwords match. */
export function isFormValid(email: string, password: string, confirm: string): boolean {
  return (
    validateEmail(email) === null &&
    validatePassword(password) === null &&
    validateConfirm(password, confirm) === null
  );
}
