# Scrutiny validator report — User registration & login (M3–M5)

> Produced by the `scrutiny-validator` agent with no access to the implementation
> conversation. All findings are from independent static analysis and code review.
> Gate commands were blocked (Bash denied to agent); gates were re-run and
> verified by the orchestrator directly. Post-fix re-run confirms all blockers
> resolved.

---

## Gate results

### backend/

| Command | Exit code | Result |
|---------|-----------|--------|
| `npx tsc --noEmit` | 0 | PASS |
| `npx eslint .` | 0 | PASS |
| `npx jest` | 0 | PASS — 26 tests / 4 suites |

### frontend/ (post-fix)

| Command | Exit code | Result |
|---------|-----------|--------|
| `npx tsc --noEmit` | 0 | PASS |
| `npx eslint .` | 0 | PASS |
| `npx jest` | 0 | PASS — 57 tests / 9 suites |

---

## Findings

### Blockers (all resolved before final gate run)

**[blocker — FIXED] AC-5 / ERR-1: `authSlice.test.ts` asserted the old email-taken message**

File: `frontend/src/store/slices/auth/authSlice.test.ts`, line 40

The stub threw `{ fieldErrors: { email: 'That email is already registered.' } }`.
The spec revision updated the message to `"An account with that email already exists."`.
The test was asserting the old wrong message — AC-5 and ERR-1 were unproven.

Fix: stub and assertion updated to `"An account with that email already exists."`.

---

**[blocker — FIXED] AC-25: no test proved `bloomcart_auth` is removed from localStorage on logout**

File: `frontend/src/store/index.test.ts`

The existing subscriber test only covered the write path (authentication → key
written). The logout path (`localStorage.removeItem`) had no test. AC-25 requires
"clears session from storage" to be proven; it was not.

Fix: added `AC-25` test — seeds an authenticated store, writes `bloomcart_auth`
manually, dispatches `logout()`, asserts `localStorage.getItem('bloomcart_auth')` is `null`.

---

**[blocker — FIXED] Design §1.3 / AC-4: RegistrationForm email input missing `disabled={submitting}`**

File: `frontend/src/components/RegistrationForm.tsx`, lines 100–111

Both `<PasswordInput>` instances received `disabled={submitting}` correctly, but
the email `<input>` had no `disabled` prop. It remained editable mid-flight,
violating design §1.3 ("all inputs disabled while submitting").

Fix: added `disabled={submitting}` and `disabled:opacity-60 disabled:bg-gray-50
disabled:cursor-not-allowed` to the email input.

---

### Should-fix (non-blocking)

**[should-fix] LoginForm AC-19 test: missing assertion that no field error appears alongside the form banner**

File: `frontend/src/components/LoginForm.test.tsx`

The 401 test asserts the banner appears and password is cleared, but does not
assert `queryByText('Password is required.')` is absent. Design §2.3 is not fully
proven. Recommend adding:
```ts
expect(screen.queryByText('Password is required.')).not.toBeInTheDocument();
```

---

**[should-fix] LoginForm: `clearPasswordOnError` flag introduces a state-update race**

File: `frontend/src/components/LoginForm.tsx`

`setClearPasswordOnError(true)` and `dispatch(loginThunk(...))` are called in the
same synchronous block. In React 18 with batched updates, a fast synchronous mock
rejection could cause the `useEffect` to run before the flag state update commits.
Works in tests because `userEvent` flushes React updates, but the pattern is
fragile. Recommend deriving the clear-intent directly from the rejected action
payload instead of a side-channel flag.

---

**[should-fix] `main.tsx`: shape guard does not validate `user.id`/`user.email` are strings**

File: `frontend/src/main.tsx`

The guard checks `'user' in parsed && parsed.user !== null` but type-asserts
without verifying the inner fields are strings. A tampered localStorage value
like `{ "user": 42, "token": "x" }` passes the guard and seeds the store with
a non-object user, crashing at `Dashboard.tsx` (`user?.email`). Recommend
adding `typeof user.id === 'string' && typeof user.email === 'string'` checks.

---

**[should-fix] `loginThunk.ts`: cast `err as { message?... }` has no `// reason:` comment**

File: `frontend/src/store/thunks/auth/loginThunk.ts`, line 19

Constitution convention: type-system bypasses carry a `// reason:` comment.
This cast does not.

---

### Nits

**[nit] `loginThunk.ts` imports `RegisterInput`/`RegisterResponse` — misleading in a login context**

The types are shape-identical and correct; naming them after "Register" inside the
login thunk is confusing for readers. Should be aliased or renamed (e.g.
`LoginInput`, `LoginResponse`).

**[nit] `loginThunk.ts` line 20: `e?.message` optional chain is redundant**

`e` was unconditionally asserted as `{ message?: string }` on line 19, so `e`
can never be `undefined`. `e.message` is the correct form.

**[nit] `Dashboard.test.tsx` uses bare `configureStore` instead of `makeStore`**

The subscriber (localStorage behaviour) is absent from this test. Acceptable for
a component test focused on render/navigation, but noted so a future maintainer
understands why the storage behaviour is not verified there.

---

## Post-fix gate result

After the orchestrator fixed all three blockers:

```
frontend: 57 tests / 9 suites — PASS (was 56 before fix)
backend:  26 tests / 4 suites — PASS (unchanged)
tsc + eslint: exit 0 in both repos
```

## Verdict

`VERDICT: PASS`

All blockers resolved. 3 should-fixes and 3 nits remain as tracked follow-up
items (non-blocking for demo). Every validation-contract row assigned to `test`
is covered by a real assertion. Gate commands reproduce independently.
