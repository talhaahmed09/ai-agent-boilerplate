# Constitution

This is the law. Every agent, in every phase, obeys it. When an instruction
elsewhere conflicts with this document, this document wins. When this document is
silent, prefer the most boring, conventional choice and flag it for a human.

This file is also the project's memory. When we onboard an existing repo, the
onboarding grill writes what it learns into the relevant section below.

---

## 1. Non-negotiable principles

1. **No code without an approved spec.** Implementation may only begin from a
   `spec.md` a human has approved. If a request arrives without one, the first
   move is `/grill`, not coding.
2. **Small, reviewable diffs.** Each task is a unit a human can read in one
   sitting. No mega-PRs. A human is the final verifier; respect their attention.
3. **The spec describes WHAT, the plan describes HOW.** A spec never names a
   library, table, or function. A plan never re-litigates requirements.
4. **Types are a gate, not a suggestion.** `tsc --noEmit` must pass before any
   commit. No `any` without a `// reason:` comment. No `@ts-ignore` without one.
5. **Tests are non-negotiable.** Every acceptance criterion in the spec, and
   every error state, has a Jest test. Code that isn't tested isn't done.
6. **Gates can't be skipped.** Anything that must always happen is a hook or a CI
   check, never a polite instruction to an agent.
7. **Check before you build.** Before writing a helper, search for an existing
   one. Before adding a dependency, justify it in the plan.

---

## 2. Stack

This is a greenfield, two-repo project. The repos are siblings under this
workspace; this orchestration layer is not part of either.

### Frontend (`frontend/`) → deploys to Vercel
- React + TypeScript (strict mode on).
- Redux Toolkit for state. Tailwind CSS for styling.
- Tests: Jest + React Testing Library.

### Backend (`backend/`) → deploy target TBD (Vercel/dummy for now)
- Fastify + TypeScript (strict mode on).
- PostgreSQL via Prisma (ORM). Migrations are committed.
- Tests: Jest (+ `fastify.inject()` / supertest for routes).

> Auth note: OPAQUE is **out of scope for now.** Registration uses a
> conventional hashed-password flow until told otherwise.

---

## 3. Workflow and gates

The pipeline is: **grill → spec → plan → tasks → design → implement → review →
deploy.** Two kinds of gate sit between phases.

- **Human gates (judgment):** there are exactly three.
  1. **Spec sign-off** — after `/grill`, a human approves `spec.md`.
  2. **Design sign-off** — a human approves the UX before any screen is built.
  3. **PR approval** — a human approves the pull request before merge.
- **Automated gates (verification):** run continuously and at commit/CI, and
  cannot be bypassed.
  - `lint.sh` (after every file edit): Prettier + ESLint, auto-fix, block on
    unfixable errors.
  - `gate.sh` (before any `git commit`/`git push`): `tsc --noEmit` + `jest` must
    pass.
  - CI re-runs lint + typecheck + tests on every PR as the backstop.

Plan and tasks are generated automatically after spec sign-off (no human gate);
they are reviewed as part of the PR.

---

## 4. Coding standards

These are adapted from the team's reference architecture. They are conventions,
not dogma — but deviating requires a note in the plan.

### State (frontend)
- **Server state vs client state.** Data fetched from the API is a cache; session
  data (auth, theme, global UI) is client state. Ephemeral UI (form input, "is
  this modal open") stays in React local state, never Redux.
- **Slices** own a domain. Synchronous changes are reducers; async results land
  in `extraReducers`.
- **Thunks are the only place async logic and API calls live.** Use the typed
  `createAppAsyncThunk` wrapper so `state`, `dispatch`, and injected services are
  typed. Services are injected via the thunk's `extra` argument — no direct
  service imports inside thunks.
- **Selectors** are the only way the view reads state. Name them `select` + Noun
  (`selectAuthStatus`). Memoize derived selectors with `createSelector`.
- **One error shape.** Thunks reject with `{ fieldErrors?, message? }`. Slice
  `rejected` handlers unpack it with a shared `extractThunkError()` helper and
  fall back to `action.error.message` for uncaught exceptions.

### API (backend)
- Every route validates its input with a schema at the boundary; invalid input
  returns a typed 4xx, never a 500.
- Route handlers are thin: validate → call a service → map result to response.
  Business logic lives in services, data access behind Prisma.
- Errors are typed and mapped to a single response envelope:
  `{ error: { code, message, fieldErrors? } }`. The frontend error shape mirrors
  this so the two halves agree.

### Utilities-first
- Before writing a helper, check for an existing utility. Create a shared utility
  only when logic is used in 3+ places, is non-trivial (>5 lines), is pure, and
  is testable in isolation. Otherwise keep it inline.
- New shared utilities get JSDoc (`@param`, `@returns`, `@example`) and a
  `*.test.ts` next to them.

### File organization
- Frontend: `src/store/{slices,thunks,selectors}/<domain>/`, `src/utils/`,
  components co-located with their tests.
- Backend: `src/routes/`, `src/services/`, `src/schemas/`, `prisma/`.
- Test files sit next to what they test, named `*.test.ts` / `*.test.tsx`.

---

## 5. Definition of done

A task is done only when **all** of the following are true:

- [ ] Behaviour matches the approved `spec.md`, including every error state.
- [ ] `tsc --noEmit` passes in the affected repo (no new `any`/`@ts-ignore`
      without a `// reason:`).
- [ ] ESLint passes with no errors.
- [ ] Jest tests exist for every acceptance criterion and error state, and pass.
- [ ] The diff is small and self-contained; no unrelated changes.
- [ ] No new dependency added unless it was justified in the plan.
- [ ] No secrets, keys, or `.env` contents committed.
