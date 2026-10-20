# CLAUDE.md

@AGENTS.md

Expo (React Native, TypeScript) app, delivered as a **web build** opened on a phone. Timed task: correctness and clarity over breadth.

## Workflow

- Non-trivial feature → run `/spec` first. No code before the spec is approved.
- Implement strictly to the ACs. No behaviour that isn't in the spec. Ambiguous AC → ask, don't interpret.
- Before fixing a bug, find the root cause. No defensive null checks that hide it.
- Run `npx tsc --noEmit` after every change set; it must be clean before saying "done".
- Never commit, push or deploy on your own. After each finished AC, propose a commit message (`feat:` / `fix:` / `chore:` / `refactor:`); the user runs it.

## Secrets

- The API token is not in code, repo, env files or the deployed build. The user enters it in the app on first open, it is kept in browser storage (localStorage) and can be changed from the UI.
- API base URL lives in one place: `src/api/config.ts`.

## Web target

- Every library must work on web (`react-native-web`). Check before adding; no native-only modules.
- Design for a phone viewport (~375px) first; must not break on desktop width.
- Platform differences go behind `Platform.OS` or `.web.tsx` files, never scattered.

## Structure

```
src/
  app/        expo-router routes only — thin files that render a screen from src/features
  api/        client.ts (fetch + auth header + error mapping), <domain>.ts, types.ts
  features/<Feature>/
    screens/<Screen>/index.tsx           rendering only
    screens/<Screen>/use<Screen>.ts      all logic: queries, state, handlers
    components/                          feature-local components
  components/ shared UI (Button, ErrorState, EmptyState, Loader)
  theme.ts    colors, spacing, typography tokens
```

- **Screen = hook + component.** The hook returns a plain object; the component destructures it and renders. No fetch/business logic in JSX files.
- Split a component when it has its own state or is reused, or the file passes ~150 lines. Don't pre-split.
- Every data screen handles **loading, error (with retry), empty, success**.

## State

- Server state: one query library (TanStack Query). Never copy server data into `useState`.
- Derived values are computed (`useMemo` only if it's expensive), never stored.
- Local UI state stays local. No global store unless two unrelated screens need it.

## TypeScript

- No `any`, no `@ts-ignore`. `@ts-expect-error` only with a one-line reason.
- API response types in `src/api/types.ts`, typed at the client boundary.
- `type` for unions/aliases, `interface` for object shapes.

## Styling

- `StyleSheet.create` at the bottom of the file. No inline style objects.
- Colors/spacing/typography from `theme.ts`, no stray hex values.

## Errors

- One place maps HTTP/network errors to a user-facing message (`src/api/client.ts`).
- No empty `catch`. Log with context in dev, show a readable message to the user.

## Scope

- Touch only files the task needs. No drive-by refactors; mention unrelated issues instead.
- No new dependency unless the task can't reasonably be done without it; say why when adding one.
- Comments: English, terse, only the non-obvious *why*.

## Tests

- Logic in hooks/utils gets a small Jest test for `[auto]` ACs. No snapshot tests, no tests for pure rendering.

## README (end of task)

How to run, live link, decisions and trade-offs, what's not done and why, what I'd do next.
