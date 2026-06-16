# Worker handoff — registration / M1 / backend

## 1. Scope of this milestone
- Repo: `backend`
- Plan tasks covered: M1 — `POST /register` route, schema, service, hashing,
  uniqueness, error envelope, repository interface.
- Acceptance criteria targeted: AC-3, AC-5, AC-6, AC-7, AC-10; ERR-1..4.

## 2. Completed
| AC / item | What was done | File(s) |
|-----------|---------------|---------|
| AC-3 | Valid signup creates user, returns {id,email}+token | `src/services/registerService.ts`, `src/routes/register.ts` |
| AC-5 / ERR-1 | Case-insensitive uniqueness -> 409 EMAIL_TAKEN + email fieldError | `registerService.ts`, `data/userRepository.ts`, `lib/errors.ts` |
| AC-6 / ERR-2 | Password rule (8–128, letter+number) -> 400 VALIDATION + password fieldError | `lib/password.ts`, `registerService.ts` |
| AC-7 / ERR-3 | Email format check -> 400 VALIDATION + email fieldError | `schemas/register.ts`, `registerService.ts` |
| ERR-4 | Missing/malformed body -> 400 (never 500) via schema + custom error handler | `app.ts`, `schemas/register.ts` |
| AC-10 | bcrypt hash stored; plaintext never returned/logged | `lib/password.ts`, `registerService.ts` |

## 3. Left undone / out of scope (and why)
- Prisma/Postgres wiring: documented stub only (constitution + spec out-of-scope).
  Running app and tests use `InMemoryUserRepository` behind the `UserRepository`
  interface; production is a one-line swap in `server.ts`.
- Rate limiting: specced as non-functional; not implemented in this milestone,
  flagged as a follow-up candidate.

## 4. Commands run + exit codes
| Command | Exit code | Notes |
|---------|-----------|-------|
| `npm install` | 0 | 440 packages |
| `npx tsc --noEmit` | 0 | strict mode clean |
| `npx eslint .` | 0 | no errors |
| `npx jest` | 0 | 13 passed / 13 total |

## 5. Issues / surprises discovered
- Fastify with `additionalProperties:false` **strips** unknown body fields rather
  than returning 400. Flagged to the orchestrator (became constraint C1); the
  intended security property (unknown field can't reach business logic) still
  holds. Did not change the contract myself.

## 6. Procedure adherence
- [x] Built only my slice, in one repo
- [x] Built to the API contract exactly
- [x] A real test exists for every AC and error state in my slice
- [x] Honoured mission-state constraints
- [x] Committed through the gate (did not bypass)
- Deviations: none (raised C1 for the orchestrator to rule on rather than acting unilaterally)
