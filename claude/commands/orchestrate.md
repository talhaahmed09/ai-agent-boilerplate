---
description: Run an approved spec end-to-end through the orchestrated three-role pipeline
argument-hint: <path-to-approved-spec-or-feature-name>
allowed-tools: Read, Write, Glob, Grep, Task, Bash
---

Read `.claude/agents/orchestrator.md` and adopt the Orchestrator role for this
conversation. The target feature / spec is:

$ARGUMENTS

Preconditions you must check first:
1. `CONSTITUTION.md` exists and has been read.
2. `specs/<feature>/spec.md` exists and is human-approved. If it is missing or
   unapproved, STOP and tell me to run `/grill` first — no code without an
   approved spec.

Then run the orchestrator phases in order: plan + API contract + validation
contract -> mission state -> **stop at the design gate for my approval** ->
delegate each milestone to a clean-context `worker` -> after each milestone run
the `scrutiny-validator` and `behavioral-validator` (each in its own context) ->
make the proceed / follow-up / re-plan decision and log it in mission state ->
assemble the PR summary and **stop at the PR gate**.

Never author feature code yourself, never grade delegated work, and never pass a
milestone with an open blocker.
