# CashMine payback — Expo web

**Live:** https://cashmine-task-three.vercel.app

Open it on a phone, paste your API token, done. The token is kept only in this browser's localStorage and can be changed from Home ("Change token").

## Run locally

```bash
npm install
npx expo start --web
```

Checks:

```bash
npx tsc --noEmit
npx expo lint
npm test
```

Build for static hosting: `npx expo export --platform web` → `dist/` (SPA rewrites in `public/vercel.json`).

## What works

- **Token gate** — asked on first open, stored in localStorage, changeable; a 401 sends you back to it.
- **Balances (Home)** — per-asset available / pending / claiming with USD value, two totals (claimable and total), "Updated Ns ago" from `asOf`, auto-refresh every 15 s + Refresh button, loading / error+retry / empty / refresh-error states.
- **Claim** — pick an asset, enter an amount or tap Max, see fee and "You receive", confirm, submit. Input is validated against the API rules (format, decimals, min, available, amount > fee). Submits use an Idempotency-Key; network/5xx/504/429 are retried with the same key (max 3 attempts), then the app shows "result unknown" with a safe Check button.
- **Claim tracking** — status screen polls every 2 s (max 60 s, then Refresh); banner of your claims on Home; balances reflect a new claim immediately and hand over to the server snapshot without jumping.
- **Activity** — paginated history (accruals, reversals, claims) with infinite scroll.
- **Tests** — Jest unit tests for amount logic: parsing, validation, fee/receive, totals, the balance overlay, signed formatting.

Spec with acceptance criteria: [docs/spec.md](docs/spec.md). Decisions and known issues: [NOTES.md](NOTES.md).
