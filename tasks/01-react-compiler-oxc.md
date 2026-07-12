# Task: Move the React Compiler from Babel to the oxc-native Rust port

Hand-off plan. Written for an agent with no prior context on this repo. Read `AGENTS.md` first — especially the React Compiler section: this codebase **assumes** the compiler in every pipeline and does not hand-memoize.

## Goal

Replace `babel-plugin-react-compiler` (and ideally the whole Babel toolchain) with the oxc-integrated Rust port of the React Compiler, in all three places the compiler currently runs:

1. Package builds (`packages/core`, `packages/react`) — currently `@babel/cli` + `babel.config.cjs`.
2. Vitest (both the `unit` and `browser` projects) — currently the custom Vite plugin `react-compiler-vite.ts` at the repo root.
3. The docs app dev/build (`apps/docs/vite.config.ts`) — same custom plugin.

## Research findings (July 2026)

- The React team is porting the compiler to Rust (react PR #36173, crates `react_compiler_oxc` / `react_compiler_swc`). It is **experimental** and unpublished upstream.
- Oxc vendors that port as releasable crates at `oxc-project/forked-react-compiler` and exposes it through **`oxc-transform`** (npm). Usage:

  ```js
  import { transform } from "oxc-transform";
  const result = await transform("App.tsx", code, {
    reactCompiler: { target: "19" }, // '17' | '18' | '19'; 19 uses react's built-in runtime
  });
  ```

  Docs: https://oxc.rs/docs/guide/usage/transformer/react-compiler.html

- A community proof (`eve0415/oxc-plugin-react-compiler`) reached 100% conformance with the Babel implementation before being retired in favor of the official port — good sign for parity, but the official port's conformance is NOT documented; verify empirically (step 3).
- Ordering constraint: the compiler must see JSX **before any other transform**. In Vite 8 (rolldown/oxc) this means the compiler must run in or before the oxc JSX transform, not after.
- Alternative (fallback) sanctioned path: `@vitejs/plugin-react` v6 + `@rolldown/plugin-babel` with the exported `reactCompilerPreset` — that still runs the Babel plugin, just efficiently scoped. Only use as fallback if `oxc-transform`'s output has conformance gaps.

## Repo-specific context you must know

- History: this repo previously upgraded to Babel 8 and the Babel compiler plugin **silently skipped most components** (Babel 8 AST incompatibility). It was pinned back to Babel 7 (see `babel.config.cjs`, `package.json` devDeps). Getting off Babel entirely is the point of this task.
- Known Babel-compiler bail-outs in this codebase (panicThreshold "none", silent skip): components that read registry refs during render (collection pattern: MenuPopover, TagGroup, etc.) and components that pass the `ref` prop through `mergeProps` (Button and most triggers). The Rust port may bail on the same sites or different ones — the smoke test only requires the five sentinel files to compile (see `packages/react/test/verify-react-compiler.mjs`).
- Correctness islands: a handful of `useMemo`/`useCallback` sites are deliberately kept because their identity feeds state-setting effect dependencies and the compiler bails on those components (grep for "bails out" comments, e.g. `useFieldFeedback` in `field-shared.tsx`, SelectPopover/ComboboxPopover contexts). These MUST keep working regardless of which compiler runs — do not remove them.
- `react-compiler-vite.ts` (repo root) is the shared Vite plugin used by `vitest.config.ts` (both projects) and `apps/docs/vite.config.ts`. It currently calls `@babel/core.transformAsync` with preset-typescript + preset-react + the compiler plugin, `enforce: "pre"`.
- The vitest browser project pre-bundles `react/compiler-runtime` via `optimizeDeps.include` (see comment in `vitest.config.ts`) — cold-cache dep discovery previously loaded two React copies. Whatever emits compiler output must keep emitting `react/compiler-runtime` imports (target "19"), or that include list needs updating.
- CI (`.github/workflows/ci.yml`) runs: format:check, lint, typecheck, test, test:browser, test:package, test:compiler-smoke. All must stay green.

## Plan

### Step 0 — Spike and conformance baseline (do this before committing to anything)

1. `pnpm add -D -w oxc-transform` (record the exact version; it is experimental — pin it).
2. Write a throwaway script that runs `oxc-transform` with `reactCompiler: { target: "19" }` over every file in `packages/react/src/components/` and `packages/core/src/`, and record per-file: compiled (emits `react/compiler-runtime`) vs skipped, and any errors.
3. Produce the same table for the current Babel pipeline (transform with `babel.config.cjs`) and diff them. Acceptance: the oxc port compiles **at least** the files Babel compiles today (the 5 smoke-test sentinels are the hard floor). If it compiles fewer, stop and file the findings; fall back to `reactCompilerPreset` or stay on Babel.
4. Check how `oxc-transform` handles TypeScript + JSX in one pass (it does TS stripping + JSX natively — confirm output is plain ESM JS suitable for `dist`).

### Step 1 — Swap `react-compiler-vite.ts` to oxc-transform

- Replace the `@babel/core.transformAsync` call with `oxc-transform`'s `transform` (same `enforce: "pre"`, same filter). Keep the sourcemap wiring (oxc returns maps; the previous Babel8→rolldown sourcemap type friction is documented in the file).
- Delete the preset-typescript/preset-react config — oxc handles both.
- Run: `pnpm test`, cold `pnpm test:browser` (`rm -rf node_modules/.vite` first, twice), and `pnpm --filter @comp0/docs build`.
- Watch for double-compilation: Vite 8's internal oxc transform also processes these files; verify the plugin's output isn't re-transformed in a way that breaks Fast Refresh in docs dev (`pnpm dev`, edit a component, confirm HMR).

### Step 2 — Swap the package builds off Babel

- Replace the `babel src ...` build scripts in `packages/core/package.json` and `packages/react/package.json` with a small Node script (e.g. `scripts/build-package.mjs`) that walks `src/`, calls `oxc-transform` per file with `reactCompiler`, and writes `dist/` (keep the `tsgo -p tsconfig.build.json` declaration step).
- Ensure output stays ESM with `.js` extensions matching the current import style, and that **dev-mode JSX (`jsxDEV`) is not emitted** in dist (the Babel pipeline had this latent issue; set production JSX explicitly).
- Run: `pnpm build`, `pnpm test:compiler-smoke`, `pnpm test:package`.
- Then remove `@babel/*` devDependencies, `babel-plugin-react-compiler`, and `babel.config.cjs` if nothing else uses them (grep first; the `.oxfmtignore`/lint globs don't reference them).

### Step 3 — Conformance gates and documentation

- Extend `packages/react/test/verify-react-compiler.mjs`: besides the 5 sentinels, assert the TOTAL count of dist files containing `react/compiler-runtime` does not drop below the Step 0 baseline (guards silent regressions when bumping `oxc-transform`).
- Update `AGENTS.md` (React Compiler section) and `README.md` (React Compiler section) to name the oxc pipeline and the pinned `oxc-transform` version, including the "experimental — pin and verify on bump" caveat.
- Full CI parity run locally (all seven steps), push, PR, watch CI.

## Risks / fallbacks

- **Experimental surface**: `oxc-transform`'s `reactCompiler` options may change between versions — pin exactly, document the bump procedure (rerun Step 0's diff).
- **Conformance gaps**: if the Rust port bails where Babel compiled (or vice versa), the "no hand memoization" assumption shifts. The correctness islands (kept `useCallback`s) cover the dangerous cases, but re-run the full unit+browser suites and specifically `picker.composition.test.tsx` / `collection-label.composition.test.tsx`, which caught a real bail-out-induced bug before.
- **Fallback**: `@vitejs/plugin-react@6` + `@rolldown/plugin-babel` + `reactCompilerPreset` (Babel plugin, rolldown-scoped) for the Vite pipelines, keeping `@babel/cli` for package builds. Ordering: the babel plugin must run BEFORE plugin-react's oxc JSX transform.

## Out of scope

- Fixing the refs-during-render bail-outs themselves (separate refactor task).
- swc integration.

## Definition of done

`oxc-transform` (pinned) is the only compiler in builds, vitest, and docs; Babel is gone from devDependencies; compiled-file count ≥ Babel baseline and enforced by the smoke test; all seven CI steps green; AGENTS.md/README updated.
