# CONTINUE

Handoff notes for the next session. Conventions live in AGENTS.md; this file is about where the work stands.

## Where things stand

Three rounds of "hills" are on `main` (rounds 1 and 2 landed together in #35):

1. Restructure: family folders, shared primitives in `@comp0/core`, one polymorphism/context/state model, docs entry files, project lint plugin.
2. Hardening: typed parts, every component compiled by the React Compiler, `onOpenChange`, dev-only data warnings instead of render-time throws, shared trigger/disabled/overlay helpers, docs prop and data-attribute guards, axe in interactive states, userEvent-driven tests, Playwright Test e2e, parallel CI.
3. Intelligent UI (this push), modelled on OpenAI's Intelligent UI but with no third-party runtime (OpenUI was only a reference and is not a dependency):
   - `@comp0/react` gained `BusyRegion` (streaming contract: no warnings or focus moves while busy), `Output`, the `Comparison` table family, citations (`Citations`, `Sources`, `Source`, `Citation`), and conversation parts (`Message`, `Composer`, `Suggestions`, `Reasoning`, `Feedback`, `CopyButton`).
   - New package `@comp0/genui` (`packages/genui`): models write a JSON tree (`{ "type": "Select", ... }`, `children`, `{ "$bind" }`, `{ "$expr" }`); our own partial-JSON parser, validator with model-correctable errors, store, safe expression evaluator, `GenUI` renderer, `genuiPrompt`, `responseJsonSchema({ strict })`, generated `genui.prompt.md`, conformance suite and seeded fuzzer.
   - Docs: Intelligent UI learn page with a replayed-JSON demo, pages for every new component, generated `/llms.txt` and `/llms-full.txt`.

All checks passed before the push: `pnpm verify` set (format, lint, typecheck, 1638 unit + 89 browser tests, build, package check for core/react/genui, compiler conformance 328/328 with no exceptions, smoke, 4/4 e2e).

## Before the next release

- `@comp0/genui` has never been published. Configure npm trusted publishing for it (like core/react) and add `packages/genui/package.json` to the `paths` in `.github/workflows/release.yml`; otherwise the next core/react version bump will try to publish it and fail. Keep all three packages on the same version.
- Watch the first CI run of this push: the parallel CI layout, audit workflow and CI-gated release were never run locally.

## Known gaps and candidate next hills

- `parsePartialJson` re-parses the whole response on every chunk (O(n²) over a stream); fine at realistic sizes, worth an incremental parser if answers get large.
- Overlay `initialFocus` matches `[autofocus]`, which React's `autoFocus` prop does not render; `<input autoFocus>` inside a popover is not picked up.
- A citation to a missing source renders an inert labelled span (review the choice).
- Conversation chrome (Message, Composer, Reasoning, Feedback) deliberately has no genui facade; revisit if models should compose it.
- No host-side tool/function calling in genui (queries, mutations); actions only produce a next-turn `message` with form `values`.
- `@comp0/genui` styling is data attributes only (`data-gap`, `data-columns`, `data-tone`); the docs app has the only theme (`[data-intelligent-ui]` in `apps/docs/src/styles.css`).

## Working notes

- This machine often runs other heavy projects (load average 60–150): check `uptime`, run builds and e2e in the background, and re-run Playwright timeouts before treating them as failures.
- Judge `pnpm typecheck` by exit code; tsgo colours its output, so `grep "error TS"` counts nothing.
- `pnpm compiler:baseline` regenerates `packages/react/react-compiler-files.json` after changes that add or remove compiled files.
- `pnpm --filter @comp0/genui prompt` regenerates `genui.prompt.md` after catalog changes.
