# Task: Migrate the docs app to React Router RSC and split server/client components

Hand-off plan. Written for an agent with no prior context on this repo. Read `AGENTS.md` first. The docs app lives in `apps/docs` (React Router framework mode, currently **SPA mode** — `ssr: false`; builds print "SPA Mode: Generated build/client/index.html").

## Goal

Move `apps/docs` to React Router's RSC Framework Mode and split the docs into server components (static content rendering) and client components (interactive shell + live examples), so the ~1600-line content catalog and the syntax highlighter stop shipping to the browser.

## Research findings (July 2026)

- RSC Framework Mode shipped as a **preview** in React Router v7.9.2+: a new Vite plugin exported as `unstable_reactRouterRSC` (replaces `reactRouter()` from `@react-router/dev/vite`), with a peer dependency on the experimental **`@vitejs/plugin-rsc`**. Docs: https://reactrouter.com/how-to/react-server-components and https://remix.run/blog/rsc-framework-mode-preview
- Reference template: `npx create-react-router@latest --template remix-run/react-router-templates/unstable_rsc-framework-mode` — scaffold it in a scratch dir and crib the exact plugin wiring, entry files, and package versions rather than guessing.
- **Gating limitation**: the initial RSC preview supports server-rendered apps only. **SPA mode and pre-rendering are not yet supported.** This repo's docs app is SPA mode today.
- The stated direction is that framework mode will eventually be built on RSC with a seamless transition, so none of the current route/module structure is throwaway.

## Decision point 0 (resolve before writing code)

The docs app must become server-rendered (or the task waits). Check the current React Router version in `apps/docs/package.json` and the changelog for whether SPA/pre-render support landed since this plan was written. Then pick one:

- **A. Server-rendered deployment** — flip to SSR and accept that deploys need a Node (or workers) runtime instead of static hosting. Check how the docs are currently deployed before choosing (nothing in-repo documents a deploy target; ask the repo owner if unclear — the answer changes hosting).
- **B. Pre-rendering landed upstream** — if RSC pre-rendering shipped by the time you start, use it: the docs are fully static content and pre-rendering all catalog routes keeps static hosting.
- **C. Neither acceptable** — stop; report that the migration is blocked on upstream SPA/prerender support.

## Repo-specific context you must know

- Routing: `apps/docs/src/routes.ts` defines 4 routes (`_index`, `learn/:slug`, `components` index, `components/:slug`). Route components live in `apps/docs/src/routes/*/route.tsx`. Content is pure data in `apps/docs/src/content/` (catalog.ts is ~1600 lines of literals; `catalog.test.ts` pins invariants).
- Examples: `apps/docs/src/examples/cases/<slug>.tsx` — each is BOTH a live-rendered component and its own displayed source (loaded eagerly via `import.meta.glob` with `?raw` in `apps/docs/src/examples/registry.tsx`). These are inherently client components (they render interactive comp0 widgets).
- Shell (`apps/docs/src/components/shell/`): CommandPalette (Cmd+K, comp0 Dialog+Combobox), DocsHeader/DocsNavigation/MobileNavigation, ToastProvider/ToastRegion and a SkipLink in DocsShell, a document-level hotkey listener. All interactive → client.
- Teaching components (`apps/docs/src/components/teaching/`): mostly static renderers (ApiReference, KeyboardGuide, StateHooks, StepList, PageIntro, Anatomy, Callout) — ideal server components. Interactive exceptions: `CodeBlock.tsx` (copy button + `useToast`), `LessonPager.tsx` (comp0 Link is fine in server markup only if it renders a plain anchor — it attaches handlers, so treat as client), `LiveExample.tsx` (hosts the example components).
- `syntax-highlighter.ts` (shiki) is a prime server-only win — today it ships client-side.
- The React Compiler runs over docs sources via the repo-root `react-compiler-vite.ts` plugin registered in `apps/docs/vite.config.ts` (see tasks/01 — the compiler pipeline may be oxc-based by the time you do this). The compiler only matters for CLIENT components; ensure the plugin (or its successor) doesn't corrupt "use server"/"use client" directives — directives must survive the transform (verify early, it's the likeliest integration bug).
- Vitest: docs browser tests live in `apps/docs/src/**/*.browser.test.tsx` (CommandPalette, CodeBlock, examples). They render client components directly — they should keep working, but anything converted to a server component can no longer be rendered by the browser test harness; test server components via the built output or unit-test their pure logic instead.
- comp0 components are client components by nature (context + effects). The library needs no changes, but every usage site in server files needs the file (or an island wrapper) marked `"use client"`.

## Plan

### Step 1 — Scaffold and study (no repo changes)

Scaffold the official RSC template in a scratch directory. Record: exact `react-router`/`@vitejs/plugin-rsc`/`vite` versions, `vite.config` plugin list and ordering, entry files (`entry.browser`/`entry.rsc`/`entry.ssr` or equivalents), how `routes.ts` changes, and how `"use client"` boundaries are bundled. Copy versions into `apps/docs/package.json` — do not mix-and-match newer/older.

### Step 2 — Mechanical migration to RSC framework mode (everything still client)

- Swap `reactRouter()` for `unstable_reactRouterRSC()` + `@vitejs/plugin-rsc` in `apps/docs/vite.config.ts` (keep tailwindcss and the compiler plugin; fix ordering per template).
- Add the template's entry files; adjust `react-router.config.ts` (ssr true per Decision 0A, or prerender config per 0B).
- Mark ALL existing route modules and shared components `"use client"` as a starting point so behavior is unchanged, and get the app booting: `pnpm dev` renders all four route types; `pnpm --filter @comp0/docs build` succeeds.
- Gate: existing browser tests green; CI green. Commit this as its own PR-sized checkpoint.

### Step 3 — Draw the server/client boundary

Convert top-down, removing `"use client"` where possible:

- Server: route modules for `components/:slug`, `learn/:slug`, indexes; content module imports (catalog/learn data never serialize to the client — pass only the already-rendered tree or minimal props across the boundary); ApiReference, KeyboardGuide, StateHooks, StepList, PageIntro, Anatomy, Callout; shiki highlighting moves into the server CodeBlock rendering path (highlight on the server, pass HTML/hast to a small client copy-button wrapper).
- Client (`"use client"` files): the whole shell (CommandPalette + hotkey + Toast + nav), LiveExample + the examples registry (`import.meta.glob` of interactive cases), CodeBlock's copy button (thin client leaf around server-rendered highlighted code), LessonPager (or render comp0 Link only inside client leaves).
- CommandPalette data: it imports the full catalog for search. Keep that working by passing a serializable slim index (slug/title/group for 47 components + 6 learn docs) from a server component into the client palette — do not drag catalog.ts across the boundary.
- Gate after each conversion: `pnpm dev` manual pass (all 4 route types, palette, copy toast, mobile nav), build, browser tests.

### Step 4 — Measure and lock in

- Compare client bundle size before/after (build output); the catalog + shiki should be gone from the client graph. Record numbers in the PR.
- Add a small test or build assertion that `content/catalog.ts` is not in the client bundle (e.g. grep the built client assets for a distinctive catalog string).
- Update README (Development section) if dev/build/deploy commands changed; note the RSC-preview pin and upgrade caveats.

## Risks / fallbacks

- **Preview-grade APIs**: `unstable_reactRouterRSC` + `@vitejs/plugin-rsc` are explicitly unstable — pin exact versions; expect breaking renames on upgrade. Keep Step 2 as a separate commit so Step 3 can be reverted independently.
- **Compiler × directives**: the repo's compiler Vite plugin transforms docs sources; verify `"use client"` directives survive (Step 2 gate). If tasks/01 (oxc compiler) hasn't landed, coordinate — doing Step 2 on the Babel plugin and re-verifying after the oxc swap is fine.
- **Browser tests of server components**: converted components disappear from the client harness. Do not force them back to client for testability; assert their output via route-level tests or leave coverage to the existing catalog invariants.
- **SPA-mode blocker resurfaces** (Decision 0): if server rendering is unacceptable for hosting and pre-render hasn't landed, park after Step 1 with findings.

## Out of scope

- Any change to `packages/` (the library stays client-side headless components).
- Deploy infrastructure changes beyond documenting what the new build needs.
- RSC-ifying the example cases themselves (they are interactive by definition).

## Definition of done

Docs app builds and runs on RSC framework mode (pinned preview versions) with the content catalog and syntax highlighter server-only, the interactive shell/examples as client islands, a recorded client-bundle reduction, all four route types verified manually, browser tests + full CI green, and the boundary documented in the PR description.
