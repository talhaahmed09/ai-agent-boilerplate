# Session summary — Bloomcart auth feature

> Everything done in this Claude Code session, in order.
> Workspace: `/Users/talha.imtiaz/Documents/dev-workspace`

---

## 1. Grilled the client brief → approved spec

**Input:** `specs/registration/brief.md` — a vague email from Priya (founder) asking for
"a proper sign up, dead simple, email + password."

**What happened:** 20 questions asked one at a time, each with a recommendation.
Every ambiguity in the brief was resolved before a line of code was written.

Key decisions made during the grill:

| Question | Decision |
|----------|----------|
| Session persistence | `localStorage`, survives page refresh |
| Post-registration destination | `react-router-dom`, redirect to `/dashboard` |
| Storage key & shape | `bloomcart_auth` → `{ user, token }` |
| Boot rehydration | Pure client-side, no network call |
| Confirm password field | Keep it (no forgot-password flow = no recovery otherwise) |
| Rate limiting | 10 attempts / 15 min per IP on both endpoints |
| Duplicate-email message | `"An account with that email already exists."` |
| Production database | In-memory for demo; Prisma is documented next step |
| CORS | Out of scope |
| Password show/hide toggle | In scope, independent per field |
| "Already have an account?" link | In scope |
| Login | Full login page added to scope |
| Login error message | Single generic `"Incorrect email or password."` (no enumeration) |
| Login rate limit | Same 10 / 15 min |
| Logout | In scope — clears storage, redirects to `/login` |
| 429 message | `"Too many attempts. Please wait a few minutes and try again."` |
| Login client-side validation | Non-empty checks only (no password rule on login) |
| Dashboard layout | Single centered card (no navbar) |
| Login password on 401 | Clear the field |
| Inputs while submitting | Disable all + show spinner |

**Output:** `specs/registration/spec.md` — 27 numbered acceptance criteria, fully testable.

**Gate #1:** Spec approved by human. ✅

---

## 2. Updated artifacts after spec approval

The existing `plan.md`, `api-contract.md`, and `validation-contract.md` were written
against the old registration-only spec. All three were updated to cover the expanded scope.

**`api-contract.md`** — added `POST /login` endpoint, `INVALID_CREDENTIALS` + `RATE_LIMIT`
error codes, updated `EMAIL_TAKEN` message, client storage contract.

**`plan.md`** — added M3/M4/M5 milestones, new file layout for login/dashboard/routing,
`@fastify/rate-limit` and `react-router-dom` dependency justifications.

**`validation-contract.md`** — added AC-11 through AC-27 and ERR-6 through ERR-9,
all `pending`. Reopened AC-5 and ERR-1 (message changed).

---

## 3. Design phase → approved design

**Orchestrator** produced `specs/registration/design.md` covering all three screens
with ASCII layout sketches, element anatomy, state inventories, and exact error copy.

Three items flagged for human judgment at gate #2:

| Q | Decision |
|---|----------|
| Dashboard: navbar vs. card | Single centered card |
| Login password on 401: preserve or clear | Clear |
| Disable inputs while submitting | Yes, all inputs + spinner |

**Gate #2:** Design approved by human. ✅

---

## 4. Design system pushed to claude.ai/design

11 HTML preview files built with Tailwind CDN and pushed to the **Bloomcart**
design-system project on `claude.ai/design`.

| Group | Components |
|-------|-----------|
| Foundations | Design tokens (palette, typography, card, spacing) |
| Shared Components | PasswordInput (4 states) · Error states (banner, field, buttons) |
| Registration | Idle · Field errors · Form-level error (409) · Submitting |
| Login | Idle · Wrong credentials (401) · Submitting |
| Dashboard | Authenticated card with email + logout |

---

## 5. Implementation — three milestones

### M3 — Backend login + rate limiting (commit `ce54cac`)

**New files:**
- `backend/src/schemas/login.ts` — JSON schema for `POST /login` body
- `backend/src/services/loginService.ts` — email lookup, `verifyPassword`, token issuance; throws `INVALID_CREDENTIALS` for any auth failure (no enumeration)
- `backend/src/services/loginService.test.ts` — 7 unit tests
- `backend/src/routes/login.ts` — thin `POST /login` route (returns 200)
- `backend/src/routes/login.test.ts` — 6 integration tests via `fastify.inject()`

**Modified:**
- `backend/src/lib/errors.ts` — added `INVALID_CREDENTIALS` (401) and `RATE_LIMIT` (429) codes + factories; updated `EMAIL_TAKEN` message
- `backend/src/app.ts` — registered `@fastify/rate-limit@8` globally (10/15 min); registered login route; maps 429 to `RATE_LIMIT` envelope

**Dependency note:** `@fastify/rate-limit` pinned to v8 — v9 requires Fastify 5.

**Gate:** 26/26 tests, tsc + eslint clean. ✅

---

### M4 — Frontend routing + session rehydration (commit `16860a8`)

**New files:**
- `frontend/src/main.tsx` — app entry point; reads `bloomcart_auth` from `localStorage`, parses safely, passes `preloadedState` to `makeStore`
- `frontend/src/App.tsx` — route tree: `/register` (GuestRoute), `/login` (GuestRoute), `/dashboard` (ProtectedRoute), `*` → `/register`
- `frontend/src/components/GuestRoute.tsx` — redirects authenticated users to `/dashboard` synchronously
- `frontend/src/components/ProtectedRoute.tsx` — redirects unauthenticated users to `/login` synchronously
- `frontend/src/components/GuestRoute.test.tsx` — AC-13, AC-22
- `frontend/src/components/ProtectedRoute.test.tsx` — AC-26

**Modified:**
- `frontend/src/store/index.ts` — added `preloadedState` param to `makeStore`; added `localStorage` subscriber (writes `bloomcart_auth` on auth, removes on logout)
- `frontend/src/store/index.test.ts` — AC-27 rehydration tests

**Dependency note:** `react-router-dom` resolved to v7 (not v6). API surface identical. `TextEncoder` polyfill added to test setup.

**Gate:** 26/26 tests, tsc + eslint clean. ✅

---

### M5 — UI components, login thunk, logout (commit `fd62453`)

**New files:**
- `frontend/src/components/PasswordInput.tsx` — shared controlled password field with independent show/hide toggle; `type="button"` toggle, inline SVG icons, aria-label updates, per-instance visibility state
- `frontend/src/components/PasswordInput.test.tsx` — toggle behaviour, independence, error display
- `frontend/src/components/LoginForm.tsx` — controlled login form: non-empty validation only, form-level errors, password cleared on 401, inputs disabled + spinner while submitting
- `frontend/src/components/LoginForm.test.tsx` — AC-15 through AC-21
- `frontend/src/components/Dashboard.tsx` — card with email + logout button; dispatches `logout` + `navigate('/login')`
- `frontend/src/components/Dashboard.test.tsx` — AC-24, AC-25
- `frontend/src/store/thunks/auth/loginThunk.ts` — mirrors `registerThunk`; calls `authService.login()`

**Modified:**
- `frontend/src/services/authService.ts` — added `login()` to interface and `httpAuthService`; 401 → generic message, 429 → rate-limit message, no `fieldErrors` on login
- `frontend/src/store/slices/auth/authSlice.ts` — added `loginThunk` extra reducers; added `logout` reducer (resets to `initialState`)
- `frontend/src/store/slices/auth/authSlice.test.ts` — login + logout slice tests
- `frontend/src/components/RegistrationForm.tsx` — replaced raw password inputs with `<PasswordInput>`; added "Already have an account? Sign in" `<Link>`
- `frontend/src/App.tsx` — replaced placeholders with real `LoginForm` and `Dashboard`

**Gate:** 56/56 tests, tsc + eslint clean. ✅

---

## 6. Validation

### Scrutiny validator (independent static review)

Found 3 blockers, 3 should-fixes, 3 nits. Blockers fixed immediately (commit `a86b9fc`).

**Blockers fixed:**

| # | Issue | Fix |
|---|-------|-----|
| 1 | `authSlice.test.ts` asserting old email-taken message | Updated to `"An account with that email already exists."` |
| 2 | No test for `localStorage.removeItem` on logout (AC-25) | Added test to `store/index.test.ts` |
| 3 | Email input not disabled while submitting in `RegistrationForm` | Added `disabled={submitting}` + Tailwind disabled classes |

**Final gate after fixes:** 57/57 frontend, 26/26 backend. ✅

Full report: `specs/registration/reports/scrutiny.md`

### Behavioral validator (live HTTP)

Backend compiled, booted on port 3099, driven with real `curl` requests. No mocks.

| Check | Result |
|-------|--------|
| `POST /register` valid → 201 + token | PASS |
| Token format `/^sess_[0-9a-f]{48}$/` | PASS |
| No password in response | PASS |
| Duplicate email → 409 `EMAIL_TAKEN` + correct message | PASS |
| Weak password → 400 `VALIDATION` + field error | PASS |
| Malformed email → 400 `VALIDATION` + field error | PASS |
| Missing fields → 400, never 500 | PASS |
| Rate limit → 429 `RATE_LIMIT` after 10 requests | PASS |
| `POST /login` valid → 200 + token | PASS |
| Wrong password → 401 `INVALID_CREDENTIALS`, no fieldErrors | PASS |
| Unknown email → 401, identical message (no enumeration) | PASS |
| Login token format | PASS |

**VERDICT: PASS** (12/12)

Full report: `specs/registration/reports/behavioral.md`

---

## 7. What was NOT built (deferred per spec)

- Prisma / real database (in-memory store resets on restart; one-file swap to wire Prisma)
- Forgot-password flow
- Email verification
- Social login (Google etc.)
- CORS configuration
- Per-account login lockout (beyond IP-level rate limit)

---

## 8. File map

```
specs/registration/
├── brief.md                  original client email (Priya)
├── spec.md                   approved WHAT — 27 ACs
├── plan.md                   HOW — milestones, file layout, dependencies
├── api-contract.md           cross-repo source of truth (POST /register + /login)
├── validation-contract.md    every AC bound to proof type + status
├── design.md                 UX spec — layouts, states, transitions, exact copy
├── pr-review.md              human gate #3 document
├── handoffs/
│   ├── M3-backend.md
│   ├── M4-frontend.md
│   └── M5-frontend.md
└── reports/
    ├── scrutiny.md           static review — blockers, should-fixes, nits
    └── behavioral.md         live HTTP results

backend/  (2 commits)
├── src/routes/login.ts
├── src/schemas/login.ts
├── src/services/loginService.ts + .test.ts
├── src/routes/login.test.ts
└── src/lib/errors.ts         (modified)

frontend/  (4 commits)
├── src/main.tsx
├── src/App.tsx
├── src/components/
│   ├── PasswordInput.tsx + .test.tsx
│   ├── LoginForm.tsx + .test.tsx
│   ├── Dashboard.tsx + .test.tsx
│   ├── GuestRoute.tsx + .test.tsx
│   ├── ProtectedRoute.tsx + .test.tsx
│   └── RegistrationForm.tsx  (modified)
├── src/store/
│   ├── index.ts              (modified — preloadedState, localStorage subscriber)
│   ├── index.test.ts         (modified)
│   ├── slices/auth/authSlice.ts  (modified — loginThunk, logout)
│   ├── slices/auth/authSlice.test.ts  (modified)
│   └── thunks/auth/loginThunk.ts
└── src/services/authService.ts  (modified — login())

design-previews/  (pushed to claude.ai/design — Bloomcart project)
├── shared/tokens.html
├── shared/password-input.html
├── shared/error-states.html
├── auth/registration-idle.html
├── auth/registration-errors.html
├── auth/registration-submitting.html
├── auth/registration-form-error.html
├── auth/login-idle.html
├── auth/login-error.html
├── auth/login-submitting.html
└── auth/dashboard.html
```

---

## 9. Human gates

| Gate | What | Status |
|------|------|--------|
| #1 — Spec sign-off | Approved `spec.md` after grill session | ✅ |
| #2 — Design sign-off | Approved `design.md`, resolved 3 layout questions | ✅ |
| #3 — PR approval | `specs/registration/pr-review.md` | ⏳ Pending |
