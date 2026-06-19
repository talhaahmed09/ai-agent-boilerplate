---
name: jest-testing
description: How to write Jest tests in this project for both the React/RTK frontend and the Fastify/Prisma backend. Use this whenever writing or reviewing any test, adding a feature that needs tests, deciding what to test, or verifying acceptance criteria — and use it even when the user only says "write tests", "add coverage", "verify this works", or implements a feature, since every feature here ships with Jest tests. Covers RTL component tests, slice/thunk/selector tests, Fastify route integration tests, what to test, and what to avoid.
---

# Jest testing

Jest is the only test framework in this project (frontend and backend). Every
acceptance criterion in a spec, and every error state, gets a test. Untested code
is not done.

## What to test (and what not to)

Test, in priority order:
1. **Every acceptance criterion** (AC-1, AC-2, …) from the feature's `spec.md`.
2. **Every error state** from the spec's Errors section — these are the most
   commonly skipped and the most valuable.
3. **Edge cases** named in the spec (empty input, max length, double-submit, …).

Do **not**:
- Write snapshot-only tests as a substitute for behaviour assertions.
- Test implementation details (internal function calls, exact class names).
- Mock the thing you're trying to test. Mock at boundaries only.

Each test references the AC it covers in its name, e.g.
`it('AC-3: shows a field error when email is already registered', …)`.

## Structure

Co-locate tests with the code: `Foo.tsx` → `Foo.test.tsx`,
`registerService.ts` → `registerService.test.ts`. Use Arrange-Act-Assert. One
behaviour per `it`. Name describe blocks after the unit under test.

## Frontend

### Components — React Testing Library
Test what the user sees and does, not internals. Query by role/label/text, not
test ids, unless there is no accessible handle.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { makeStore } from '@/store';                 // a fresh store per test
import { RegistrationForm } from './RegistrationForm';

function renderWithStore(ui: React.ReactElement) {
  return render(<Provider store={makeStore()}>{ui}</Provider>);
}

it('AC-2: disables submit until all required fields are valid', async () => {
  renderWithStore(<RegistrationForm />);
  const submit = screen.getByRole('button', { name: /sign up/i });
  expect(submit).toBeDisabled();
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'hunter2hunter2');
  expect(submit).toBeEnabled();
});
```

Always build a **fresh store per test** (export a `makeStore()` factory from the
store) so state doesn't leak between tests.

### Slices, thunks, selectors
- **Reducers/slices**: call the reducer with a state + action, assert the next
  state. Pure and fast — no mocks.
- **Thunks**: dispatch against a real store with a **fake injected service**
  (the `extra` argument). Assert the resulting state, including the rejected
  path and its `{ fieldErrors, message }` shape.
- **Selectors**: feed a hand-built state, assert the derived value. Memoized
  selectors: assert referential stability across calls with equal input.

```ts
it('AC-5: registration failure stores fieldErrors from the rejected payload', async () => {
  const services = {
    authService: { register: jest.fn().mockRejectedValue({ fieldErrors: { email: 'taken' } }) },
  };
  const store = makeStore({ services });           // inject the fake
  await store.dispatch(registerThunk({ email: 'a@b.com', password: 'x' }));
  expect(store.getState().auth.fieldErrors).toEqual({ email: 'taken' });
});
```

## Backend

### Routes — integration tests with `fastify.inject()`
Spin up the app, inject a request, assert status + body. This exercises schema
validation, the handler, and the response envelope together.

```ts
import { buildApp } from '../app';

it('AC-7: rejects a duplicate email with 409 and a field error', async () => {
  const app = buildApp({ db: fakeDb({ existingEmails: ['a@b.com'] }) });
  const res = await app.inject({
    method: 'POST',
    url: '/register',
    payload: { email: 'a@b.com', password: 'hunter2hunter2' },
  });
  expect(res.statusCode).toBe(409);
  expect(res.json()).toEqual({
    error: { code: 'EMAIL_TAKEN', message: expect.any(String), fieldErrors: { email: expect.any(String) } },
  });
  await app.close();
});
```

- Inject a **fake data layer** (or a transactional test DB) rather than hitting a
  real Postgres in unit/integration tests. Keep tests deterministic.
- Test the **validation boundary** directly: malformed/missing fields must return
  a typed 4xx, never a 500.
- Always `await app.close()`.

### Services
Pure-ish logic gets plain unit tests with the data access mocked. Assert both the
happy path and each typed error it can throw.

## Coverage expectation

Coverage is a floor, not a goal: the real bar is "every AC and every error state
has a test." A criterion without a test is an incomplete task — flag it.

## Running

- Frontend: `cd frontend && npx jest`
- Backend: `cd backend && npx jest`
- The commit gate (`gate.sh`) runs these automatically; CI runs them again.
