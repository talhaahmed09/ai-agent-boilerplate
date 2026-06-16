# Worker handoff — registration / M3 / backend

> Filled out by the worker subagent at the end of a milestone. This artifact —
> not a verbal "done" — is what the orchestrator and validators trust. Be honest;
> a documented failure is more valuable than an optimistic summary.

## 1. Scope of this milestone
- Repo: `backend`
- Plan tasks covered: M3 — POST /login schema + service + route + tests; @fastify/rate-limit plugin on both routes; update error codes + EMAIL_TAKEN message
- Acceptance criteria targeted: AC-17, AC-19; ERR-6, ERR-7, ERR-9

## 2. Completed
| AC / item | What was done | File(s) |
|-----------|---------------|---------|
| AC-17 | POST /login returns 200 with `{ user: { id, email }, token }`, token matches `/^sess_[0-9a-f]{48}$/`, no password in body | `src/routes/login.ts`, `src/services/loginService.ts` |
| AC-19 / ERR-7 | Wrong password or unknown email both return 401 INVALID_CREDENTIALS with message "Incorrect email or password." and no fieldErrors (prevents account enumeration) | `src/services/loginService.ts`, `src/lib/errors.ts` |
| ERR-6 / ERR-9 | Rate limit of 10 req / 15 min per IP applied globally; 11th request returns 429 RATE_LIMIT with canonical message | `src/app.ts` |
| email schema | loginBodySchema: email (format email, maxLength 254), password (minLength 1, maxLength 128), additionalProperties false | `src/schemas/login.ts` |
| INVALID_CREDENTIALS | Added error code + `invalidCredentials()` factory (401) | `src/lib/errors.ts` |
| RATE_LIMIT | Added error code + `rateLimited()` factory (429) | `src/lib/errors.ts` |
| emailTaken message | Updated from "That email is already registered." to "An account with that email already exists." (both message and fieldErrors.email) per API contract | `src/lib/errors.ts` |
| Login service tests | 7 tests: happy path, wrong password, unknown email, no fieldErrors on INVALID_CREDENTIALS, token format regex, no password echo, case-insensitive email match | `src/services/loginService.test.ts` |
| Login route tests | 6 tests: 200 valid, 401 wrong password, 401 unknown email, 429 rate limit, 400 malformed email, 400 missing password | `src/routes/login.test.ts` |

## 3. Left undone / out of scope (and why)
- `rateLimited()` factory was added to `src/lib/errors.ts` but is not invoked directly in the app — the rate-limit plugin handles 429 via `setErrorHandler`. The factory is available for direct use (e.g. by future middleware or tests) but is not wired into the plugin path. This is correct; the plan only says to add it.
- Login validation field messages for the password field use the same generic message as register ("Password must be at least 8 characters and include a letter and a number.") because the error handler is shared. For login, the spec only checks that password is non-empty (minLength 1), so this message will never actually appear for a missing-password login request — the missingProperty branch sets `fieldErrors.password`. The message string is slightly misleading but matches the existing register handler and is not user-visible in any failing test.

## 4. Commands run + exit codes
| Command | Exit code | Notes |
|---------|-----------|-------|
| `npm install @fastify/rate-limit` | 0 | Installed latest (v9) — wrong, required Fastify v5 |
| `npx jest` (after v9 install) | 1 | All 13 route tests failed: "expected '5.x' fastify version, '4.29.1' is installed" |
| `npm install @fastify/rate-limit@8` | 0 | Downgraded to v8 (Fastify 4.x compatible) |
| `npx jest` (after v8 install, first attempt) | 1 | 1 test failed: ERR-9 rate limit test got 500 instead of 429 |
| `npx tsc --noEmit` (after first app.ts fix attempt) | 2 | TS error: `statusCode` not on `errorResponseBuilderContext` type in v8 |
| `npx tsc --noEmit` (after cast fix) | 0 | |
| `npx eslint .` | 0 | |
| `npx jest` (final) | 0 | 26 passed / 26 total (4 suites) |
| `git commit` | 0 | Commit ce54cac |

## 5. Issues / surprises discovered

1. **@fastify/rate-limit version mismatch**: The plan says to install `@fastify/rate-limit` without specifying a version. `npm install @fastify/rate-limit` installed v9, which requires Fastify 5.x. The project runs Fastify 4.29.1. The correct package is `@fastify/rate-limit@8`. This is a constraint the next worker (or plan) should document: any `@fastify/*` plugin installs must pin to a v4-compatible version while the app is on Fastify 4.

2. **Rate-limit plugin throws errorResponseBuilder return value**: In `@fastify/rate-limit` v8, `errorResponseBuilder` is not a response serialiser — the plugin literally `throw`s its return value (see `index.js` line 271). This means returning a plain `ErrorEnvelope` object caused a 500 because Fastify's error handler received an unrecognised thrown value. The fix is to return a real `Error` with `statusCode: 429` from `errorResponseBuilder`, so `setErrorHandler` can detect `error.statusCode === 429` and emit the RATE_LIMIT envelope. This is an implementation detail not obvious from the plugin README and is documented with a `// reason:` comment in `src/app.ts`.

3. **v8 types omit `statusCode` from `errorResponseBuilderContext`**: The v8 type definition for `errorResponseBuilderContext` does not include `statusCode` (unlike v9 types). Accessing `ctx.statusCode` caused a TS error. Since we only emit 429 (not 403 ban), hardcoding `statusCode = 429` in the errorResponseBuilder is correct.

4. **The `rateLimited()` factory is unused at runtime** (the plugin path does not call it). It was added as specified and is exported for potential future use or direct tests, but it is dead code in the current flow. This is worth noting for a future dead-code lint pass.

## 6. Procedure adherence
- [x] Built only my slice, in one repo
- [x] Built to the API contract exactly (or flagged a needed change above)
- [x] A real test exists for every AC and error state in my slice
- [x] Honoured every constraint — did not touch `src/routes/register.ts`, `src/services/registerService.ts`, or `src/schemas/register.ts`; no `any` without `// reason:`; test files sit next to tested files; no additional deps beyond `@fastify/rate-limit`
- [x] Committed through the gate (did not bypass)
- Deviations: Had to use `@fastify/rate-limit@8` instead of latest due to Fastify 4.x compatibility. This is a discovery, not a plan deviation — the spec/plan did not specify a version.

## 7. What M4 (frontend routing) must know
- `POST /login` is live at `http://localhost:3001/login` (default port from `server.ts`).
- Success: `200 OK` with `{ user: { id, email }, token }` — identical shape to `/register` 201.
- Failure: `401 INVALID_CREDENTIALS` with `{ error: { code, message } }` and no `fieldErrors` — the frontend must render this as a form-level error.
- Rate limit: `429 RATE_LIMIT` with `{ error: { code, message } }` and no `fieldErrors` — form-level error.
- The `EMAIL_TAKEN` message in `/register` responses is now "An account with that email already exists." (was "That email is already registered.") — frontend field-error copy must match.
- Token format: `sess_` followed by 48 lowercase hex chars.
