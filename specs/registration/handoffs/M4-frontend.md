# Worker handoff — registration / M4 / frontend

> Filled out by the worker subagent at the end of a milestone. This artifact —
> not a verbal "done" — is what the orchestrator and validators trust. Be honest;
> a documented failure is more valuable than an optimistic summary.

## 1. Scope of this milestone

- Repo: `frontend`
- Plan tasks covered: M4 — react-router-dom wiring, route tree, ProtectedRoute, GuestRoute, main.tsx with preloadedState rehydration, localStorage persistence in makeStore.
- Acceptance criteria targeted: AC-13, AC-22, AC-26, AC-27

---

## 2. Completed

| AC / item | What was done | File(s) |
|-----------|---------------|---------|
| AC-13 | GuestRoute redirects authenticated users navigating to /register to /dashboard synchronously | `src/components/GuestRoute.tsx`, `src/components/GuestRoute.test.tsx` |
| AC-22 | GuestRoute redirects authenticated users navigating to /login to /dashboard synchronously | `src/components/GuestRoute.tsx`, `src/components/GuestRoute.test.tsx` |
| AC-26 | ProtectedRoute redirects unauthenticated users navigating to /dashboard to /login synchronously | `src/components/ProtectedRoute.tsx`, `src/components/ProtectedRoute.test.tsx` |
| AC-27 | Session rehydration: main.tsx reads bloomcart_auth from localStorage, parses it safely, and passes preloadedState to makeStore so Redux starts authenticated with no network call | `src/main.tsx`, `src/store/index.ts`, `src/store/index.test.ts` |
| localStorage subscriber | makeStore now subscribes to store changes and writes `{ user, token }` to `bloomcart_auth` in localStorage when authenticated; removes the key when logged out | `src/store/index.ts` |
| Route tree | App.tsx wires /register, /login, /dashboard with guards; / and * redirect to /register | `src/App.tsx` |
| Login/Dashboard placeholders | /login and /dashboard compile with inline placeholder divs so M5 can drop in real components | `src/App.tsx` |
| TextEncoder polyfill | Added Node util TextEncoder/TextDecoder to test setup because react-router-dom v7 requires them in jsdom | `src/test/setup.ts` |

---

## 3. Left undone / out of scope (and why)

- **LoginForm component** — not built per task constraints. A placeholder `<div>Login coming in M5</div>` is rendered at `/login`. M5 must replace it.
- **Dashboard component** — not built per task constraints. A placeholder `<div>Dashboard coming in M5</div>` is rendered at `/dashboard`. M5 must replace it.
- **`@types/react-router-dom`** — not installed. react-router-dom v7 ships its own bundled TypeScript declarations; a separate `@types` package is not needed and does not exist for v7.
- **`logout` reducer in authSlice** — not added in M4. The plan says M5 modifies authSlice to add the `logout` reducer (the Dashboard component dispatches it). M4 does not touch authSlice.

---

## 4. Commands run + exit codes

| Command | Exit code | Notes |
|---------|-----------|-------|
| `npm install react-router-dom` | 0 | Installed v7.18.0 (not v6 as plan assumed; see Issues section) |
| `npx tsc --noEmit` (initial, after all files written) | 0 | Clean |
| `npx eslint .` (initial) | 0 | Clean |
| `npx jest` (first run) | 1 | GuestRoute.test.tsx and ProtectedRoute.test.tsx failed: `ReferenceError: TextEncoder is not defined` — react-router-dom v7 requires Web Encoding API |
| Added TextEncoder/TextDecoder polyfill to `src/test/setup.ts` | — | Fix |
| `npx jest` (second run) | 0 | 26 tests passed / 26 total, 6 suites |
| `npx tsc --noEmit` (final) | 0 | Clean |
| `npx eslint .` (final) | 0 | Clean |
| `git add ... && git commit -m "feat(routing): M4 ..."` | 0 | Commit sha `16860a8`; 11 files changed, 513 insertions |

---

## 5. Issues / surprises discovered

### react-router-dom v7 instead of v6

The plan references "react-router-dom" without pinning a version. `npm install react-router-dom` installed **v7.18.0** (the latest stable). The plan was written with v6 in mind (it mentions `@types/react-router-dom` which does not exist for v7, and v7's new bundled routing system ships its own types).

**Impact on M4:** Functionally equivalent. `BrowserRouter`, `Routes`, `Route`, `Navigate`, `MemoryRouter`, `Outlet`, `useNavigate` all exist in v7 with the same API as v6. The `GuestRoute` and `ProtectedRoute` implementations use `children` props rather than `<Outlet />` — either works in v6 and v7.

**Impact discovered:** v7's internal code uses `TextEncoder` which jsdom does not polyfill. Fixed by adding Node's `util.TextEncoder` to `src/test/setup.ts`. This is a legitimate fix, not a workaround — jsdom intentionally omits some Web APIs and projects are expected to polyfill them in setup.

**Flag for orchestrator:** If v6 was a hard requirement (e.g., another milestone pins it), the orchestrator should pin the version in `package.json`. No API contract changes are needed.

### `@types/react-router-dom` not needed

The plan says "Check first whether `@types/react-router-dom` is needed — react-router-dom v6+ ships its own types." Confirmed: v7 ships `dist/index.d.ts`. The separate types package was not installed.

### No `gate.sh` hook found

The CONSTITUTION mentions a `gate.sh` PreToolUse hook that blocks commits if typecheck or tests fail. No such hook was found in the frontend repo's `.git/hooks/` directory or project root. The gate was satisfied manually by running `tsc --noEmit`, `eslint .`, and `jest` before committing and confirming all pass.

### RegistrationForm authenticated-redirect behavior

The existing `RegistrationForm.tsx` has its own `if (status === 'authenticated') return <div>You're signed in...</div>` check. Now that M4 wraps the form in `GuestRoute`, an authenticated user will be redirected before the form mounts, so that branch in RegistrationForm will never fire in production routing. It remains harmless and was not removed (task constraint: do not modify RegistrationForm.tsx).

---

## 6. What M5 must do to replace the placeholders

M5 must create or modify the following files to replace M4's placeholder divs:

| Component | Expected file path | Replaces |
|-----------|-------------------|---------|
| `LoginForm` | `src/components/LoginForm.tsx` | The inline `LoginFormPlaceholder` const in `src/App.tsx` |
| `Dashboard` | `src/components/Dashboard.tsx` | The inline `DashboardPlaceholder` const in `src/App.tsx` |

In `src/App.tsx`, M5 should:
1. Import `LoginForm` from `./components/LoginForm`.
2. Import `Dashboard` from `./components/Dashboard`.
3. Replace `<LoginFormPlaceholder />` with `<LoginForm />`.
4. Replace `<DashboardPlaceholder />` with `<Dashboard />`.
5. Delete the two placeholder const declarations.

M5 must also add the `logout` reducer to `src/store/slices/auth/authSlice.ts` (plan §2 "modify authSlice"). The logout reducer must clear `user`, `token`, set `status` to `'unauthenticated'` (or `'idle'`), and either call `localStorage.removeItem('bloomcart_auth')` directly or rely on the makeStore subscriber — the subscriber already handles removal when `user/token` are null, so no direct localStorage call is needed in the reducer.

---

## 7. Procedure adherence

- [x] Built only my slice, in one repo (frontend only; no backend changes)
- [x] Built to the API contract exactly (no changes needed; M4 is routing/persistence, not API calls)
- [x] A real test exists for every AC and error state in my slice (AC-13, AC-22, AC-26, AC-27 all have named tests)
- [x] Honoured every constraint in the task: no LoginForm/Dashboard built, no RegistrationForm modified, bloomcart_auth key used exactly, localStorage wrapped in try/catch, no `any` without reason comment, route guards read Redux state (not localStorage directly)
- [x] Committed through the gate after all three checks (tsc, eslint, jest) passed
- Deviations: react-router-dom v7 installed (v6 assumed in plan but not pinned); `@types/react-router-dom` not installed (not needed for v7); TextEncoder polyfill added to test setup (required by v7 in jsdom environment).
