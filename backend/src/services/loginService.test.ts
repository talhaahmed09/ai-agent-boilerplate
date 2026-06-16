import { loginUser } from './loginService';
import { InMemoryUserRepository } from '../data/userRepository';
import { hashPassword } from '../lib/password';

async function repoWithUser(email: string, password: string): Promise<InMemoryUserRepository> {
  const r = new InMemoryUserRepository();
  const passwordHash = await hashPassword(password);
  await r.create({ email: email.trim().toLowerCase(), passwordHash });
  return r;
}

describe('loginService', () => {
  it('AC-17: happy path — correct credentials return { user: { id, email }, token }', async () => {
    const r = await repoWithUser('alice@example.com', 'hunter2hunter2');
    const result = await loginUser(r, { email: 'alice@example.com', password: 'hunter2hunter2' });
    expect(result.user.id).toMatch(/^usr_/);
    expect(result.user.email).toBe('alice@example.com');
    expect(result.token).toMatch(/^sess_[0-9a-f]{48}$/);
  });

  it('AC-19 / ERR-7: wrong password throws INVALID_CREDENTIALS with status 401', async () => {
    const r = await repoWithUser('bob@example.com', 'correctpass1');
    await expect(
      loginUser(r, { email: 'bob@example.com', password: 'wrongpass99' }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  it('AC-19 / ERR-7: unknown email throws INVALID_CREDENTIALS with status 401 (no enumeration)', async () => {
    const r = new InMemoryUserRepository();
    await expect(
      loginUser(r, { email: 'nobody@example.com', password: 'somepass1' }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
  });

  it('AC-19 / ERR-7: INVALID_CREDENTIALS has no fieldErrors (form-level only)', async () => {
    const r = new InMemoryUserRepository();
    await expect(
      loginUser(r, { email: 'nobody@example.com', password: 'somepass1' }),
    ).rejects.toMatchObject({ fieldErrors: undefined });
  });

  it('token format matches /^sess_[0-9a-f]{48}$/', async () => {
    const r = await repoWithUser('carol@example.com', 'hunter2hunter2');
    const result = await loginUser(r, { email: 'carol@example.com', password: 'hunter2hunter2' });
    expect(result.token).toMatch(/^sess_[0-9a-f]{48}$/);
  });

  it('result never echoes the plaintext password', async () => {
    const pw = 'secretPass9';
    const r = await repoWithUser('dave@example.com', pw);
    const result = await loginUser(r, { email: 'dave@example.com', password: pw });
    expect(JSON.stringify(result)).not.toContain(pw);
  });

  it('AC-17: email is case-insensitively matched (normalised on login)', async () => {
    const r = await repoWithUser('eve@example.com', 'hunter2hunter2');
    const result = await loginUser(r, { email: 'EVE@EXAMPLE.COM', password: 'hunter2hunter2' });
    expect(result.user.email).toBe('eve@example.com');
  });
});
