# Spec #1 — Balances (Home) + Claim + unit tests

Status: **approved 2026-10-20**. AC IDs are frozen: new ACs are appended, never renumbered.
Activity is out of scope here (Spec #2).

## Goal

A user opens the web build on a phone, enters their API token, sees their payback balances with USD totals and data freshness, and claims an asset safely: correct amounts, no double claims, a clear outcome even when the network fails.

## Acceptance criteria

### Token & errors

- **AC-001 [manual]** With no token in localStorage, every route shows the Token screen: a text field and Save. Save is disabled for empty/whitespace input; the value is trimmed, stored in localStorage, and the user lands on Home.
- **AC-002 [manual]** Home has a "Change token" action that opens the Token screen prefilled with the current token. Saving a different token clears the query cache and the tracked claims (data is private per token).
- **AC-003 [static]** `client.ts` maps every failure to one typed `ApiError` with a user-facing message: 400 `VALIDATION` (with `field`), 401, 404, 409, 429 (with `retryAfterMs` from body, else `Retry-After` header), 500/503 `SERVER`, 504 `TIMEOUT`, fetch rejection → `NETWORK`, non-JSON body → `SERVER`.
- **AC-004 [manual]** A 401 from any request sends the user to the Token screen with "Your token is invalid or expired".
- **AC-005 [static]** The token is not in code, repo, env files or build; the base URL exists only in `src/api/config.ts`; the `Authorization` header is set only in `src/api/client.ts`.

### Amounts

- **AC-006 [auto]** `parseAmount` trims whitespace, converts `,` to `.`, and accepts only the API grammar (digits, optional `.` + digits, no leading zeros). Rejects `""`, `".5"`, `"1."`, `"05"`, `"1e-3"`, `"-1"`, `"1.2.3"`, `"abc"` with a reason.
- **AC-007 [auto]** `validateClaimAmount(input, {decimals, minAmount, available, fee})` returns one error for: invalid format, more than `decimals` places, `< minAmount`, `> available`, `amount − fee ≤ 0`. `amount == minAmount` and `amount == available` are valid.
- **AC-008 [auto]** `receive = amount − fee` is exact (`0.5 − 0.0012 = 0.4988`; no float drift). Amounts are formatted as plain decimals, never exponent notation (`0.0000001`, not `1e-7`), trailing zeros trimmed, never rounded.
- **AC-009 [auto]** Totals from *effective* balances (AC-017): Claimable USD = Σ available × usdPrice; Total USD = Σ (available + pending + claiming) × usdPrice. Displayed rounded half-up to 2 decimals; per-asset USD likewise.
- **AC-010 [static]** No JS `number` arithmetic on amounts or prices — all via big.js; amounts are strings at the API boundary and in the request body.

### Home (balances)

- **AC-011 [manual]** Each asset row shows: asset code, available (prominent) + its USD value, pending, claiming.
- **AC-012 [manual]** Header shows Claimable USD (main) and Total USD (secondary), and freshness from `asOf`: "Updated 12s ago", ticking each second.
- **AC-013 [manual]** States: first load → loader; error without data → ErrorState with message + Retry; `items: []` → EmptyState; background refresh error with data → data stays, inline "Couldn't refresh: …" + Retry.
- **AC-014 [manual]** Balances refetch every 15 s while Home is shown; a Refresh button refetches with an in-progress indicator; pull-to-refresh where the platform supports it.
- **AC-015 [static]** GET queries use TanStack `retry` / `retryDelay`: up to 3 retries on `NETWORK`/`SERVER`/`TIMEOUT`/`RATE_LIMITED` (429 waits `retryAfterMs`), never on 400/401/404/409. No hand-written retry loops.
- **AC-016 [manual]** Tapping an asset opens its claim form. If that asset has an unknown-outcome claim, the form is blocked with a message and a link to that claim's status.

### Tracked claims & overlay

- **AC-017 [auto]** `effectiveBalances(snapshot, trackedClaims)` (pure, in `src/utils/amount.ts`): for each tracked claim with a server `createdAt`, status ≠ `failed`, and `snapshot.asOf ≤ createdAt` → `available −= amount`, `claiming += amount`. No overlay once `asOf > createdAt`, for failed claims, or for unknown-outcome entries. Several claims on one asset add up.
- **AC-018 [manual]** Tracked claims (incl. unknown-outcome entries with their idempotency key and body) persist in localStorage and survive a reload; unreadable storage → empty list, logged in dev.

### Claim form & submit

- **AC-019 [manual]** Claim form loads `claim-options` for the asset (loading / error + Retry). Shows effective available, min amount, fee, destination (auto-selected if one, picker if several, none → message and claim disabled).
- **AC-020 [manual]** Amount field with decimal keyboard; Max fills effective available exactly; the validation message (AC-007) shows under the field; fee and "You receive" update while the amount is valid; Continue disabled while invalid.
- **AC-021 [manual]** Confirm step shows asset, amount, fee, you receive, destination label. Back keeps the entered values; Confirm submits.
- **AC-022 [static]** One Idempotency-Key (`crypto.randomUUID()`) per confirmed body, generated before `mutate` and passed in the mutation variables, so TanStack retries and "Check" resend the same key and the same body. After a definitive rejection, a new submit gets a new key.
- **AC-023 [static]** Submit is a TanStack `useMutation` with `retry` / `retryDelay`: **at most 3 attempts in total** (delays 1 s, 2 s; 429 waits `retryAfterMs`) on `NETWORK`/`SERVER`/`TIMEOUT`/`RATE_LIMITED`, then `unknown`. Outcome: 201/200 → created, tracked as `pending`; 400 → rejected (not created), server message shown; 409 → rejected, generic message; 401 → token flow. 400/401/404/409 are never retried.
- **AC-024 [manual]** While submitting, Confirm shows a spinner and is disabled. Created → status screen. Rejected → back on the form with the server message.
- **AC-025 [manual]** Unknown outcome → status screen: "We couldn't confirm whether your claim was created. Don't claim again — tap Check." Check resends with the same key and resolves to created / rejected / still unknown. The entry survives a reload.

### Status

- **AC-026 [manual]** Status screen polls `GET /v1/claims/{id}` every 2 s while `pending`, **for at most 60 s** from when polling started; shows amount, fee, you receive, status; stops on `completed` / `failed`; `failed` shows `failureReason`. After 60 s still pending → polling stops, "Taking longer than usual" + Refresh (restarts the 60 s window). A poll error shows an inline retry without losing the last known status.
- **AC-027 [manual]** Home shows a banner with each tracked claim (pending / unknown / completed / failed); tap → its status screen. Pending entries poll under the same 2 s / 60 s rule. Settled claims get a dismiss (×) once the snapshot no longer needs their overlay.
- **AC-028 [manual]** Right after a claim is created, Home shows that asset's available reduced and claiming increased, and the numbers don't jump back when the next snapshot arrives. A failed claim's amount returns to available.

### Quality & delivery

- **AC-029 [static]** `npx tsc --noEmit`, `npx expo lint` and `npm test` pass.
- **AC-030 [manual]** Usable at 375–390 px; at desktop width the content is a centered column (max-width), nothing stretched or broken.
- **AC-031 [static]** Structure per CLAUDE.md: route files are thin; each screen = `use<Screen>.ts` + `index.tsx`; `StyleSheet.create`; colors/spacing from `theme.ts`.
- **AC-032 [manual]** The web build is deployed (Vercel) and works from the live link on a phone.
- **AC-033 [static]** README (live link, run locally, what works) and NOTES.md (Decisions, Working with AI, Not done) exist.

## States

| Screen | Loading | Error | Empty | Success |
|---|---|---|---|---|
| Token | — | inline: 401 message when redirected | — | form |
| Home | full-screen loader on first load; refresh indicator after | no data: ErrorState + Retry; with data: inline banner + Retry | EmptyState "No payback yet" | totals, freshness, banner, asset rows |
| Claim form | loader while `claim-options` loads | ErrorState + Retry | no destinations: message, claim disabled | form → confirm step |
| Claim status | submitting spinner / first poll | unknown: message + Check; poll error: inline retry, last status kept | — | pending / completed / failed |

## API

All `/v1` requests send `Authorization: Bearer <token>`. Base URL `https://task-api.cashmine.io` in `src/api/config.ts`.

| Endpoint | Used for | Response |
|---|---|---|
| `GET /v1/balances` | Home, claim form (available) | `{ asOf, items: [{ asset, decimals, available, pending, claiming, usdPrice }] }` |
| `GET /v1/claim-options?asset=X` | Claim form | `{ asset, minAmount, fee, destinations: [{ id, label }] }` |
| `POST /v1/claims` + `Idempotency-Key` | Submit | body `{ asset, amount, destinationId }` → 201 / 200 replay → Claim |
| `GET /v1/claims/{id}` | Status polling | Claim `{ id, asset, amount, fee, receiveAmount, destinationId, status, failureReason, createdAt, updatedAt }` |

Errors: `{ error: { code, message, field?, retryAfterMs? } }` — 400 VALIDATION, 401 UNAUTHORIZED, 404 NOT_FOUND, 409 IDEMPOTENCY_MISMATCH, 429 RATE_LIMITED, 500/503 SERVER, 504 TIMEOUT (outcome unknown).

## Decisions

Agreed with the user:
- **big.js** for amounts: exact decimals, small, works on web; `number` would drift (`0.1 + 0.2`).
- **TanStack Query** for server state: retries, refetch interval, cache reset on token change.
- **Jest** via `jest-expo` for unit tests of utils/hooks.
- **Balance after claim: local overlay** (AC-017). Alternatives: server-only numbers + banner (user sees no change → claims again), optimistic `setQueryData` + refetch (stale snapshot → number jumps back). Overlay shows the change at once and hands over to the snapshot exactly when it includes the claim (`asOf > createdAt`, both server clock).
- **Unknown outcome:** 3 auto-retries with the same key, then "unknown" + Check with the same key. Safe because the API replays the original claim for the same key + body.
- **Tracked claims in localStorage** so the overlay and the unknown key survive a reload.
- **Total USD:** two numbers — Claimable (available) and Total (incl. pending + claiming).
- **Input:** comma → dot; everything else is an error, no silent fixing.
- **Flow:** form → confirm step → status screen; claims banner on Home.
- **Refresh:** every 15 s (snapshot cadence) + manual.
- **Tests only for amount logic** (`src/utils/amount.ts`): parsing, validation, fee/receive, totals, overlay arithmetic. Everything else is checked statically or manually.
- **All retries via TanStack** (`retry` / `retryDelay` on queries and the submit mutation), no custom retry loops.
- **POST: at most 3 attempts in total.**
- **Claim status polling: at most 60 s**, then manual Refresh.
- **Deploy:** Claude runs it, only on the user's explicit command.

Assumed (my calls, override if you disagree):
- Retry timings: GET up to 3 retries; POST delays 1 s / 2 s; 429 always waits `retryAfterMs`.
- 500/503/429 on POST are treated as unknown and retried — the idempotency key makes this safe even if the server did create the claim.
- While an asset has an unknown-outcome claim, new claims for it are blocked (prevents a second claim with a new key). Its amount is **not** overlaid (no `createdAt` to hand over on).
- Overlay hand-over uses strict `asOf > createdAt`.
- 401 keeps the stored token and opens the Token screen prefilled, so the user can fix it.
- Changing the token wipes tracked claims (they belong to the old token's data).
- Max = effective available (snapshot minus overlay). The server checks `available` live; a 400 is shown on the form.
- USD rounding half-up, 2 decimals; asset amounts never rounded.
- Claim status polled every 2 s (settles in ~20 s); banner entries on Home poll too.
- **Pull-to-refresh:** react-native-web's `RefreshControl` has no pull gesture on web, so the visible Refresh button is the primary control on the web build.
- `crypto.randomUUID()` for keys — no extra dependency; needs a secure context (https / localhost), which the live link and dev server have.
- UI copy in English (reviewers' language and the API's).
- Amount utils live in `src/utils/amount.ts` (used by Home and Claim). The tracked-claims store is the one shared module (Home + Claim status both need it), built on `useSyncExternalStore`, no store library.
- New deps: `big.js`, `@types/big.js`, `@tanstack/react-query`, `jest`, `jest-expo`, `@types/jest` — installed via `npx expo install`.

## Non-goals

- Activity history (Spec #2).
- Native iOS/Android builds; only the web build is delivered.
- Cancelling a claim (no API for it).
- Dark mode, i18n, animations, offline mode.
- E2E/UI tests, snapshot tests.
- Several tokens/profiles at once.

## Plan

| # | Step | Files | ACs |
|---|---|---|---|
| 1 | Install deps, Jest config, `test` script | `package.json`, `jest.config.js` | AC-029 |
| 2 | API layer: config, types, client with error mapping, token storage, endpoints, shared TanStack `retry`/`retryDelay` | `src/api/config.ts`, `types.ts`, `client.ts`, `token.ts`, `balances.ts`, `claims.ts` | AC-003, AC-005, AC-015 |
| 3 | Amount utils (incl. `effectiveBalances`) + tests | `src/utils/amount.ts`, `src/utils/amount.test.ts` | AC-006–AC-010, AC-017 |
| 4 | Theme + shared UI | `src/theme.ts`, `src/components/{Button,ErrorState,EmptyState,Loader,Screen}.tsx` | AC-030, AC-031 |
| 5 | Root layout (QueryClientProvider, token gate, 401 redirect) + Token screen | `src/app/_layout.tsx`, `src/app/token.tsx`, `src/features/Auth/screens/Token/{index.tsx,useToken.ts}` | AC-001, AC-002, AC-004 |
| 6 | Tracked-claims store (localStorage + `useSyncExternalStore`) | `src/features/Claim/trackedClaims.ts` | AC-018 |
| 7 | Home screen | `src/app/index.tsx`, `src/features/Balances/screens/Home/{index.tsx,useHome.ts}`, `components/{BalanceRow,TotalsHeader,ClaimsBanner}.tsx` | AC-009, AC-011–AC-016, AC-027, AC-028 |
| 8 | Deploy to Vercel — **on user's command** | — | AC-032 |
| 9 | Claim form + confirm step + submit mutation (key, retry, outcome) | `src/app/claim/[asset].tsx`, `src/features/Claim/screens/ClaimForm/{index.tsx,useClaimForm.ts}` | AC-019–AC-024 |
| 10 | Claim status screen (polling ≤ 60 s, unknown + Check) | `src/app/claim-status/[key].tsx`, `src/features/Claim/screens/ClaimStatus/{index.tsx,useClaimStatus.ts}` | AC-025, AC-026 |
| 11 | Checks, README, NOTES, redeploy (on user's command), AC walk | `README.md`, `NOTES.md` | AC-029, AC-032, AC-033 |
