/**
 * Registration business logic. Thin route -> this service -> repository.
 * Enforces the password rule, case-insensitive uniqueness, and hashing, then
 * issues an opaque session token. Throws typed AppErrors the route maps to the
 * envelope. The plaintext password is never returned, stored, or logged.
 */
import { randomBytes } from 'crypto';
import { UserRepository } from '../data/userRepository';
import { checkPasswordRule, hashPassword } from '../lib/password';
import { AppError, emailTaken, validation } from '../lib/errors';

export interface RegisterResult {
  user: { id: string; email: string };
  token: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueToken(): string {
  return `sess_${randomBytes(24).toString('hex')}`;
}

export async function registerUser(
  repo: UserRepository,
  input: { email: string; password: string },
): Promise<RegisterResult> {
  const email = typeof input.email === 'string' ? input.email.trim() : '';

  // Re-validate at the service boundary even though the route schema also checks:
  // the service must be safe to call directly (and its unit tests prove the rules).
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    throw validation('Enter a valid email address.', { email: 'Enter a valid email address.' });
  }

  const pwError = checkPasswordRule(input.password);
  if (pwError) {
    throw validation(pwError, { password: pwError });
  }

  const existing = await repo.findByEmail(email);
  if (existing) {
    throw emailTaken();
  }

  const passwordHash = await hashPassword(input.password);
  const created = await repo.create({ email, passwordHash });

  return {
    user: { id: created.id, email: created.email },
    token: issueToken(),
  };
}

export type { AppError };
