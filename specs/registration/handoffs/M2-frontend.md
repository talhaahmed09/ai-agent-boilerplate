# Worker handoff — registration / M2 / frontend

## 1. Scope of this milestone
- Repo: `frontend`
- Plan tasks covered: M2 — store factory, auth slice, register thunk, selectors,
  injected auth service, shared error unpacker.
- Acceptance criteria targeted: AC-3, AC-5, AC-9 (state layer); enables AC-2/4/6.

## 2. Completed
| AC / item | What was done | File(s) |
|-----------|---------------|---------|
| AC-3 | `registerThunk` success -> `authenticated`, stores user+token | `store/thunks/auth/registerThunk.ts`, `store/slices/auth/authSlice.ts` |
| AC-5 | Rejected with `fieldErrors` -> stored as field errors, no form error | `authSlice.ts`, `lib/extractThunkError.ts` |
| AC-9 / ERR-5 | Rejected with only `message` -> single form-level error | `authSlice.ts`, `services/authService.ts` |
| infra | `makeStore({services})` factory injects a fake service via `extra` | `store/index.ts` |

## 3. Left undone / out of scope (and why)
- The form component itself is M3 (kept as a separate small-diff milestone).

## 4. Commands run + exit codes
| Command | Exit code | Notes |
|---------|-----------|-------|
| `npm install` | 0 | clean reinstall after a partial-install dependency skew |
| `npx tsc --noEmit` | 0 | strict clean |
| `npx eslint .` | 0 | no errors |
| `npx jest` | 0 | slice/thunk/selector suite green |

## 5. Issues / surprises discovered
- A partial `npm install` (interrupted) left an `es-abstract` version skew that
  broke `eslint-plugin-react`. Resolved by a clean reinstall. Flagged so CI pins a
  lockfile rather than relying on partial caches.

## 6. Procedure adherence
- [x] Built only my slice, in one repo
- [x] Built to the API contract exactly (error shape mirrors backend envelope)
- [x] A real test exists for every AC in my slice (real store + fake injected service)
- [x] Honoured mission-state constraints (C2 hashing is backend-only; n/a here)
- [x] Committed through the gate
- Deviations: none
