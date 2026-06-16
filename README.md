# dev-workspace — agentic, spec-driven dev system (orchestrated variant)

A spec-driven, gated, multi-agent system that takes a feature from a raw client
brief to a tested, ready-to-merge feature branch across two repos
(`frontend/` + `backend/`) — with a human approving **only** at the three points
where judgement is required, and everything else enforced by deterministic gates
rather than polite instructions.

This is the **orchestrated** variant: a single Claude Code session opened in
`dev-workspace/`, where one orchestrator delegates to clean-context subagents and
self-heals at milestone boundaries.

---

## The shape of a run

```
brief ──/grill──▶ spec ─▶ plan + API contract + validation contract ─▶ design
        (human gate 1:           (auto, no gate)                       (human gate 2:
         approve spec)                                                  approve design)
                                                                            │
        ┌───────────────────────────────────────────────────────────────┘
        ▼
   per milestone:  worker (writes code + tests, commits through the gate)
                      │  └─ structured handoff (not just "done")
                      ▼
                   scrutiny validator   +   behavioral validator
                   (typecheck/lint/tests       (boots the app, drives it
                    + code review, fresh         over real HTTP / Playwright)
                    context, no self-fixing)
                      │
                      ▼
                   orchestrator decides: proceed / scope follow-up / re-plan
                                                                            │
                                                                            ▼
                                                              PR summary ─▶ (human gate 3: approve PR)
```

## The two laws that drive every decision

1. **Skills are probabilistic; hooks/CI are deterministic.** Guidance lives in a
   skill (the model can still skip it). Anything that *must* hold — types pass,
   tests pass before commit, lint — lives in a hook or CI, never an instruction.
2. **Creator ≠ verifier.** The agent that writes code never grades its own
   homework. Review and behavioral validation are separate agents with fresh
   context. This is the answer to "what stops the agent from grading its own
   homework."

Supporting principles: spec = WHAT / plan = HOW, never mixed; every line of the
spec is testable and every acceptance criterion is numbered (AC-1, AC-2, …) so a
test can trace back to it; the validation contract (what "done" means) is decided
*before* code exists; the codebase is cleaner at the end than the start (tests,
specs, skills are the residue); build for the bitter lesson — behaviour lives in
prompts/skills, the deterministic core (gates, bookkeeping) stays thin.

See `CONSTITUTION.md` for the full law every agent obeys.

---

## The three-role model (what this variant adds)

A multi-agent run only becomes *trustworthy* over a longer task when three roles
are separated and a shared state survives between them.

### Orchestrator — `.claude/agents/orchestrator.md`
Turns an approved spec into a `plan.md`, an **API contract** (the cross-repo
source of truth), and a **validation contract** (the full set of acceptance
criteria + error states that must collectively pass before "done"). Breaks the
plan into milestones, delegates each to a clean-context worker, and at every
milestone boundary reads the handoff + both validator reports and decides to
proceed, scope a follow-up, or re-plan. It never writes feature code and never
grades delegated work.

### Worker — `.claude/agents/worker.md`
One subagent per feature/milestone, scoped to one repo, given only its slice of
the plan (no baggage from prior features). Implements against its slice, commits
through the gate so the next worker inherits a clean tree, and finishes by filling
out a **structured handoff** (`.claude/templates/handoff.md`) — what it completed,
what it left undone, every command run and its exit code, issues discovered, and
whether it followed procedure — instead of just reporting "done."

### Validators — `.claude/agents/scrutiny-validator.md` + `behavioral-validator.md`
Two validators run after each milestone, neither having seen the code being
written (true creator/verifier separation):

- **Scrutiny** reproduces typecheck/lint/tests independently and spawns a
  per-feature code-review subagent, severity-tagged (blocker / should-fix / nit),
  no self-fixing.
- **Behavioral** *actually runs the app* and drives it end-to-end against the
  validation contract — boots the backend, hits `/register` over real HTTP (and,
  where relevant, drives the UI with Playwright), and confirms the success path
  and every error state behave correctly, not just that they type-check. This is
  the piece a Jest-only setup doesn't have, and it is what proves the feature
  *works*.

### Shared state — `.claude/templates/mission-state.md`
Alongside `CONSTITUTION.md`, a running `mission-state.md` is the single source of
run truth that every role reads: current milestone, per-feature status,
validation-contract progress, constraints discovered mid-run (binding on all
later workers), and the orchestrator's decision log. This is the lightweight
"broadcast" surface — a file both sessions reference, no live dashboard needed.

---

## Where this sits relative to Factory's "missions"

This variant borrows the parts of that architecture worth having for a supervised,
two-feature demo, and deliberately leaves the rest as *trajectory, not built*:

| Missions concept | Here | Notes |
|------------------|------|-------|
| **Delegation** | ✅ orchestrator → clean-context workers | one worker, one repo, one slice |
| **Creator/verifier separation** | ✅ worker vs two validators | fresh context, adversarial by design |
| **Broadcast** | ✅ `mission-state.md` + constitution | a shared file, not a live control plane |
| **Negotiation / self-healing** | ✅ orchestrator decision log | proceed / scope follow-up / re-plan at each boundary |
| Multi-day unattended runtime | ❌ trajectory | the point of this variant is a single *supervised* session |
| Mission-control dashboard | ❌ trajectory | a file is enough at this scale |
| Parallel worker execution | ❌ trajectory | milestones run in sequence here |
| Different model per role | ❌ trajectory | a real bias-reduction lever, noted not built |
| Running on a hosted Agent SDK process | ❌ trajectory | stays a Claude Code session |

Explicitly out of scope (so the system isn't over-built): real production infra —
the Prisma adapter, Docker Postgres, and CI actually running in GitHub stay
**documented but not wired**, exactly as today.

---

## Proof: the registration feature, built through this pipeline

`specs/registration/` holds the full artifact trail of one real run — `brief.md`
(raw) → `spec.md` (grilled, AC-1..AC-10 + ERR-1..5) → `plan.md` + `api-contract.md`
+ `validation-contract.md` → `mission-state.md` → `handoffs/` (one per milestone)
→ `reports/` (both validators). The feature itself is real and **verified green**:

- **backend/** (Fastify + TS): `tsc --noEmit` clean, `eslint` clean, **13/13 Jest**.
- **frontend/** (React + RTK + TS): `tsc --noEmit` clean, `eslint` clean, **17/17 Jest**.
- **behavioral:** `node specs/registration/behavioral-check.mjs` boots the real
  backend and drives `/register` over real HTTP — **6/6 contract rows PASS**
  (success, duplicate-email, weak-password, malformed-email, missing-body, and
  password-never-returned).

```bash
cd backend  && npm install && npx tsc --noEmit && npx eslint . && npx jest
cd frontend && npm install && npx tsc --noEmit && npx eslint . && npx jest
cd ..       && (cd backend && npx tsc) && node specs/registration/behavioral-check.mjs
```

See `DEMO.md` for the live walkthrough run sheet.

---

## Layout

```
dev-workspace/
├── README.md                      ← this file
├── DEMO.md                        ← live walkthrough run sheet
├── CONSTITUTION.md                ← the law every agent obeys
├── .claude/
│   ├── settings.json              hook wiring + permissions
│   ├── agents/
│   │   ├── spec-author.md         brief → spec (the grilling role)
│   │   ├── orchestrator.md        mission driver (plan, delegate, self-heal)
│   │   ├── worker.md              implements one milestone in one repo
│   │   ├── scrutiny-validator.md  typecheck/lint/tests + code review
│   │   └── behavioral-validator.md boots + drives the running app
│   ├── commands/
│   │   ├── grill.md               /grill  — brief → approved spec
│   │   └── orchestrate.md         /orchestrate — approved spec → tested branch
│   ├── hooks/
│   │   ├── lint.sh                PostToolUse: Prettier + ESLint on every edit
│   │   └── gate.sh                PreToolUse: blocks git commit if tsc/jest fail
│   ├── skills/jest-testing/SKILL.md   how tests are written here
│   └── templates/                 handoff / mission-state / plan / contracts
├── specs/registration/            the full artifact trail of one run (+ proof)
├── backend/                       repo 1 (git): Fastify + TS  (+ Prisma documented)
└── frontend/                      repo 2 (git): React + RTK + TS + Tailwind
```
