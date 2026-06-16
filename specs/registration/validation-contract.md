# Validation contract — User registration & login

> The definition of "done" for the whole feature, decided before code exists. The
> union of the spec's acceptance criteria and every error state, each bound to how
> it is proven. The feature is done only when every row is `satisfied`.

## How each row is proven
- **test** — a Jest unit/integration test the scrutiny validator confirms.
- **behavioral** — observed on the running app by the behavioral validator (real
  HTTP and/or Playwright), not inferred from source.
- **both** — success path and security-sensitive errors get a test AND a
  running-app check.

## Contract — Registration (M1 + M2, already satisfied)

| ID | Source | Behaviour to prove | Proof type | Owner repo | Status |
|----|--------|--------------------|-----------|-----------|--------|
| AC-1 | spec §6 | Form renders with submit disabled, no errors shown | test | frontend | satisfied |
| AC-2 | spec §6 | Submit enables only when all fields valid + passwords match | test | frontend | satisfied |
| AC-3 | spec §6 | Valid signup creates user, returns {id,email}+token, no password | both | backend | satisfied |
| AC-4 | spec §6 | In-flight submit shows loading + is disabled (no double submit) | test | frontend | satisfied |
| AC-5 | spec §6 | Duplicate email → no new account, field error "An account with that email already exists." | both | backend | pending |
| AC-6 | spec §6 | Weak password → field error on password, no account | both | backend | satisfied |
| AC-7 | spec §6 | Malformed email → field error on email, no account created | both | backend | satisfied |
| AC-8 | spec §6 | Password ≠ confirm → submit blocked, field error "Passwords do not match." | test | frontend | satisfied |
| AC-9 | spec §6 | Server/network failure → single form-level error, form re-submittable | test | frontend | satisfied |
| AC-10 | spec §6 | Password only ever stored hashed; never returned/logged in clear | both | backend | satisfied |
| ERR-1 | spec §10 | 409 `EMAIL_TAKEN` + email fieldError "An account with that email already exists." | both | backend | pending |
| ERR-2 | spec §10 | 400 `VALIDATION` + password fieldError on weak password | both | backend | satisfied |
| ERR-3 | spec §10 | 400 `VALIDATION` + email fieldError on malformed email | both | backend | satisfied |
| ERR-4 | spec §10 | 400 `VALIDATION` (never 500) on missing/malformed body | both | backend | satisfied |
| ERR-5 | spec §10 | Network/5xx → form-level "Something went wrong. Please try again." | test | frontend | satisfied |

> AC-5 and ERR-1 are re-opened (pending) because the error message was updated in
> the spec revision: "That email is already registered." → "An account with that
> email already exists." Tests must be updated to assert the new message.

## Contract — Registration UX additions (M5, pending)

| ID | Source | Behaviour to prove | Proof type | Owner repo | Status |
|----|--------|--------------------|-----------|-----------|--------|
| AC-11 | spec §6 | Each password field has an independent show/hide toggle | test | frontend | pending |
| AC-12 | spec §6 | "Already have an account? Sign in" link navigates to `/login` | test | frontend | pending |
| AC-13 | spec §6 | Authenticated user visiting `/register` is redirected to `/dashboard` | test | frontend | pending |
| AC-14 | spec §6 | Rate-limit breach on `/register` → form-level "Too many attempts…" | both | backend | pending |
| ERR-6 | spec §10 | 429 `RATE_LIMIT` on `/register` after 10 attempts / 15 min | both | backend | pending |

## Contract — Login (M3 + M5, pending)

| ID | Source | Behaviour to prove | Proof type | Owner repo | Status |
|----|--------|--------------------|-----------|-----------|--------|
| AC-15 | spec §7 | Login form renders with submit disabled, no errors | test | frontend | pending |
| AC-16 | spec §7 | Submit enables when email and password are both non-empty | test | frontend | pending |
| AC-17 | spec §7 | Valid credentials → session token issued, session persisted, redirect to `/dashboard` | both | backend | pending |
| AC-18 | spec §7 | In-flight login submit shows loading + is disabled | test | frontend | pending |
| AC-19 | spec §7 | Wrong password or unknown email → form-level "Incorrect email or password." (same message for both) | both | backend | pending |
| AC-20 | spec §7 | Server/network failure on login → form-level "Something went wrong. Please try again." | test | frontend | pending |
| AC-21 | spec §7 | Login password field has a show/hide toggle | test | frontend | pending |
| AC-22 | spec §7 | Authenticated user visiting `/login` is redirected to `/dashboard` | test | frontend | pending |
| AC-23 | spec §7 | Rate-limit breach on `/login` → form-level "Too many attempts…" | both | backend | pending |
| ERR-7 | spec §10 | 401 `INVALID_CREDENTIALS` → generic message, no fieldErrors, no enumeration | both | backend | pending |
| ERR-8 | spec §10 | Network/5xx on login → form-level "Something went wrong. Please try again." | test | frontend | pending |
| ERR-9 | spec §10 | 429 `RATE_LIMIT` on `/login` after 10 attempts / 15 min | both | backend | pending |

## Contract — Dashboard, session & routing (M4 + M5, pending)

| ID | Source | Behaviour to prove | Proof type | Owner repo | Status |
|----|--------|--------------------|-----------|-----------|--------|
| AC-24 | spec §8 | Dashboard shows authenticated user's email + logout button | test | frontend | pending |
| AC-25 | spec §8 | Logout clears session from storage, resets state, redirects to `/login` | test | frontend | pending |
| AC-26 | spec §8 | Unauthenticated user visiting `/dashboard` is redirected to `/login` | test | frontend | pending |
| AC-27 | spec §8 | Page refresh while authenticated rehydrates session with no network call | test | frontend | pending |

> Status is updated to `satisfied` by the orchestrator only after BOTH validators
> return `VERDICT: PASS` for the owning milestone. Rows marked `satisfied` above
> reflect the completed M1/M2 demo run (see `mission-state.md` and `handoffs/`).
> All `pending` rows are new work from the spec revision.
