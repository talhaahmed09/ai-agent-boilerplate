import { buildApp } from '../app';
import { InMemoryUserRepository } from '../data/userRepository';
import { InMemoryProductStore } from '../data/productStore';
import { InMemoryOrderStore } from '../data/orderStore';
import { hashPassword } from '../lib/password';

async function appWithUser(email: string, password: string) {
  const users = new InMemoryUserRepository();
  const passwordHash = await hashPassword(password);
  await users.create({ email: email.trim().toLowerCase(), passwordHash });
  const instance = buildApp({
    users,
    products: new InMemoryProductStore(),
    orders: new InMemoryOrderStore(),
  });
  await instance.ready();
  return instance;
}

function freshApp() {
  const instance = buildApp({
    users: new InMemoryUserRepository(),
    products: new InMemoryProductStore(),
    orders: new InMemoryOrderStore(),
  });
  return instance;
}

describe('POST /login', () => {
  it('AC-17: valid credentials -> 200 with { user: { id, email }, token }, no password in body', async () => {
    const a = await appWithUser('alice@example.com', 'hunter2hunter2');
    const res = await a.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'alice@example.com', password: 'hunter2hunter2' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe('alice@example.com');
    expect(body.user.id).toMatch(/^usr_/);
    expect(body.token).toMatch(/^sess_[0-9a-f]{48}$/);
    expect(JSON.stringify(body)).not.toContain('hunter2hunter2');
    await a.close();
  });

  it('AC-19 / ERR-7: wrong password -> 401 INVALID_CREDENTIALS, no fieldErrors', async () => {
    const a = await appWithUser('bob@example.com', 'correctpass1');
    const res = await a.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'bob@example.com', password: 'wrongpass99' },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
    expect(body.error.fieldErrors).toBeUndefined();
    await a.close();
  });

  it('AC-19 / ERR-7: unknown email -> 401 INVALID_CREDENTIALS, same message (no enumeration)', async () => {
    const a = freshApp();
    await a.ready();
    const res = await a.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'nobody@example.com', password: 'somepass99' },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
    expect(body.error.message).toBe('Incorrect email or password.');
    expect(body.error.fieldErrors).toBeUndefined();
    await a.close();
  });

  it('ERR-9: after 10 requests -> 429 RATE_LIMIT', async () => {
    const a = freshApp();
    await a.ready();
    // Send 10 requests that will be allowed (rate limit is 10 per 15 min)
    for (let i = 0; i < 10; i++) {
      await a.inject({
        method: 'POST',
        url: '/login',
        payload: { email: `user${i}@example.com`, password: 'wrongpass99' },
      });
    }
    // The 11th request must be rate-limited
    const res = await a.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'user10@example.com', password: 'wrongpass99' },
    });
    expect(res.statusCode).toBe(429);
    const body = res.json();
    expect(body.error.code).toBe('RATE_LIMIT');
    expect(body.error.message).toBe('Too many attempts. Please wait a few minutes and try again.');
    await a.close();
  });

  it('Boundary: malformed email -> 400 VALIDATION', async () => {
    const a = freshApp();
    await a.ready();
    const res = await a.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'not-an-email', password: 'somepass99' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION');
    await a.close();
  });

  it('Boundary: missing password -> 400 VALIDATION', async () => {
    const a = freshApp();
    await a.ready();
    const res = await a.inject({
      method: 'POST',
      url: '/login',
      payload: { email: 'user@example.com' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION');
    await a.close();
  });
});
