# Worker handoff — <feature> / <milestone> / <repo>

> Filled out by the worker subagent at the end of a milestone. This artifact —
> not a verbal "done" — is what the orchestrator and validators trust. Be honest;
> a documented failure is more valuable than an optimistic summary.

## 1. Scope of this milestone
- Repo: `frontend` | `backend`
- Plan tasks covered: <task ids / bullets>
- Acceptance criteria targeted: AC-_, AC-_, …

## 2. Completed
| AC / item | What was done | File(s) |
|-----------|---------------|---------|
| AC-_ | … | … |

## 3. Left undone / out of scope (and why)
- …

## 4. Commands run + exit codes
> Every command, including ones that failed before you fixed them. Copy faithfully.
| Command | Exit code | Notes |
|---------|-----------|-------|
| `npm install` | 0 | |
| `npx tsc --noEmit` | 0 | |
| `npx eslint .` | 0 | |
| `npx jest` | 0 | N passed / N total |
| `git commit …` | 0 | passed gate.sh |

## 5. Issues / surprises discovered
- … (include anything you suspect is wrong in the plan or API contract — flag,
  do not fix)

## 6. Procedure adherence
- [ ] Built only my slice, in one repo
- [ ] Built to the API contract exactly (or flagged a needed change above)
- [ ] A real test exists for every AC and error state in my slice
- [ ] Honoured every constraint in mission-state "Constraints discovered mid-run"
- [ ] Committed through the gate (did not bypass)
- Deviations: <none | list>
