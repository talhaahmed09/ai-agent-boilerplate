/**
 * Login business logic. Validates credentials, issues a session token.
 * Throws INVALID_CREDENTIALS for both unknown email and wrong password
 * (single generic error prevents account enumeration, spec §10 ERR-7).
 * The plaintext password is never returned, stored, or logged.
 */
import { randomBytes } from 'crypto';
import { UserRepository } from '../data/userRepository';
import { verifyPassword } from '../lib/password';
import { invalidCredentials } from '../lib/errors';

export interface LoginResult {
  user: { id: string; email: string };
  token: string;
}

function issueToken(): string {
  return `sess_${randomBytes(24).toString('hex')}`;
}

export async function loginUser(
  repo: UserRepository,
  input: { email: string; password: string },
): Promise<LoginResult> {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';

  const stored = await repo.findByEmail(email);
  if (!stored) {
    throw invalidCredentials();
  }

  const passwordOk = await verifyPassword(input.password, stored.passwordHash);
  if (!passwordOk) {
    throw invalidCredentials();
  }

  return {
    user: { id: stored.id, email: stored.email },
    token: issueToken(),
  };
}
