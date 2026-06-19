# Validation contract — <feature>

> The definition of "done" for the whole feature, produced during planning,
> before code exists (spec §4a). It is the union of the spec's acceptance
> criteria and every error state, each bound to how it will be proven. The
> feature is not done until every row is `satisfied`. Tests written after the
> fact only confirm decisions; this contract is decided up front.

## How each row is proven
- **test** — a Jest unit/integration test (scrutiny validator confirms it exists
  and truly asserts the behaviour).
- **behavioral** — observed on the running app by the behavioral validator (real
  HTTP call and/or Playwright), not inferred from source.
- **both** — high-value paths (e.g. the success path, security-sensitive errors)
  get a test AND a running-app check.

## Contract
| ID | Source (spec) | Behaviour to prove | Proof type | Owner repo | Status |
|----|---------------|--------------------|-----------|-----------|--------|
| AC-1 | spec §4 | … | both | backend | pending |
| AC-2 | spec §4 | … | test | frontend | pending |
| ERR-1 | spec §6 | … | behavioral | backend | pending |

> A milestone passes only when every row owned by it is `satisfied` and both
> validators returned `VERDICT: PASS`.
