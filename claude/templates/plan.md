# Plan — <feature>

> The HOW. Derived from the approved `spec.md`; never re-litigates a requirement
> and never edits the spec. Names libraries, tables, files, functions — all the
> things the spec is forbidden to name. If writing this exposes a real gap in the
> spec, stop and surface it rather than papering over it here.

## 1. Approach
One or two paragraphs: the shape of the solution across both repos.

## 2. Architecture & file layout
- Backend: routes / services / schemas / data layer — list the files to add.
- Frontend: slice / thunks / selectors / components — list the files to add.

## 3. Dependencies
| Package | Repo | Why (justification required for anything new) |
|---------|------|----------------------------------------------|

## 4. Milestones (delegation units)
> Each milestone is one worker, one repo, a clean context, a small reviewable diff.
| # | Milestone | Repo | Depends on | ACs covered |
|---|-----------|------|-----------|-------------|
| 1 | … | backend | — | AC-_, ERR-_ |
| 2 | … | frontend | 1 | AC-_ |

## 5. Cross-repo contract
Pointer to `api-contract.md` — the source of truth both repos build to.

## 6. Risks / deviations from the constitution
- … (anything that deviates from CONSTITUTION.md §4, with the required note)
