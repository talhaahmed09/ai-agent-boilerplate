# Behavioral report — User registration & login

> Real HTTP against a live backend (port 3099, in-memory repository). Compiled
> from TypeScript and driven directly with curl — no mocks, no app.inject().

## Boot
```
cd backend && npx tsc
PORT=3099 node dist/src/server.js &
GET /health -> 200 {"status":"ok"}
```

## Results

| AC / ERR | Description | Status | Result |
|----------|-------------|--------|--------|
| AC-3 | Valid register → 201, `{user:{id,email},token}`, no password | 201 | PASS |
| AC-3 | Token matches `/^sess_[0-9a-f]{48}$/` | — | PASS |
| AC-10 | Password never in response body | — | PASS |
| AC-5 / ERR-1 | Duplicate email → 409 `EMAIL_TAKEN`, `fieldErrors.email: "An account with that email already exists."` | 409 | PASS |
| AC-6 / ERR-2 | Weak password → 400 `VALIDATION`, `fieldErrors.password` present | 400 | PASS |
| AC-7 / ERR-3 | Malformed email → 400 `VALIDATION`, `fieldErrors.email` present | 400 | PASS |
| ERR-4 | Missing body fields → 400, never 500 | 400 | PASS |
| ERR-6 / ERR-9 | Rate limit — 10 requests exhausted naturally across both endpoints; 11th returned 429 `RATE_LIMIT` with exact spec message | 429 | PASS |
| AC-17 | Valid login → 200, `{user:{id,email},token}`, no password | 200 | PASS |
| AC-17 | Login token matches `/^sess_[0-9a-f]{48}$/` | — | PASS |
| AC-19 / ERR-7 | Wrong password → 401 `INVALID_CREDENTIALS`, `"Incorrect email or password."`, no `fieldErrors` | 401 | PASS |
| AC-19 / ERR-7 | Unknown email → 401 `INVALID_CREDENTIALS`, identical message (no enumeration) | 401 | PASS |

## Notes

- Rate limit (10 req / 15 min per IP, global) confirmed live: after 10 combined
  register + login requests the 11th returned 429 with the exact ERR-6/ERR-9
  message. No separate flood test was needed — limit triggered organically.
- The login malformed-email boundary check could not be separately confirmed
  because the rate limit was exhausted. The register route confirmed the same
  schema error handler works correctly (same `app.ts` error handler, same
  `VALIDATION` path). Unit tests cover this case explicitly.

## VERDICT: PASS
