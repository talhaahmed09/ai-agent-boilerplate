# Spec: User registration & login

> Produced by the Spec Author by grilling `brief.md` against `CONSTITUTION.md`.
> Updated after a second grill session to add session persistence, routing,
> login, logout, and show/hide toggles — all decisions recorded in the grill log.
> WHAT, never HOW — no library, table, or function is named here. Every line is
> testable; every acceptance criterion is numbered so a test can trace back to it.

## 1. Summary

A new visitor can create an account with an email address and a password so they
can later place an order. An existing visitor can sign in with their credentials.
Both flows share a single session model: on success the user is authenticated,
their session is persisted across page refreshes, and they land on the dashboard.
The system must never create two accounts for the same email, must store passwords
securely, and must give a clear, specific message for every way an attempt can
fail. A logged-in user can end their session from the dashboard.

## 2. Out of scope

- Social / third-party login (Google, Apple, etc.).
- Email address verification or confirmation emails.
- Password reset / forgot-password flow.
- "Remember me", multi-device session management.
- CAPTCHA and advanced bot defence (basic rate limiting only — see §8).
- Any profile fields beyond email and password (name, avatar, etc.).
- OPAQUE / passwordless auth (constitution defers this; conventional hashed
  password flow only).
- CORS configuration (separate infrastructure concern).
- Persistent database (in-memory store acceptable for demo; Prisma wiring is the
  documented next step).
- Anonymous cart merge (cart is client-side; it persists across registration
  automatically without any merge step).

## 3. Routes

| Path | Behaviour |
|------|-----------|
| `/register` | Shows the registration form. An already-authenticated user is redirected to `/dashboard` immediately. |
| `/login` | Shows the login form. An already-authenticated user is redirected to `/dashboard` immediately. |
| `/dashboard` | Shows a minimal authenticated view (user email + logout). An unauthenticated user is redirected to `/login`. |

## 4. Session model

- On successful registration or login the system issues an opaque session token.
- The token and the authenticated user's `{ id, email }` are persisted to client
  storage under the key `bloomcart_auth` so the session survives a page refresh.
- On application boot the persisted value is rehydrated into client state with no
  network call; the token is treated as valid until a protected API call rejects
  it.
- On logout the persisted value is cleared and client state is reset to
  unauthenticated.

## 5. Fields / data

### Registration

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| Email | yes | string | Valid email format; trimmed; case-insensitive for uniqueness; max 254 chars. |
| Password | yes | string | 8–128 chars; at least one letter and one number; leading/trailing spaces are significant (not trimmed). |
| Confirm password | yes (client only) | string | Must equal Password. Never sent to the server. |

### Login

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| Email | yes | string | Non-empty. Format checked client-side for fast feedback. |
| Password | yes | string | Non-empty. No rule check client-side (rules are a registration concern). |

## 6. Behaviour — registration (acceptance criteria)

- **AC-1**: Given a visitor on the registration form, When the form first renders,
  Then the submit button is disabled and no error messages are shown.
- **AC-2**: Given the form, When all of email, password, and confirm-password are
  individually valid and password equals confirm-password, Then the submit button
  is enabled.
- **AC-3**: Given a valid, unused email and a valid password, When the visitor
  submits, Then an account is created, the response identifies the new user
  (id + email, never the password), a session token is issued, the session is
  persisted, and the user is redirected to `/dashboard`.
- **AC-4**: Given a submit is in flight, When the request has not yet resolved,
  Then the submit button shows a loading state and is disabled so the form cannot
  be double-submitted.
- **AC-5**: Given the email already belongs to an account, When the visitor
  submits, Then no new account is created and the visitor sees a field-level error
  on the email field: "An account with that email already exists."
- **AC-6**: Given a password that fails the password rules, When the visitor
  submits (or the client checks on blur), Then the visitor sees a field-level
  error on the password field describing the requirement that failed, and no
  account is created.
- **AC-7**: Given an email that is not a valid email format, When the visitor
  submits (or the client checks on blur), Then the visitor sees a field-level
  error on the email field, and no request that would create an account succeeds.
- **AC-8**: Given password and confirm-password differ, When the visitor attempts
  to submit, Then submit stays disabled and a field-level error on the
  confirm-password field reads "Passwords do not match."
- **AC-9**: Given the server is unreachable or returns an unexpected error, When
  the visitor submits, Then the visitor sees a single form-level error telling
  them something went wrong and to try again, the form remains filled and
  re-submittable, and no partial account is implied.
- **AC-10**: Given stored credentials, When an account is created, Then the
  password is stored only in a securely hashed form and is never returned by any
  endpoint or logged in clear text.
- **AC-11**: Given a visitor on the registration form, When they look at the
  password or confirm-password field, Then each field has an independent
  show/hide toggle that reveals or masks that field's value without affecting the
  other field.
- **AC-12**: Given a visitor on the registration form, When the form renders,
  Then there is a visible "Already have an account? Sign in" link that navigates
  to `/login`.
- **AC-13**: Given an authenticated user navigating to `/register`, When the page
  loads, Then they are immediately redirected to `/dashboard`.
- **AC-14**: Given a visitor who hits the rate limit on `/register`, When they
  submit, Then they see a form-level error: "Too many attempts. Please wait a few
  minutes and try again."

## 7. Behaviour — login (acceptance criteria)

- **AC-15**: Given a visitor on the login form, When the form first renders,
  Then the submit button is disabled and no error messages are shown.
- **AC-16**: Given the form, When both email and password fields are non-empty,
  Then the submit button is enabled.
- **AC-17**: Given a valid email and correct password for an existing account,
  When the visitor submits, Then the session token is issued, the session is
  persisted, and the user is redirected to `/dashboard`.
- **AC-18**: Given a submit is in flight, When the request has not yet resolved,
  Then the submit button shows a loading state and is disabled.
- **AC-19**: Given an incorrect email or incorrect password, When the visitor
  submits, Then no session is issued and the visitor sees a single form-level
  error: "Incorrect email or password." (The message is identical for both cases
  to prevent account enumeration.)
- **AC-20**: Given the server is unreachable or returns an unexpected error, When
  the visitor submits, Then the visitor sees a form-level error: "Something went
  wrong. Please try again."
- **AC-21**: Given a visitor on the login form, When they look at the password
  field, Then there is a show/hide toggle that reveals or masks the field's value.
- **AC-22**: Given an authenticated user navigating to `/login`, When the page
  loads, Then they are immediately redirected to `/dashboard`.
- **AC-23**: Given a visitor who hits the rate limit on `/login`, When they
  submit, Then they see a form-level error: "Too many attempts. Please wait a few
  minutes and try again."

## 8. Behaviour — dashboard & logout (acceptance criteria)

- **AC-24**: Given an authenticated user on `/dashboard`, When the page renders,
  Then it displays the authenticated user's email address and a logout button.
- **AC-25**: Given an authenticated user on `/dashboard`, When they click logout,
  Then the session is cleared from client storage, client state is reset to
  unauthenticated, and the user is redirected to `/login`.
- **AC-26**: Given an unauthenticated user navigating to `/dashboard`, When the
  page loads, Then they are immediately redirected to `/login`.
- **AC-27**: Given a page refresh while authenticated, When the application
  boots, Then the session is rehydrated from client storage with no network call
  and the user remains authenticated.

## 9. Validation

### Registration — frontend

| Field | Rule | Trigger | Exact user-facing message |
|-------|------|---------|---------------------------|
| Email | Non-empty | on blur + on submit | "Email is required." |
| Email | Valid email format | on blur + on submit | "Enter a valid email address." |
| Password | 8–128 chars | on blur + on submit | "Password must be at least 8 characters." |
| Password | Contains a letter and a number | on blur + on submit | "Password must include a letter and a number." |
| Confirm | Equals password | on blur + on submit | "Passwords do not match." |
| (form) | Server rejected the submit | on response | message from the server's error envelope |

### Registration — backend

| Rule | Check | Response |
|------|-------|----------|
| Email present & valid format | re-validated server-side at the boundary | 400 with field error on `email` |
| Password present & meets rules | re-validated server-side at the boundary | 400 with field error on `password` |
| Email is unique (case-insensitive) | lookup before create | 409 with field error on `email` |
| Body shape | unknown/missing fields rejected at boundary | 400, never a 500 |
| Rate limit exceeded | 10 attempts / 15 min per client | 429, form-level error |

### Login — frontend

| Field | Rule | Trigger | Exact user-facing message |
|-------|------|---------|---------------------------|
| Email | Non-empty | on blur + on submit | "Email is required." |
| Password | Non-empty | on blur + on submit | "Password is required." |
| (form) | Server rejected the submit | on response | message from the server's error envelope |

### Login — backend

| Rule | Check | Response |
|------|-------|----------|
| Email present & valid format | validated at boundary | 400 with field error on `email` |
| Password present | validated at boundary | 400 with field error on `password` |
| Credentials correct | lookup + hash comparison | 401, generic form-level error (no field error) |
| Rate limit exceeded | 10 attempts / 15 min per client | 429, form-level error |

## 10. Errors

### Registration

| # | Failure mode | Status | Message | Where shown |
|---|--------------|--------|---------|-------------|
| ERR-1 | Email already registered | 409 | "An account with that email already exists." | field (email) |
| ERR-2 | Password fails rules (server) | 400 | "Password must be at least 8 characters and include a letter and a number." | field (password) |
| ERR-3 | Email malformed (server) | 400 | "Enter a valid email address." | field (email) |
| ERR-4 | Missing / malformed body | 400 | field-specific messages as above | field |
| ERR-5 | Server / network failure | 5xx or no response | "Something went wrong. Please try again." | form |
| ERR-6 | Rate limit exceeded | 429 | "Too many attempts. Please wait a few minutes and try again." | form |

### Login

| # | Failure mode | Status | Message | Where shown |
|---|--------------|--------|---------|-------------|
| ERR-7 | Wrong password or unknown email | 401 | "Incorrect email or password." | form |
| ERR-8 | Server / network failure | 5xx or no response | "Something went wrong. Please try again." | form |
| ERR-9 | Rate limit exceeded | 429 | "Too many attempts. Please wait a few minutes and try again." | form |

Security note: ERR-7 uses a single message for both wrong-password and
unknown-email cases to prevent account enumeration. This is a deliberate choice,
not an oversight. ERR-1 does disclose email existence — an accepted tradeoff for
this consumer signup flow where usability outweighs existence-hiding.

## 11. Non-functional

- **Password storage**: hashed with a slow, salted, industry-standard algorithm;
  never stored or logged in clear text (AC-10).
- **Rate limiting**: registration and login attempts are each rate-limited to
  10 per client per 15 minutes; 429 on breach with the message in §10.
- **Session storage**: the session token and user object are persisted in
  client storage under a namespaced key (`bloomcart_auth`); cleared on logout.
- **Accessibility**: every field has a programmatic label; errors are associated
  with their field and announced to assistive tech; show/hide toggles have
  accessible labels that reflect the current state ("Show password" /
  "Hide password"); the form is fully usable by keyboard with a sensible focus
  order; submit button disabled/loading state is conveyed non-visually.
- **Performance**: a registration or login submit resolves well within a couple
  of seconds under normal conditions; the UI never blocks the whole page while
  in flight.

## 12. Open questions

(none — all resolved during grilling sessions. Key decisions: 8–128 char
password with letter+number, case-insensitive email uniqueness, duplicate-email
disclosure accepted, no email verification in v1, generic login error for
enumeration prevention, in-memory store for demo, Prisma is documented next
step.)
