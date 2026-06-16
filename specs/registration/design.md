# Design — User registration & login (Bloomcart)

> UX spec for gate #2 sign-off. Describes every screen, state, and transition
> precisely enough that a developer needs no follow-up questions and a behavioral
> validator can verify the feature by running the app.
>
> Governed by the approved spec (`spec.md`) and the project constitution.
> Nothing here conflicts with either; where a choice was made it is noted.

---

## 0. Shared design language

### Palette (Tailwind tokens)

All three screens use the same small set of tokens. The worker may map these to
a specific shade once (e.g. `indigo-600` for the brand color); the mapping must
be consistent across screens.

| Role              | Tailwind description                        |
|-------------------|---------------------------------------------|
| Page background   | `bg-gray-50`                                |
| Card background   | `bg-white`                                  |
| Card shadow       | `shadow-md`                                 |
| Brand / primary   | a single indigo or blue shade (pick one)    |
| Danger / error    | `text-red-600`, `border-red-500`            |
| Muted text        | `text-gray-500`                             |
| Body text         | `text-gray-900`                             |
| Disabled state    | `opacity-50 cursor-not-allowed`             |

### Typography scale

- Page heading (h1): `text-2xl font-bold text-gray-900`
- Label: `text-sm font-medium text-gray-700`
- Input: `text-sm text-gray-900`
- Helper / error text: `text-sm`
- Link: `text-sm` with the brand color, underline on hover

### Card / form container

Every form sits inside a card:

```
max-w-md mx-auto mt-16 px-8 py-10 bg-white rounded-lg shadow-md
```

Centered horizontally, top-aligned with breathing room from the viewport top
(`mt-16`). On narrow viewports (`< 640 px`) the card may drop its rounded
corners and shadow and fill the full width with horizontal padding only.

### Focus ring

All interactive elements use the browser default focus ring or a Tailwind
`focus:ring-2 focus:ring-offset-2 focus:ring-<brand>` ring. Never suppress
outlines without a visible substitute.

### Error role

All rendered error messages — both field-level and form-level — carry
`role="alert"` so they are announced by screen readers when they appear.
This applies to every error message in every screen.

### Spacing rhythm

Stacked form fields use `space-y-5` between field groups (label + input + error
message treated as one unit). Section breaks (heading → form, form → link) use
`mt-6`.

---

## 1. Screen: `/register` — Registration form

### 1.1 Layout sketch

```
┌─────────────────────────────────────┐  <- max-w-md card, mt-16
│                                     │
│   Create your account               │  <- h1, text-2xl font-bold
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [form-level error banner]   │    │  <- appears only when form error
│  └─────────────────────────────┘    │
│                                     │
│   Email address              *      │  <- label (asterisk = visually required)
│  ┌─────────────────────────────┐    │
│  │                             │    │  <- input
│  └─────────────────────────────┘    │
│   [email field error]               │  <- hidden until triggered
│                                     │
│   Password                   *      │
│  ┌──────────────────────── [👁] ┐   │  <- input + toggle button
│  │                             │    │
│  └─────────────────────────────┘    │
│   [password field error]            │  <- hidden until triggered
│                                     │
│   Confirm password           *      │
│  ┌──────────────────────── [👁] ┐   │  <- input + toggle button
│  │                             │    │
│  └─────────────────────────────┘    │
│   [confirm-password field error]    │  <- hidden until triggered
│                                     │
│  ┌─────────────────────────────┐    │
│  │      Create account         │    │  <- submit button, full-width
│  └─────────────────────────────┘    │
│                                     │
│  Already have an account? Sign in   │  <- link centered, mt-6
│                                     │
└─────────────────────────────────────┘
```

### 1.2 Element anatomy

**Heading**
- Text: "Create your account"
- `text-2xl font-bold text-gray-900 mb-6`
- No logo or brand mark required at this scope.

**Form-level error banner**
- A `<div role="alert">` rendered directly below the heading and above the first
  field, hidden entirely when there is no form-level error.
- Appearance: `text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mb-4`
- Contains the raw message string (e.g. "Something went wrong. Please try
  again." or the rate-limit message).

**Email field**
- Label: `<label>` text "Email address", `text-sm font-medium text-gray-700`
- Input: `type="email"`, `autocomplete="email"`, `id="email"`, full-width,
  `rounded-md border border-gray-300 px-3 py-2 text-sm`. When an error is
  present the border becomes `border-red-500`.
- `aria-describedby` points at the error element's `id` when the error is shown.
- Error slot: `<p id="email-error" role="alert" class="mt-1 text-sm text-red-600">`,
  hidden (not rendered, or `hidden` attribute) when no error; rendered with the
  message when triggered.

**Password field**
- Label: `<label>` text "Password", same style as email label.
- Input: wrapped in a relative container for the toggle button.
  - `type="password"` initially (masked).
  - `autocomplete="new-password"`.
  - `id="password"`, full-width minus the toggle button width (`pr-10`).
  - Border turns `border-red-500` when error is present.
- Toggle button: an icon-only `<button type="button">` anchored to the right
  inside the input wrapper (`absolute right-0 inset-y-0 flex items-center pr-3`).
  - When password is hidden: renders an eye icon; `aria-label="Show password"`.
  - When password is shown: renders an eye-with-slash icon; `aria-label="Hide password"`.
  - Clicking toggles the input's `type` between `"password"` and `"text"`.
  - Does NOT affect the Confirm password field.
- Error slot: `<p id="password-error" role="alert" class="mt-1 text-sm text-red-600">`.

**Confirm password field**
- Label: `<label>` text "Confirm password".
- Input: identical structure to Password, but `id="confirm-password"`,
  `autocomplete="new-password"`, and its show/hide toggle is fully independent:
  toggling it only changes this field's type.
- Error slot: `<p id="confirm-error" role="alert" class="mt-1 text-sm text-red-600">`.

**Submit button**
- Text: "Create account" (idle/enabled) | "Creating account..." (loading)
- Full-width: `w-full`.
- Appearance: `bg-<brand> text-white font-medium py-2 px-4 rounded-md text-sm`
- Disabled: `opacity-50 cursor-not-allowed` added; `disabled` attribute set.
- Loading: spinner icon prepended to "Creating account..." text. The button
  remains `disabled`. No separate disabled styling change beyond what already
  applies — the loading spinner is the visual signal that something is in flight.
  The spinner is a simple CSS-animated SVG or a border-spin div; no additional
  library.

**Sign-in link**
- Text: "Already have an account? Sign in"
- Centered below the button: `text-center mt-6 text-sm text-gray-500`
- "Sign in" portion: `<Link to="/login">` styled with the brand color and
  `font-medium hover:underline`.

### 1.3 States

**Idle (initial render, AC-1)**
- All inputs empty.
- No error messages rendered.
- Submit button: disabled.

**Touched, valid field**
- Input border returns to `border-gray-300`.
- Error message for that field is removed (not rendered).

**Touched, invalid field (blur, AC-6, AC-7, AC-8)**
- Triggered after the user leaves a field (`onBlur`).
- The relevant field-error slot becomes visible with the exact message from spec
  §9 (see table below).
- Submit button state is unaffected by blur alone — it stays disabled until all
  fields are valid and equal.

**All fields valid (AC-2)**
- Email passes format check, password passes rules, confirm-password equals
  password.
- Submit button: enabled (no `disabled` attribute, no `opacity-50`).
- No error messages shown (assuming none were previously triggered, or they were
  corrected).

**Submitting (AC-4)**
- User clicked "Create account" with the form valid.
- All three inputs become `disabled`.
- Submit button: `disabled` + shows inline spinner + text "Creating account..."
- Each input shows a subtle visual loading state: `opacity-60 bg-gray-50` to
  signal that the form is locked. The spinner on the button is the primary
  in-flight signal.
- No errors shown; any previously visible errors are cleared on submit.

**Success (AC-3)**
- On `201` response from `POST /register`:
  - Auth slice stores `{ user, token }`.
  - `bloomcart_auth` written to `localStorage`.
  - Router navigates to `/dashboard` using `react-router-dom`'s `navigate()`.
  - The registration form unmounts. No flash, no intermediate screen.

**Server field error (AC-5, AC-6, AC-7 — server)**
- On `400` / `409` from the server with `fieldErrors`:
  - Submit button returns to enabled (the error is corrected by the user, so the
    form must remain re-submittable).
  - Inputs re-enabled.
  - The relevant field-error slot shows the `fieldErrors[fieldName]` message from
    the server envelope, rendered identically to a client-side field error.
  - Form-level error banner: not shown.

**Server form error (AC-9, AC-14, ERR-5, ERR-6)**
- On `5xx`, network failure, or `429`:
  - Form-level error banner appears with the message.
  - Submit button returns to enabled.
  - Inputs re-enabled.
  - All field values preserved (user can correct and retry).
  - No field-level errors added.

### 1.4 Field validation trigger rules (spec §9)

| Field            | Trigger       | Message shown                                         |
|------------------|---------------|-------------------------------------------------------|
| Email (empty)    | blur + submit | "Email is required."                                  |
| Email (format)   | blur + submit | "Enter a valid email address."                        |
| Password (short) | blur + submit | "Password must be at least 8 characters."             |
| Password (rules) | blur + submit | "Password must include a letter and a number."        |
| Confirm differs  | blur + submit | "Passwords do not match."                             |

Blur means `onBlur` fires after the user leaves the field. The message appears
immediately on blur if the field is invalid; it disappears as soon as the user
corrects the value (on `onChange`).

### 1.5 Authenticated redirect (AC-13)

When a logged-in user navigates to `/register`:
- The `<GuestRoute>` wrapper checks the auth Redux state synchronously.
- If `status === "authenticated"`: immediately renders `<Navigate to="/dashboard" replace />`.
- There is no loading flash — the check is synchronous from rehydrated state.

---

## 2. Screen: `/login` — Login form

### 2.1 Layout sketch

```
┌─────────────────────────────────────┐  <- same max-w-md card, mt-16
│                                     │
│   Sign in to your account           │  <- h1
│                                     │
│  ┌─────────────────────────────┐    │
│  │ [form-level error banner]   │    │  <- AC-19, AC-20, AC-23
│  └─────────────────────────────┘    │
│                                     │
│   Email address              *      │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│   [email field error]               │
│                                     │
│   Password                   *      │
│  ┌──────────────────────── [👁] ┐   │  <- single toggle
│  │                             │    │
│  └─────────────────────────────┘    │
│   [password field error]            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Sign in             │    │  <- submit, full-width
│  └─────────────────────────────┘    │
│                                     │
│  Don't have an account? Sign up     │  <- link, centered, mt-6
│                                     │
└─────────────────────────────────────┘
```

### 2.2 Element anatomy

Differences from the registration form are noted; identical elements are not
repeated.

**Heading**
- Text: "Sign in to your account"

**Form-level error banner**
- Same appearance as on `/register`.
- Used for all three login error cases: wrong credentials (ERR-7), server/network
  error (ERR-8), and rate limit (ERR-9).

**Email field**
- `autocomplete="email"`.
- Same blur-triggered validation: non-empty check only for fast feedback, format
  check also on blur and submit (per spec §9 login validation table).

**Password field**
- `autocomplete="current-password"`.
- One show/hide toggle. Identical appearance and behavior to the password field
  on `/register`.
- No rule validation client-side — only non-empty check (per spec §5 login).
- Error slot shows "Password is required." if submitted empty.

**Submit button**
- Text: "Sign in" (idle/enabled) | "Signing in..." (loading)
- Disabled until both email and password are non-empty (AC-16).
- Loading spinner same as registration form.

**Sign-up link**
- Text: "Don't have an account? Sign up"
- `text-center mt-6 text-sm text-gray-500`
- "Sign up" portion: `<Link to="/register">` with brand color, `font-medium hover:underline`.

### 2.3 States

**Idle (AC-15)**
- Both inputs empty, no error messages, submit button disabled.

**Both fields non-empty (AC-16)**
- Submit button enabled.
- On change: re-evaluate emptiness of both fields; enable/disable submit accordingly.

**Submitting (AC-18)**
- Both inputs disabled with `opacity-60 bg-gray-50`.
- Submit button: disabled + inline spinner + "Signing in..."

**Success (AC-17)**
- On `200` from `POST /login`:
  - Auth slice stores `{ user, token }`.
  - `bloomcart_auth` written to `localStorage`.
  - Router navigates to `/dashboard`. No flash.

**Wrong credentials (AC-19, ERR-7)**
- On `401` from server:
  - Form-level error banner: "Incorrect email or password."
  - No field-level errors.
  - Submit button re-enabled.
  - Inputs re-enabled. Email field value preserved; **password field is cleared**
    so the user types fresh credentials on retry.

**Server / network error (AC-20, ERR-8)**
- Form-level error banner: "Something went wrong. Please try again."
- Submit re-enabled, inputs re-enabled, values preserved.

**Rate limit (AC-23, ERR-9)**
- Form-level error banner: "Too many attempts. Please wait a few minutes and try again."
- Submit re-enabled, inputs re-enabled.

### 2.4 Field validation trigger rules

| Field            | Trigger       | Message shown             |
|------------------|---------------|---------------------------|
| Email (empty)    | blur + submit | "Email is required."      |
| Email (format)   | blur + submit | "Enter a valid email address." |
| Password (empty) | blur + submit | "Password is required."   |

Note: on the login form the format check is client-side only for fast feedback;
the server re-validates at its boundary.

### 2.5 Authenticated redirect (AC-22)

Identical mechanism to `/register`: `<GuestRoute>` checks auth state
synchronously and immediately renders `<Navigate to="/dashboard" replace />` for
authenticated users. No flash.

---

## 3. Screen: `/dashboard` — Authenticated view

### 3.1 Layout sketch

```
┌─────────────────────────────────────┐  <- max-w-md card, mt-16
│                                     │
│   Welcome back!                     │  <- h1
│   Signed in as user@example.com     │  <- p, muted
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Log out             │    │  <- button, full-width
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

The dashboard is intentionally minimal (spec §8). A single centered card shows
the user's email and a logout button — no navbar. Same `max-w-md` card container
as the auth forms for visual consistency.

### 3.2 Element anatomy

**Card**
- Same container as auth forms: `max-w-md mx-auto mt-16 px-8 py-10 bg-white rounded-lg shadow-md`

**Heading**
- Text: "Welcome back!"
- `text-2xl font-bold text-gray-900 mb-2`

**Email sub-line**
- Text: "Signed in as <email>" where `<email>` is `user.email` from Redux state.
- `text-sm text-gray-500 mb-6`

**Logout button**
- Text: "Log out"
- Full-width, same visual weight as the submit buttons on the auth forms:
  `w-full bg-<brand> text-white font-medium py-2 px-4 rounded-md text-sm`
- No disabled state (logout is always immediately available).
- No loading state — logout is a synchronous local operation (no API call).

### 3.3 States

**Authenticated, loaded (AC-24)**
- Email rendered in the navbar and in the content card.
- Logout button visible and active.
- No loading state — the email comes from Redux state (synchronously available
  after rehydration or after login redirect).

**No loading state for the dashboard itself.** Because session data is always
available synchronously (either from rehydration on boot or from the login
redirect), the dashboard never needs a spinner. It either renders with auth data
or redirects.

### 3.4 Unauthenticated redirect (AC-26)

- `<ProtectedRoute>` wraps `/dashboard`.
- If auth state is `"unauthenticated"`: immediately renders
  `<Navigate to="/login" replace />`.
- Synchronous — no flash. The redirect happens before the Dashboard component
  renders any content.

### 3.5 Logout flow (AC-25)

The sequence from the user's perspective:

1. User clicks "Log out".
2. The `logout` Redux action is dispatched synchronously:
   a. Auth slice clears `user`, `token`, sets status to `"unauthenticated"`.
   b. `bloomcart_auth` is removed from `localStorage`.
3. The component (or a side effect in the slice or the component) calls
   `navigate("/login", { replace: true })`.
4. The user is now on `/login`. The page is immediately available with the login
   form in its idle state. No spinner, no intermediate screen.

There is no confirmation dialog. The logout is immediate.

---

## 4. Cross-cutting concerns

### 4.1 Session rehydration (AC-27)

On any page refresh while authenticated:

1. `main.tsx` runs before React renders.
2. It reads `localStorage.getItem("bloomcart_auth")` and parses the JSON.
3. If a valid object `{ user, token }` is found, it passes it as `preloadedState`
   to `makeStore`, seeding the auth slice with `status: "authenticated"`.
4. The Redux `<Provider>` wraps the entire app with this store.
5. React renders. Route guards (`<ProtectedRoute>`, `<GuestRoute>`) read the
   already-populated auth state synchronously.
6. The user sees their intended page immediately — no redirect flicker, no
   loading screen, no network call at boot.

If the JSON is malformed or the key is absent, `makeStore` receives no
`preloadedState` and starts unauthenticated.

### 4.2 Route guard behaviour summary

| Route        | Auth state        | Result                            |
|--------------|-------------------|-----------------------------------|
| `/register`  | unauthenticated   | Shows registration form           |
| `/register`  | authenticated     | `<Navigate to="/dashboard" replace />` immediately |
| `/login`     | unauthenticated   | Shows login form                  |
| `/login`     | authenticated     | `<Navigate to="/dashboard" replace />` immediately |
| `/dashboard` | authenticated     | Shows dashboard                   |
| `/dashboard` | unauthenticated   | `<Navigate to="/login" replace />` immediately |

"Immediately" means synchronously, before any content renders. There is no
loading spinner, no flash of the wrong screen.

### 4.3 Keyboard and focus order

- Tab order within each form follows the visual top-to-bottom, left-to-right
  order: heading (not focusable) → first input → its toggle (if any) → next
  input → next toggle → submit → sign-in/sign-up link.
- Show/hide toggle buttons are in the natural tab flow (they are `<button>`
  elements, not `<span>` with click handlers).
- On form submit failure that renders a form-level error banner, focus moves to
  the banner element (`ref.current.focus()`) so keyboard and screen-reader users
  are informed without manual tabbing.
- On field-level error (blur), no focus movement — the error appears under the
  field the user just left, which is standard and expected.

### 4.4 Password show/hide toggle — detailed behaviour

Both forms use the same `<PasswordInput>` component. Key invariants:

- Each field has its own toggle state (boolean), independent of the other.
- Default: masked (`type="password"`).
- Toggle click: flips to `type="text"` (revealed) or back to `type="password"`.
- Toggle aria-label: "Show password" when masked; "Hide password" when revealed.
- The toggle is `type="button"` to prevent form submission on click.
- The toggle is inside the input's visual border, anchored to the right edge.
- Icon: an eye SVG when masked, an eye-with-slash SVG when revealed.
  (Exact SVG sourced from Heroicons or similar; no icon library dependency
  required — inline SVGs are fine.)
- Toggling does not move focus.
- Toggling does not clear or alter the field value.

### 4.5 `<PasswordInput>` component props (for the developer)

The shared component encapsulates the toggle. Its public interface:

```
id:             string          // for label association and aria-describedby
label:          string          // rendered <label> text
value:          string          // controlled value
onChange:       (e) => void
onBlur:         () => void
error?:         string          // if provided, renders error slot and sets border-red-500
autocomplete?:  string          // e.g. "new-password" or "current-password"
disabled?:      boolean         // set to true while form is submitting
```

This interface is a design decision, not an implementation prescription — the
worker may adjust it to match the Redux-controlled form pattern, but the
behaviour described in §4.4 must be preserved.

---

## 5. Error message reference (exact strings)

This table is the single source of truth for copy. No variation is permitted.

| Location          | Trigger                              | Exact message |
|-------------------|--------------------------------------|---------------|
| Email field       | empty on blur/submit (both forms)    | "Email is required." |
| Email field       | invalid format on blur/submit        | "Enter a valid email address." |
| Email field       | server 409 (registration only)       | "An account with that email already exists." |
| Password field    | < 8 chars on blur/submit (reg)       | "Password must be at least 8 characters." |
| Password field    | no letter+number on blur/submit (reg)| "Password must include a letter and a number." |
| Password field    | empty on blur/submit (login)         | "Password is required." |
| Confirm field     | differs from password on blur/submit | "Passwords do not match." |
| Form banner (reg) | server 5xx / network error           | "Something went wrong. Please try again." |
| Form banner (reg) | server 429                           | "Too many attempts. Please wait a few minutes and try again." |
| Form banner (login)| server 401                          | "Incorrect email or password." |
| Form banner (login)| server 5xx / network error          | "Something went wrong. Please try again." |
| Form banner (login)| server 429                          | "Too many attempts. Please wait a few minutes and try again." |

---

## 6. Gate #2 decisions (resolved)

All items resolved by the human at gate #2 sign-off:

| Q | Decision |
|---|----------|
| Q1 — Dashboard layout | **Single centered card** (no navbar). Same `max-w-md` container as auth forms. |
| Q2 — Login password on 401 | **Clear** the password field on wrong-credentials error. Email preserved. |
| Q3 — Inputs while submitting | **Disable all inputs** + show inline spinner on the submit button during every API call. |

No open questions remain. Design is approved. Implementation may begin.
