# Notes

## Decisions

**Amounts — strings + big.js.** API amounts stay decimal strings; all math (validation, fee, receive, USD totals, overlay) goes through big.js, never `number` (`0.1 + 0.2`, 18-decimal ETH). Input: comma → dot, otherwise the API grammar is enforced with a readable error, no silent fixing. Asset amounts are never rounded; USD is rounded half-up to cents only for display. Alternative: integer minor units with BigInt — exact too, but needs per-asset scaling everywhere and still needs decimal formatting; big.js is less code.

**Balance right after a claim — local overlay until the snapshot catches up.** Balances are 15 s snapshots, so a fresh claim isn't in them. I asked the AI for approaches (ai-logs): (A) overlay: subtract the claim from `available` (and add to `claiming` while pending) until a snapshot with `asOf > claim.createdAt` arrives; (B) server numbers only + "processing" banner; (C) optimistic `setQueryData` + refetch; (D) B + fast polling. C causes exactly the "dropped then jumped back" complaint (the refetch returns the stale snapshot); B/D leave "my balance didn't change, so I claimed again". A changes the number at once and hands over to the server at the exact snapshot that includes the claim — both timestamps are server time, so device clock skew doesn't matter. A failed claim stops being overlaid, so its amount visibly returns. Overlay entries persist in localStorage, so a reload inside the 15 s window doesn't re-open the double-claim gap.

**Unknown result (timeout, 5xx, network).** Every confirmed body gets one Idempotency-Key (created when entering the confirm step, so a double tap can't make two claims). The entry is persisted *before* sending. TanStack retries with the same key (max 3 attempts, 429 waits `retryAfterMs`). If the outcome is still unknown, the user sees "We couldn't confirm whether your claim was created. Don't claim again — tap Check"; Check resends the same key + body, which the API guarantees will return the original claim rather than create a second one. A 400 on Check proves it was never created. While an asset has an unknown claim, new claims for it are blocked. Alternative: show "failed, try again" — rejected, a retry with a new key could double-pay.

**Other.** TanStack Query for all server state and all retries (no hand-written loops). Claim status polls every 2 s, max 60 s per claim, then "Taking longer than usual" + Refresh. Total USD shows two numbers: claimable (available) and total (incl. pending + claiming). Activity: the API repeats the boundary item across pages (inclusive cursor), so pages are deduped by id. Token: localStorage, per brief; changing it wipes cache and tracked claims.

## Working with AI

All in `ai-logs/` (Claude Code session export).

1. **Prompt that didn't get what I wanted.** The first spec draft planned Jest tests for the API client and submit logic and its own retry helpers. I narrowed it: tests only for amount logic, all retries via TanStack `retry`, POST ≤ 3 attempts, polling ≤ 60 s, deploy only on my command. The spec was rewritten with those constraints. *(ai-logs: "Spec review" — my reply "1. тести робиш тільки для логіки сум…")*
2. **AI output that was wrong/risky, and how I found out.** (a) The confirm step formatted the raw input, so `0,5` crashed big.js — found during manual testing in the browser. (b) The form blocked itself during submit because in-flight and unknown claims looked the same. (c) `/code-review` found that the Idempotency-Key was generated per tap (double tap → two claims), that a completed claim was still added to `claiming` (Total USD jump), and that the poll window was per screen mount, not per claim — all fixed and re-verified (double click → exactly one claim). Also the AI's own expected value in a totals test was wrong arithmetic — the test run caught it. *(ai-logs: "manual check", "code review")*
3. **Disagreed / rejected.** The AI wanted to deploy right after the first manual pass; I required a full manual check (mocked 400, network failure → unknown → reload → Check, 60 s timeout, offline states) and a code review first — the review found 4 real money/UX bugs. I also overrode its unknown-outcome proposal (lock + manual only) in favour of a few auto-retries then Check, and rejected tests outside amount logic. *(ai-logs: "Роби повну ручну перевірку, після цього /code-review")*

## Not done / known issues

- **In-flight vs unknown** share one state in the store (`claim === null`); the form excludes its own in-flight key. A cleaner model is an explicit `sending | unknown` state.
- A 401 from a request still in flight with the *previous* token can redirect to the token screen after a new valid token is saved.
- `crypto.randomUUID` needs a secure context: the live https link is fine, a phone opening the dev server over `http://<LAN-IP>` is not.
- Settled claims stay in the Home banner until dismissed (no auto-prune). `Row`/status styles are duplicated across three screens.
- Not manually exercised: Home empty state and Activity next-page error (code paths are simple; no way to trigger them on the test API without mocks).
- Pull-to-refresh is a no-op on web (react-native-web); the Refresh button covers it.
- **Next:** explicit claim state machine, link Activity claim rows to the status screen, thousands separators for USD, a hook test for the submit/unknown flow with a mocked fetch.
- Activity: a background refetch error while rows are loaded isn't shown; the sign color uses a string check instead of big.js; `status` is `string`, not a union.
