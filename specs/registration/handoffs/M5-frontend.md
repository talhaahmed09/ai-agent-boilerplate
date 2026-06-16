# Worker handoff — registration / M5 / frontend

> Filled out by the worker subagent at the end of a milestone. This artifact —
> not a verbal "done" — is what the orchestrator and validators trust. Be honest;
> a documented failure is more valuable than an optimistic summary.

## 1. Scope of this milestone

- Repo: `frontend`
- Plan tasks covered: M5 — PasswordInput component, LoginForm, Dashboard, loginThunk, authService.login, authSlice loginThunk cases + logout reducer, RegistrationForm updated with PasswordInput and sign-in link, App.tsx placeholder replacement.
- Acceptance criteria targeted: AC-11, AC-12, AC-15, AC-16, AC-18, AC-19, AC-20, AC-21, AC-23, AC-24, AC-25

---

## 2. Completed

| AC / item | What was done | File(s) |
|-----------|---------------|---------|
| AC-11 | `PasswordInput` with independent show/hide toggle per instance; each instance has its own `useState(false)`; toggling one does not affect siblings | `src/components/PasswordInput.tsx`, `src/components/PasswordInput.test.tsx` |
| AC-12 | "Already have an account? Sign in" link (`<Link to="/login">`) added to bottom of RegistrationForm | `src/components/RegistrationForm.tsx`, `src/components/RegistrationForm.test.tsx` |
| AC-15 | `LoginForm` renders with submit disabled when fields empty; no error messages shown | `src/components/LoginForm.tsx`, `src/components/LoginForm.test.tsx` |
| AC-16 | Submit enabled only when both email and password are non-empty | `src/components/LoginForm.tsx`, `src/components/LoginForm.test.tsx` |
| AC-18 | Loading state during submit: button shows spinner + "Signing in...", `aria-busy=true`, button disabled, inputs disabled | `src/components/LoginForm.tsx`, `src/components/LoginForm.test.tsx` |
| AC-19 | 401 → form-level error "Incorrect email or password.", password field cleared, email preserved, no field-level errors | `src/components/LoginForm.tsx`, `src/services/authService.ts`, `src/components/LoginForm.test.tsx` |
| AC-20 | Network/server error → form-level error "Something went wrong. Please try again." | `src/components/LoginForm.tsx`, `src/services/authService.ts`, `src/components/LoginForm.test.tsx` |
| AC-21 | Password show/hide toggle present on login form and functional | `src/components/LoginForm.tsx`, `src/components/LoginForm.test.tsx` |
| AC-23 (service) | 429 from `/login` → "Too many attempts. Please wait a few minutes and try again." (service maps it; form renders it as form-level error) | `src/services/authService.ts` |
| AC-24 | Dashboard shows authenticated user's email and a "Log out" button | `src/components/Dashboard.tsx`, `src/components/Dashboard.test.tsx` |
| AC-25 | Clicking "Log out" dispatches `logout` action (resets Redux state to initialState) then navigates to `/login` | `src/components/Dashboard.tsx`, `src/store/slices/auth/authSlice.ts`, `src/components/Dashboard.test.tsx` |
| loginThunk | `createAsyncThunk('auth/login', ...)` mirroring registerThunk; rejects with form-level error only | `src/store/thunks/auth/loginThunk.ts` |
| authService.login | `POST /login`; maps 200→RegisterResponse, 401→AuthApiError("Incorrect email or password."), 429→AuthApiError("Too many attempts..."), other non-2xx→envelope message, network→generic | `src/services/authService.ts` |
| authSlice loginThunk cases | `loginThunk.pending` sets submitting; `loginThunk.fulfilled` sets authenticated; `loginThunk.rejected` sets form-level error, always clears fieldErrors | `src/store/slices/auth/authSlice.ts` |
| logout reducer | `logout()` returns `initialState`; makeStore subscriber removes `bloomcart_auth` from localStorage when user/token become null (AC-25) | `src/store/slices/auth/authSlice.ts` |
| RegistrationForm PasswordInput | Replaced raw `<input type="password">` elements with `<PasswordInput>` for password and confirm fields | `src/components/RegistrationForm.tsx` |
| App.tsx placeholder replacement | Removed `LoginFormPlaceholder` and `DashboardPlaceholder` const declarations; imported and used `LoginForm` and `Dashboard` | `src/App.tsx` |
| authSlice.test.ts | Added tests for loginThunk.pending, loginThunk.fulfilled, loginThunk.rejected, and logout | `src/store/slices/auth/authSlice.test.ts` |

---

## 3. Left undone / out of scope (and why)

- **No files from previous milestones were modified beyond what the task explicitly required.** Specifically: `registerThunk.ts`, `validation.ts`, `extractThunkError.ts`, `GuestRoute.tsx`, `ProtectedRoute.tsx` were not touched.
- **AC-17 (successful login redirects to /dashboard)**: The form dispatches `loginThunk` and the `<ProtectedRoute>` / `<GuestRoute>` handles navigation once `status === 'authenticated'` — the redirect logic is already in place from M4. The LoginForm component does not navigate manually per the task constraints ("After successful login the `<ProtectedRoute>` / redirect handles navigation — do not navigate manually inside the form"). No additional code was needed.
- **AC-22 (authenticated user on /login redirects to /dashboard)**: Already handled by M4's `GuestRoute`. No change in M5.
- **AC-26 (unauthenticated user on /dashboard redirects to /login)**: Already handled by M4's `ProtectedRoute`. No change in M5.
- **AC-27 (session rehydration)**: Already fully implemented by M4. No change in M5.
- **Backend files**: Not touched. M5 is frontend only.

---

## 4. Commands run + exit codes

| Command | Exit code | Notes |
|---------|-----------|-------|
| `npx tsc --noEmit` (first run after all files written) | 2 | 4 errors: `toggles[0]` array index possibly `undefined` in PasswordInput.test.tsx and RegistrationForm.test.tsx; `login` missing from authService partial in index.test.ts and (implicitly) authSlice.test.ts |
| Fixed: added `!` non-null assertions with `// reason:` comments on array index accesses | — | — |
| Fixed: added `login: () => Promise.reject(...)` stubs to `index.test.ts` | — | — |
| Fixed: rewrote `authSlice.test.ts` helper to provide both `register` and `login` | — | — |
| `npx tsc --noEmit` (second run) | 0 | Clean |
| `npx eslint .` (first run) | 0 | Clean on first run |
| `npx jest` (first run) | 1 | 55/56 passed; 1 failure: AC-19 test found two `role="alert"` elements — after 401, password was cleared but `passwordTouched` remained `true`, causing "Password is required." to render alongside the form banner |
| Fixed: `LoginForm.tsx` — reset `passwordTouched` to `false` when clearing password on 401 | — | — |
| `npx jest` (second run) | 0 | 56/56 tests passed, 9 suites |
| `npx tsc --noEmit` (final) | 0 | Clean |
| `npx eslint .` (final) | 0 | Clean |
| `git add <14 files> && git commit -m "feat(auth): M5 ..."` | 0 | Commit sha `fd62453`; 14 files changed, 928 insertions(+), 75 deletions(-) |

---

## 5. Issues / surprises discovered

### authService.ts `AuthService` interface vs partial test injection

Adding `login` to `AuthService` made any test that passes only `{ register }` as the service fail TypeScript. This affected:
- `src/store/index.test.ts` (M4 test): had to add `login: () => Promise.reject(...)` stub.
- `src/store/slices/auth/authSlice.test.ts` (M2 test): rewrote helper to take `Partial<AuthService>` and provide both methods.
- `src/components/RegistrationForm.test.tsx` (M2 test): added `stubLogin` constant and passed it alongside `register`.

This is expected — adding a required method to an interface requires all implementors and test stubs to provide it. No API contract issue; the `makeStore` function itself accepts `Partial<Services>` but `AuthService` within it must be complete. An alternative approach would be making `login` optional in the interface, but the spec and contract require it on the concrete service.

**Flag**: If M6+ workers need to add more methods to `AuthService`, they will need to update test stubs in the same pattern. Consider documenting this in the test helper pattern.

### 401 password clear and touched state interaction

When `onSubmit` fires, `passwordTouched` is set to `true`. After a 401 response, the password state is cleared synchronously via `useEffect`. Because `passwordTouched === true` and `password === ''`, the field error "Password is required." rendered alongside the form banner. Fixed by also resetting `passwordTouched` to `false` in the 401 clear effect. This matches design §2.3 intent: only the form-level banner is shown, no field errors on 401.

### No `gate.sh` hook (same as M4)

As noted in M4's handoff, no `gate.sh` hook exists in `.git/hooks/`. Gate was satisfied manually by running all three checks before committing and confirming all pass.

### `makeStore`'s `services` spread behavior

`makeStore` spreads `overrides?.services` at the top level (`{ ...defaultServices, ...overrides?.services }`). If you pass `{ authService: { register } }` it fully replaces `defaultServices.authService`, not merges within it. Tests must therefore always pass a complete `AuthService` object. This is consistent with the existing pattern, just worth noting.

---

## 6. What the behavioral/scrutiny validators should check

1. **PasswordInput independence**: Two `PasswordInput` instances on the same form — toggling one must not affect the other. The `id` prop scopes the visibility state to each React instance.
2. **401 password clear**: On a wrong-credentials response, the password field must be empty after the state update, and no field-level "Password is required." error should appear (only the form banner).
3. **Login errors are always form-level**: No login response should ever cause field-level errors (fieldErrors is always `{}` in `loginThunk.rejected`).
4. **Logout localStorage**: After `logout()` is dispatched, the makeStore subscriber must remove `bloomcart_auth` from localStorage (because `user` and `token` become `null`). The logout reducer returns `initialState`, which has `user: null, token: null`.
5. **RegistrationForm sign-in link**: The form must render a `<Link to="/login">` that reads "Sign in" — requires `MemoryRouter` or `BrowserRouter` in the test environment.
6. **App.tsx placeholders removed**: `/login` must render `LoginForm`, not "Login coming in M5". `/dashboard` must render `Dashboard`, not "Dashboard coming in M5".
7. **tsc/eslint/jest**: All three must pass clean. Confirmed at commit `fd62453`.

---

## 7. Procedure adherence

- [x] Built only M5 slice, in one repo (frontend only; no backend files touched)
- [x] Built to the API contract exactly (no API contract changes needed or made)
- [x] A real test exists for every AC and error state in my slice — every new test is named with its AC ID
- [x] Honoured every constraint: no `any` without `// reason:`, `PasswordInput` toggle is `type="button"`, login errors are always form-level, password cleared on 401, `useNavigate` used in Dashboard, new tests wrapped in `MemoryRouter`
- [x] Did not modify `registerThunk.ts`, `validation.ts`, `extractThunkError.ts`, `GuestRoute.tsx`, or `ProtectedRoute.tsx`
- [x] Committed through gate after all three checks (tsc 0, eslint 0, jest 0) passed
- Deviations: none from the M5 task constraints. `index.test.ts` and `authSlice.test.ts` (M4/M2 files) were minimally updated to add `login` stubs required by the expanded `AuthService` interface — this was unavoidable and does not change their test coverage.
