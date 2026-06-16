import { buildApp } from '../app';
import { InMemoryUserRepository } from '../data/userRepository';

function app() {
  return buildApp({ users: new InMemoryUserRepository() });
}

describe('POST /register', () => {
  it('AC-3: 201 with user{id,email}+token and no password echoed back', async () => {
    const a = app();
    const res = await a.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'new@example.com', password: 'hunter2hunter2' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe('new@example.com');
    expect(body.user.id).toMatch(/^usr_/);
    expect(body.token).toMatch(/^sess_/);
    expect(JSON.stringify(body)).not.toContain('hunter2hunter2');
    await a.close();
  });

  it('AC-5 / ERR-1: duplicate email -> 409 EMAIL_TAKEN with email fieldError', async () => {
    const a = app();
    const payload = { email: 'dup@example.com', password: 'hunter2hunter2' };
    await a.inject({ method: 'POST', url: '/register', payload });
    const res = await a.inject({ method: 'POST', url: '/register', payload });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      error: {
        code: 'EMAIL_TAKEN',
        message: expect.any(String),
        fieldErrors: { email: expect.any(String) },
      },
    });
    await a.close();
  });

  it('AC-6 / ERR-2: weak password -> 400 VALIDATION with password fieldError', async () => {
    const a = app();
    const res = await a.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'c@d.com', password: 'onlyletters' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION');
    expect(res.json().error.fieldErrors.password).toEqual(expect.any(String));
    await a.close();
  });

  it('AC-7 / ERR-3: malformed email -> 400 VALIDATION with email fieldError (never 500)', async () => {
    const a = app();
    const res = await a.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'not-an-email', password: 'hunter2hunter2' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION');
    expect(res.json().error.fieldErrors.email).toEqual(expect.any(String));
    await a.close();
  });

  it('ERR-4: missing password -> 400 VALIDATION, never 500', async () => {
    const a = app();
    const res = await a.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'c@d.com' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION');
    await a.close();
  });

  it('ERR-4: unknown extra field is stripped at the boundary (mass-assignment safe)', async () => {
    // additionalProperties:false makes Fastify strip unknown fields before the
    // handler, so a smuggled field (e.g. role:admin) can never reach business
    // logic. The request still succeeds on its valid fields.
    const a = app();
    const res = await a.inject({
      method: 'POST',
      url: '/register',
      payload: { email: 'c@d.com', password: 'hunter2hunter2', role: 'admin' },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.stringify(res.json())).not.toContain('admin');
    await a.close();
  });

  it('AC-3: health endpoint is up for the behavioral validator readiness probe', async () => {
    const a = app();
    const res = await a.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await a.close();
  });
});
