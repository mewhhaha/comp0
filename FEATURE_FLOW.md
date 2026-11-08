# Feature Flow: comp0

## Kind

Existing codebase of a library: headless React component library (`@comp0/react`, `@comp0/core`, `@comp0/genui`), TypeScript, pnpm monorepo, React Compiler on. `AGENTS.md` is the source of truth for conventions.

## Checks

- Full: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:all` (unit + browser projects), `pnpm test:compiler-conformance`. `pnpm verify` runs all of these plus package, compiler-smoke and e2e.
- Targeted: `pnpm vitest run --project unit packages/react/src/<family>` (jsdom) and `pnpm vitest run --project browser packages/react/src/<family>` (Chromium).
- Run it: browser tests and `pnpm bench` launch headless Chromium, which needs to run outside the macOS sandbox. Benchmarks: `pnpm bench packages/react/bench/<file>.bench.tsx`. Compare before/after with the same file and `-t` filter (JIT warm-up from earlier scenarios changes the numbers), and note `$TMPDIR` differs inside and outside the sandbox. A bench result that depends on what ran before it is suspect: React's dev build throttles owner-stack capture per second (`measure.tsx` resets it), so measure both sides in one session.

## Conventions

- Component behavior change: tests next to the family (`packages/react/src/<family>/*.test.tsx`), interact through `setup(ui)` from `packages/react/test/render.tsx`; no synthetic events without a `comp0/no-synthetic-events` disable comment.
- DOM state: attributes on elements comp0 renders come from render; collection-dependent values read via `useSyncExternalStore(collection.subscribe, ...)` (see `AGENTS.md` "DOM state", `Tabs` is the reference). Perf-motivated changes get a bench in `packages/react/bench/` and a row in `packages/react/PERFORMANCE.md`.
- Docs for a family live in `apps/docs/src/content/components/<slug>.ts`; new `data-*` attributes must be documented there.

## Standing criteria

- The existing test suite, lint, typecheck, format and compiler conformance still pass.
- Every changed component file is still compiled by the React Compiler.
- No compatibility aliases; follow `AGENTS.md`.

## Reviewer checklist

- The change follows the patterns around it (naming, `ComponentProps` props types, contexts via `createRequiredContext`, `dataAttr` presence attributes, no nested ternaries).
- Anything the sibling named in FILES does that the new code should and doesn't is a finding.
- Exactly one tab stop in every roving composite after mount, keyboard moves, item disable/unmount, and controlled-value rejection.
- Registration ref callbacks do not depend on a context value that changes with the state they feed.
