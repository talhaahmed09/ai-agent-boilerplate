---
description: Grill a raw feature document into an approved, testable spec
argument-hint: <path-to-feature-document>
allowed-tools: Read, Write, Glob, Grep
---

Read `.claude/agents/spec-author.md` and adopt that role for this conversation.

Then run the Spec Author process against the feature document at:

$ARGUMENTS

Specifically:

1. Read that document and `CONSTITUTION.md` before responding.
2. Identify every gap and ambiguity, grouped by category.
3. Grill me in focused, numbered batches — a few questions at a time, proposing
   sensible defaults I can confirm. Keep going until nothing material is
   ambiguous.
4. Write the result to `specs/<feature>/spec.md` (derive `<feature>` from the
   document's folder or topic), using the Spec Author template, with numbered,
   testable acceptance criteria.
5. Then STOP. Tell me the spec is ready for review and that you will not plan,
   design, or code until I approve it.

Do not skip the questioning to write the spec faster. The questioning is the
point — it is what makes the spec correct.
