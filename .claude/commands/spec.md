---
description: Turn the brief (or one feature of it) into an approved spec with numbered ACs before any code
argument-hint: <my decisions for the brief>
---

My decisions: $ARGUMENTS

Do NOT write code in this command.

1. Read the brief and API docs (`docs/brief.md`, `docs/api.md`). Read the code it touches, if any exists.
2. My decisions above are binding — build the spec on them, don't re-argue them. Push back only if one conflicts with the brief or the API docs; say which line and why. Ask about remaining gaps where two readings lead to materially different work, with concrete options. Routine judgment calls are yours — list them under Decisions as "assumed".
3. Write `docs/spec.md` (append a section per feature if it exists):
   - **Goal** — one or two sentences.
   - **Acceptance criteria** — each with a stable ID and a tag:
     - `AC-001 [auto]` — testable in Jest at hook/util level with ≤3 mocks
     - `AC-002 [manual]` — visual / interaction, checked in the phone viewport
     - `AC-003 [static]` — checkable by `tsc` or reading the source
   - **States** — loading / error / empty / success for every data screen.
   - **API** — endpoints used, request/response shape, error cases.
   - **Decisions** — library choices and trade-offs, one line each.
   - **Non-goals** — what we deliberately skip in 2 hours.
   - **Plan** — ordered steps, files per step, which AC each step covers. Every AC appears in at least one step.
4. Show the ACs and decisions, then **stop and wait for approval**. After approval, AC IDs are frozen: new ones get appended, never renumbered.

After implementation, walk the AC list by ID and report each as done / not done / manual-check-needed.
