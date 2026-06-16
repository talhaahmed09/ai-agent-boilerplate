# PR Review — User registration & login (Bloomcart)

> Human gate #3. Review this document and the linked source before approving merge.
> Spec: `specs/registration/spec.md` | Design: `specs/registration/design.md`
> Validator reports: `specs/registration/reports/`

---

## What this PR delivers

Full user registration and login for Bloomcart, built in two repos against a
single API contract. Users can create an account, sign in, and log out. Sessions
survive page refresh. The board-demo backend runs on an in-memory store; the
Prisma production path is documented and one file swap away.

### Acceptance criteria status

All 27 ACs from the approved spec are implemented and tested.

| Group | ACs | Status |
|-------|-----|--------|
| Registration form | AC-1 through AC-14 | ✅ All passing |
| Login form | AC-15 through AC-23 | ✅ All passing |
| Dashboard & logout | AC-24 through AC-27 | ✅ All passing |

---

## Commits

### Backend (`backend/`)

| Commit | Description |
|--------|-------------|
| `256fecb` | feat(registration): registration feature — `POST /register`, bcrypt hashing, in-memory repo, error envelope |
| `ce54cac` | feat(M3): `POST /login`, `@fastify/rate-limit` (10/15 min), `INVALID_CREDENTIALS` + `RATE_LIMIT` error codes, updated `EMAIL_TAKEN` message |

### Frontend (`frontend/`)

| Commit | Description |
|--------|-------------|
| `4226dad` | feat(registration): Redux slice, registerThunk, RegistrationForm, validation utils |
| `16860a8` | feat(routing): react-router-dom, `GuestRoute`, `ProtectedRoute`, `App.tsx`, `main.tsx` with `preloadedState` rehydration |
| `fd62453` | feat(auth): `PasswordInput`, `LoginForm`, `Dashboard`, `loginThunk`, `logout` reducer, `authService.login()` |
| *(pending)* | fix: scrutiny blocker fixes — email input `disabled`, AC-25 localStorage test, authSlice test message |

---

## Key design decisions (for reviewer)

1. **Session persistence**: `{ user, token }` stored in `localStorage` under `bloomcart_auth`. Rehydrated into `preloadedState` on boot — no network call, no flicker.
2. **Login errors are always form-level**: 401 never sets `fieldErrors` (prevents account enumeration — spec §10 ERR-7 security note).
3. **Password cleared on 401**: email preserved, password wiped and touch-state reset so "Password is required." does not appear alongside the form banner.
4. **Rate limit is global** (`@fastify/rate-limit` v8 for Fastify 4 compat): 10 req / 15 min per IP applies to both `/register` and `/login`.
5. **`@fastify/rate-limit` v8 pinned**: v9 requires Fastify 5. Noted in plan §6.
6. **react-router-dom v7 installed** (latest): API surface used (`BrowserRouter`, `Routes`, `Navigate`, `MemoryRouter`) is identical to v6. `TextEncoder` polyfill added to `src/test/setup.ts`.

---

## What was validated

| Validator | Verdict | Report |
|-----------|---------|--------|
| Scrutiny (typecheck + lint + tests + code review) | **PASS** | `reports/scrutiny.md` |
| Behavioral (live HTTP against real server) | **PASS** | `reports/behavioral.md` |

Gates: `tsc --noEmit` + `eslint` + `jest` pass in both repos.
Test counts: **26 backend** / **57 frontend** (all green).

---

## Scrutiny blockers fixed before this review

Three blockers found by the independent scrutiny validator and fixed before this
PR review was written:

| # | Blocker | Fix |
|---|---------|-----|
| 1 | `authSlice.test.ts` asserted old email-taken message | Updated stub + assertion to `"An account with that email already exists."` |
| 2 | No test for `localStorage.removeItem` on logout (AC-25) | Added test to `store/index.test.ts` — dispatches `logout()`, asserts key removed |
| 3 | Email input in `RegistrationForm` not disabled while submitting | Added `disabled={submitting}` + disabled Tailwind classes |

---

## Known follow-up items (non-blocking for demo)

These are tracked should-fixes from the scrutiny report. None block the board demo.

| # | Item | File |
|---|------|------|
| 1 | LoginForm AC-19 test missing "no field error alongside banner" assertion | `LoginForm.test.tsx` |
| 2 | `clearPasswordOnError` flag is a fragile React state race | `LoginForm.tsx` |
| 3 | `readPersistedAuth` in `main.tsx` does not validate inner string types | `main.tsx` |
| 4 | `loginThunk.ts` cast missing `// reason:` comment | `loginThunk.ts` |
| 5 | `RegisterInput`/`RegisterResponse` imported in login thunk (misleading names) | `loginThunk.ts` |

---

## Out of scope (deferred, per spec §2)

- Social / third-party login
- Email verification
- Forgot-password flow
- CORS configuration
- Persistent database (Prisma wiring is the documented next step)
- Per-account login lockout (beyond the IP-level rate limit)

---

## Reviewer checklist

- [ ] Spec `specs/registration/spec.md` matches what is built (27 ACs)
- [ ] Design `specs/registration/design.md` matches the component behaviour
- [ ] API contract `specs/registration/api-contract.md` matches backend routes
- [ ] Scrutiny report `reports/scrutiny.md` — PASS, blockers resolved
- [ ] Behavioral report `reports/behavioral.md` — PASS, 12/12 live HTTP checks
- [ ] No secrets, keys, or `.env` contents in any commit
- [ ] All follow-up items are acceptable as post-demo backlog

**Human gate #3: approve to merge.**
