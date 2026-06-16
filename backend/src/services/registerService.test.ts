import { registerUser } from './registerService';
import { InMemoryUserRepository } from '../data/userRepository';
import { AppError } from '../lib/errors';
import { verifyPassword } from '../lib/password';

function repo() {
  return new InMemoryUserRepository();
}

describe('registerService', () => {
  it('AC-3: creates a user and returns id+email+token, never the password', async () => {
    const r = repo();
    const result = await registerUser(r, { email: 'New@Example.com', password: 'hunter2hunter2' });
    expect(result.user.id).toMatch(/^usr_/);
    expect(result.user.email).toBe('new@example.com'); // normalized
    expect(result.token).toMatch(/^sess_/);
    expect(JSON.stringify(result)).not.toContain('hunter2hunter2');
  });

  it('AC-10: stores only a bcrypt hash that verifies, never the plaintext', async () => {
    const r = repo();
    await registerUser(r, { email: 'a@b.com', password: 'hunter2hunter2' });
    const stored = await r.findByEmail('a@b.com');
    expect(stored).not.toBeNull();
    expect(stored!.passwordHash).not.toContain('hunter2hunter2');
    expect(stored!.passwordHash.startsWith('$2')).toBe(true);
    expect(await verifyPassword('hunter2hunter2', stored!.passwordHash)).toBe(true);
  });

  it('AC-5 / ERR-1: rejects a duplicate email case-insensitively without creating a second account', async () => {
    const r = repo();
    await registerUser(r, { email: 'dup@example.com', password: 'hunter2hunter2' });
    await expect(
      registerUser(r, { email: 'DUP@example.com', password: 'another1pass' }),
    ).rejects.toMatchObject({ status: 409, code: 'EMAIL_TAKEN', fieldErrors: { email: expect.any(String) } });
  });

  it('AC-6 / ERR-2: rejects a password with no number', async () => {
    const r = repo();
    await expect(
      registerUser(r, { email: 'c@d.com', password: 'onlyletters' }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION', fieldErrors: { password: expect.any(String) } });
  });

  it('AC-6 / ERR-2: rejects a password shorter than 8 chars', async () => {
    const r = repo();
    await expect(
      registerUser(r, { email: 'c@d.com', password: 'ab1' }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('AC-7 / ERR-3: rejects a malformed email with a field error', async () => {
    const r = repo();
    await expect(
      registerUser(r, { email: 'not-an-email', password: 'hunter2hunter2' }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION', fieldErrors: { email: expect.any(String) } });
  });
});
