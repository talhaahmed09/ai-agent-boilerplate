# Mission state — <feature>

> The shared broadcast surface (spec §4d). The orchestrator keeps this current;
> every worker and validator reads it before acting. Alongside `CONSTITUTION.md`
> this is the single source of run truth. Keep it honest, including failures.

- **Mission:** <feature> across `frontend` + `backend`
- **Spec:** `specs/<feature>/spec.md` (status: approved <date> | pending)
- **Design gate:** pending | approved <date>
- **Current milestone:** <id / name>
- **Updated:** <date/time>

## Milestones
| # | Milestone | Repo | Status | Worker handoff | Validators |
|---|-----------|------|--------|----------------|------------|
| 1 | … | backend | pending / in-progress / validated / blocked | link | scrutiny:_, behavioral:_ |

> Status legend: pending -> in-progress -> handed-off -> validated (both PASS) |
> blocked (a validator FAIL, see decisions below).

## Validation-contract progress
> Mirror of `validation-contract.md` status. The feature is done only when every
> row is `satisfied`.
| ID | What | Proof type | Status |
|----|------|-----------|--------|
| AC-1 | … | test | pending / satisfied |
| ERR-_ | … | behavioral | pending / satisfied |

## Constraints discovered mid-run (binding on all later workers)
> Anything learned after planning that every remaining worker/validator must
> honour. Post-dates the plan but outranks silence in it.
- …

## Orchestrator decisions log (self-healing)
> Every milestone-boundary decision: proceed / scope follow-up / re-plan, with
> rationale, so the run is auditable and the next worker inherits the reasoning.
| Date | Trigger (validator finding) | Decision | Rationale |
|------|-----------------------------|----------|-----------|
