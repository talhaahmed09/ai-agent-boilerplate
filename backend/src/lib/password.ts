/**
 * Password rule (mirrors spec §3/§5) and hashing.
 * Hashing uses bcryptjs (pure JS, no native build) per plan §6, cost factor 10.
 * The plaintext password never leaves this module except as a hash.
 */
import bcrypt from 'bcryptjs';

const MIN = 8;
const MAX = 128;
const HAS_LETTER = /[A-Za-z]/;
const HAS_NUMBER = /[0-9]/;
const BCRYPT_COST = 10;

/** Returns an error message if the password is invalid, or null if it is valid. */
export function checkPasswordRule(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN || password.length > MAX) {
    return 'Password must be at least 8 characters and include a letter and a number.';
  }
  if (!HAS_LETTER.test(password) || !HAS_NUMBER.test(password)) {
    return 'Password must be at least 8 characters and include a letter and a number.';
  }
  return null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
