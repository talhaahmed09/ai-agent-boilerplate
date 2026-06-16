# DEMO run sheet — "how I ship a feature with AI"

A ~10-minute live walkthrough. The story you're telling: **the human approves
judgement (spec, design, PR); deterministic gates enforce everything else; and
the agent that writes the code never grades its own work.** Talking points are in
*italics*; commands are in code blocks.

---

## 0. Before you start (have these ready)

- `dev-workspace/` open in Claude Code.
- Two terminal tabs (one for backend, one for the behavioral run) — optional, the
  agent runs commands itself, but having them visible sells "it really ran."
- Deps installed once so you're not waiting on `npm install` live:
  ```bash
  (cd backend && npm install) ; (cd frontend && npm install)
  ```

*Open line:* "I don't ask the AI to 'build registration.' I make it earn an
unambiguous spec first, then I only sign off three times the whole run. Watch
where the human is — and where the human isn't."

---

## 1. The brief → the grill (human gate #1: the spec)

Show the raw, vague brief — this is what a client actually sends:
```bash
sed -n '1,12p' specs/registration/brief.md
```
*Point out how much it leaves unsaid: password rules? duplicate email? what shows
on failure? where do they land?*

Run the grilling role (or show the transcript that produced the spec):
```
/grill specs/registration/brief.md
```
*The Spec Author interrogates me in batches — fields, validation, every error
state, edge cases, security — and proposes sensible defaults I just confirm. It
writes WHAT, never HOW: no library, no table, no function names.*

Show the result and the thing that makes it testable:
```bash
sed -n '/## 4. Behaviour/,/## 5./p' specs/registration/spec.md
```
*Every acceptance criterion is numbered — AC-1 through AC-10 — so later every
test traces back to one. **This is human gate #1: I approve the spec.** Nothing
gets coded before this.*

---

## 2. Spec → plan + contracts (automatic, no gate)

```bash
ls specs/registration
sed -n '1,30p' specs/registration/api-contract.md
```
*After I approve the spec, the orchestrator auto-generates the plan (the HOW), the
**API contract** — the one source of truth both repos build to — and the
**validation contract**: the full set of ACs + error states that must ALL pass
before "done." Crucially, that contract is written before any code exists. Tests
written after the fact only confirm decisions; this defines them up front.*

```bash
sed -n '/## Contract/,$p' specs/registration/validation-contract.md
```

---

## 3. Design (human gate #2) then delegation

*The orchestrator stops once more for the design — the single-form UX, the
states. **That's human gate #2.** Then it breaks the work into milestones and
hands each to a worker with a clean context: one worker, one repo, just its slice
of the plan — no baggage from the previous feature.*

```bash
cat specs/registration/mission-state.md
```
*This mission-state file is the shared memory — current milestone, contract
progress, and any constraint discovered mid-run that every later worker must obey.
Look at the decisions log at the bottom: that's the self-healing.*

Show a worker's structured handoff — *not* "done", but evidence:
```bash
cat specs/registration/handoffs/M1-backend.md
```
*Every command and its exit code, what it left undone, what surprised it. Notice
it flagged that Fastify strips unknown fields instead of rejecting them — it
raised that to the orchestrator instead of silently changing the contract.*

---

## 4. The part that matters: creator ≠ verifier

*The worker's green local run is necessary but not sufficient. Two validators run
next — neither has seen the code being written.*

**Scrutiny validator** — reproduces the gates independently:
```bash
cd backend && npx tsc --noEmit && npx eslint . && npx jest ; cd ..
cd frontend && npx tsc --noEmit && npx eslint . && npx jest ; cd ..
```
*13/13 backend, 17/17 frontend. It also runs a code review in a fresh context and
tags findings blocker / should-fix / nit — and it can't "just fix" anything.*

**Behavioral validator** — the real gap most setups miss. *It boots the actual
app and drives it like a user:*
```bash
(cd backend && npx tsc)            # compile once
node specs/registration/behavioral-check.mjs
```
*Real HTTP against a real running server: the success path returns a token and
never echoes the password, duplicate email gives a 409, weak password and bad
email give typed 400s — never a 500. This proves it WORKS, not just that it
compiles. Six rows, all green.*

Show the captured verdicts:
```bash
tail -n 6 specs/registration/reports/behavioral.md
```

---

## 5. The gates are real, not vibes

*The reason I only check three times is that the rest is enforced, not requested.*
```bash
sed -n '1,18p' .claude/hooks/gate.sh
```
*This is a PreToolUse hook: before any `git commit`, it runs `tsc` + `jest` in
each repo and **blocks the commit** if either fails. The agent literally cannot
commit broken code. Skills are advice the model can skip; this is a gate it
can't.*

```bash
cd backend && git log --oneline -1 ; cd ..
```

---

## 6. PR (human gate #3) and close

*When every validation-contract row is satisfied, the orchestrator assembles the
PR summary — what changed, which ACs it satisfies, the validator verdicts — and
stops. **That's human gate #3: I approve the merge.** Three human decisions the
whole run; everything between them automated and verified.*

*Close:* "The residue of this run isn't scaffolding I throw away — it's a spec, a
contract, tests for every criterion, and skills. The codebase is cleaner than
when we started. And as the models get better, this gets better for free, because
the behaviour lives in prompts and skills, not hardcoded logic — only the gates
and bookkeeping are fixed."

---

## If someone asks "where does this go next?"

Point at the README's missions table: multi-day unattended runtime, a
mission-control dashboard, parallel workers, and a different model per role
(planning vs. implementation vs. validation, for bias reduction) are the
trajectory — deliberately not built for a two-feature supervised demo.

## One-liner to re-prove everything live
```bash
cd backend  && npx tsc --noEmit && npx eslint . && npx jest && cd .. \
&& cd frontend && npx tsc --noEmit && npx eslint . && npx jest && cd .. \
&& (cd backend && npx tsc) && node specs/registration/behavioral-check.mjs
```
