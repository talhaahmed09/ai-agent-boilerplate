# Plan — User registration & login

> The HOW, derived from the approved `spec.md`. Updated after spec revision to
> cover login, logout, routing, session persistence, and show/hide toggles.
> Names libraries, files, and functions the spec may not.

## 1. Approach

Two repos build to one API contract. The backend exposes `POST /register` and
`POST /login`: thin Fastify routes validate at the boundary, delegate to services,
and map to the shared error envelope. Rate limiting is applied to both via
`@fastify/rate-limit`. The frontend adds `react-router-dom` for routing, a
`loginThunk` alongside the existing `registerThunk`, a `LoginForm` component, a
`Dashboard` component, and a localStorage persistence layer that rehydrates auth
state on boot.

Validation is duplicated deliberately: client validates for fast feedback; server
re-validates because the client cannot be trusted. Both sides share the same error
shape so the frontend renders a server field error in the same slot as a client one.

The in-memory `UserRepository` remains the data layer for demo. The Prisma
adapter is documented but not wired (spec §2, one-file swap in `server.ts`).

## 2. Architecture & file layout

### Backend (`backend/`)

**Existing (already implemented — registration only):**
- `src/app.ts` — `buildApp({ users })` returns configured Fastify instance.
- `src/server.ts` — boots with in-memory repo on `PORT` (default 3001).
- `src/routes/register.ts` — `POST /register` route.
- `src/schemas/register.ts` — JSON schema for register body.
- `src/services/registerService.ts` — uniqueness + hashing + token.
- `src/services/registerService.test.ts` — service unit tests.
- `src/data/userRepository.ts` — `UserRepository` interface + `InMemoryUserRepository`.
- `src/data/prismaUserRepository.ts` — documented stub.
- `src/lib/errors.ts` — `AppError` + envelope mapper.
- `src/lib/password.ts` — `hashPassword` / `verifyPassword` + rule.
- `src/routes/register.test.ts` — route integration tests.

**New (to be added):**
- `src/routes/login.ts` — `POST /login` route: schema-validated body, calls
  `loginService`, maps to response/envelope. Returns `200` on success.
- `src/schemas/login.ts` — JSON schema for login body (email + non-empty password).
- `src/services/loginService.ts` — email lookup, `verifyPassword`, token issuance;
  throws `INVALID_CREDENTIALS` `AppError` for unknown email or wrong password
  (single error for both — no enumeration).
- `src/services/loginService.test.ts` — service unit tests (happy path, wrong
  password, unknown email, boundary inputs).
- `src/routes/login.test.ts` — route integration tests via `fastify.inject()`.
- **`src/app.ts` (modify)** — register `@fastify/rate-limit` plugin (10 req / 15 min
  per IP, applied globally; `POST /register` and `POST /login` are the sensitive
  routes). Add `INVALID_CREDENTIALS` and `RATE_LIMIT` error codes. Register login
  route.
- **`src/lib/errors.ts` (modify)** — add `invalidCredentials()` factory
  (401, `INVALID_CREDENTIALS`). Add `RATE_LIMIT` code + `rateLimited()` factory
  (429). Update `EMAIL_TAKEN` message to
  `"An account with that email already exists."`.

### Frontend (`frontend/`)

**Existing (already implemented — registration only):**
- `src/store/index.ts` — `makeStore({ services })` factory.
- `src/store/slices/auth/authSlice.ts` — status/user/token/fieldErrors/formError.
- `src/store/thunks/auth/registerThunk.ts` — register API call.
- `src/store/selectors/auth/authSelectors.ts` — auth selectors.
- `src/services/authService.ts` — `register()` HTTP call.
- `src/utils/validation.ts` — `validateEmail`, `validatePassword`, `validateConfirm`.
- `src/components/RegistrationForm.tsx` (+ `.test.tsx`).
- `src/lib/extractThunkError.ts`.

**New (to be added):**
- `src/main.tsx` (or `src/index.tsx`) — app entry point; wraps `<App>` in Redux
  `<Provider>` and `<BrowserRouter>`; reads `bloomcart_auth` from `localStorage`
  and passes as `preloadedState` to `makeStore` for boot rehydration.
- `src/App.tsx` — route tree: `/register` → `<RegistrationForm>`,
  `/login` → `<LoginForm>`, `/dashboard` → `<Dashboard>`.
  Contains `<ProtectedRoute>` and `<GuestRoute>` guards.
- `src/components/LoginForm.tsx` (+ `.test.tsx`) — controlled form: email +
  password (with show/hide toggle), non-empty validation, `loginThunk` dispatch,
  form-level server error, loading state, link to `/register`.
- `src/components/Dashboard.tsx` (+ `.test.tsx`) — shows `user.email`, logout
  button that dispatches `logout` action and navigates to `/login`.
- `src/components/PasswordInput.tsx` — reusable controlled password field with
  independent show/hide toggle (`<button>` toggling `type="password"` ↔
  `type="text"`). Used by both forms. Accessible: toggle label reflects state
  ("Show password" / "Hide password"). Exported with `.test.tsx`.
- **`src/components/RegistrationForm.tsx` (modify)** — replace raw password
  `<input>` elements with `<PasswordInput>`, add "Already have an account?
  Sign in" link to `/login`.
- `src/store/thunks/auth/loginThunk.ts` — mirrors `registerThunk`; calls
  `extra.services.authService.login()`; rejects with `{ message? }` (no field
  errors for login).
- `src/store/slices/auth/authSlice.ts` (modify) — add `loginThunk`
  `extraReducers`; add `logout` reducer (clears state + removes `bloomcart_auth`
  from `localStorage`); keep existing register cases.
- `src/store/slices/auth/authSlice.test.ts` (modify) — add login + logout cases.
- **`src/services/authService.ts` (modify)** — add `login()` method to
  `AuthService` interface and `httpAuthService` implementation; calls
  `POST /login`, maps 401 to `"Incorrect email or password."`, 429 to rate-limit
  message.
- **`src/store/index.ts` (modify)** — accept optional `preloadedState` in
  `makeStore`; persist `{ user, token }` to `localStorage` in the store
  subscriber on every `auth/register/fulfilled` and `auth/login/fulfilled`
  action.

## 3. Dependencies

| Package | Repo | Why |
|---------|------|-----|
| `fastify` | backend | HTTP framework (constitution stack). |
| `@fastify/rate-limit` | backend | **New.** Rate-limits `/register` and `/login` to 10 req / 15 min per IP. Pure Fastify plugin, no extra infra. |
| `bcryptjs` | backend | Pure-JS salted hashing (no native build). Justified over `argon2`/`bcrypt` for sandbox/CI compatibility. |
| `react-router-dom` | frontend | **New.** Client-side routing for `/register`, `/login`, `/dashboard`. Standard choice for React + Vite/CRA. |
| `typescript, ts-jest, jest, @types/*` | both | Stack + test framework (constitution). |
| `@reduxjs/toolkit, react-redux, react` | frontend | State + UI (constitution stack). |
| `@testing-library/react, @testing-library/user-event, jest-environment-jsdom` | frontend | RTL component tests (constitution stack). |
| `tailwindcss` | frontend | Styling (constitution stack); not exercised by tests. |

## 4. Milestones (delegation units)

| # | Milestone | Repo | Depends on | ACs / ERRs covered |
|---|-----------|------|-----------|---------------------|
| M1 | `POST /register` — already complete | backend | — | AC-3,5,6,7,10; ERR-1..4 |
| M2 | Registration frontend — already complete | frontend | M1 | AC-1,2,4,6,7,8,9 |
| M3 | **`POST /login`**: schema + service + route + tests; rate-limit plugin on both routes; update error codes + EMAIL_TAKEN message | backend | M1 | AC-17,19; ERR-6,7,8,9 |
| M4 | **`react-router-dom`** wiring: `App.tsx`, route tree, `ProtectedRoute`, `GuestRoute`, `main.tsx` with `preloadedState` rehydration | frontend | M2 | AC-13,22,26,27 |
| M5 | **`PasswordInput`** component + modify `RegistrationForm` (show/hide + sign-in link); `LoginForm` + `loginThunk` + auth slice login/logout cases; `Dashboard` + logout | frontend | M4 | AC-11,12,14,15,16,18,19,20,21,23,24,25 |

M1 and M2 are already satisfied. M3–M5 are the new work.

## 5. Cross-repo contract

See `api-contract.md` — the single source of truth. Neither worker edits it
unilaterally; flag a re-plan if a change is needed.

## 6. Risks / deviations from the constitution

- **`@fastify/rate-limit`**: new backend dependency, justified by spec §11 and
  security requirement. Pure Fastify plugin, no additional infrastructure.
- **`react-router-dom`**: new frontend dependency, justified by spec §3 (routing
  is now in scope). No alternative achieves client-side routing without a router.
- **bcryptjs over bcrypt/argon2**: unchanged — pure-JS, no native build.
- **In-memory repository**: unchanged — spec §2 confirms in-memory is acceptable
  for demo; Prisma swap is one file.
- **`INVALID_CREDENTIALS` sends no `fieldErrors`**: deliberate per spec §10 /
  grill decision — single generic message prevents account enumeration.
- **localStorage for session**: spec §4 mandates client-side persistence. No
  `HttpOnly` cookie approach in scope (would require backend session endpoint).
