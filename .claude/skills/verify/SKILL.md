---
name: verify
description: Verify a comp0 change before committing it, by running the cheap checks and then the docs build with the WCAG 2.2 AA sweep and the suites for the touched families. Use before every commit or pull request.
---

# Verify a comp0 change

Run this before committing. Cheap checks first, then the change running for real in a browser.
Stop and ask a person when a check still fails after three rounds of fixes.

## 1. Cheap checks

```sh
pnpm format:check && pnpm lint && pnpm typecheck
pnpm test                      # jsdom: composition, screen-reader, property tests
```

Judge `pnpm typecheck` by its exit code.

## 2. Suites for what the diff touches

| The diff touches                                     | Run                                                                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| A family in `packages/react/src/<family>/`           | `pnpm exec vitest run packages/react/src/<family>` (both projects)                                                                     |
| Focus, roving tab stops, keyboard handlers           | `pnpm exec vitest run packages/react/src/keyboard.property.test.tsx` and `pnpm test:browser`                                           |
| Overlays, popovers, dialogs                          | `pnpm exec vitest run --project browser packages/react/src/overlay.browser.test.tsx packages/react/src/overlay-focus.browser.test.tsx` |
| What a screen reader announces                       | the family's `*.screen-reader.test.tsx`, or add one                                                                                    |
| A docs example, docs styles, or any component markup | step 3                                                                                                                                 |

## 3. Run the docs build and the WCAG 2.2 AA sweep

```sh
pnpm --filter @comp0/docs build
pnpm test:wcag                 # every /components/<slug> page, in Chromium, Firefox and WebKit
pnpm test:wcag --project chromium   # a quick run in one engine
```

`pnpm test:e2e` and `pnpm test:wcag` run every Playwright project; add `--project chromium` (or
`firefox`, `webkit`) for a quick local run, then run all three before the pull request. Install
the engines once with `pnpm exec playwright install chromium firefox webkit`.

The sweep fails on two kinds of difference from `e2e/wcag-baseline/<slug>.json`:

- **New findings**: a regression. Fix the component or the example. Do not add it to the baseline.
- **Fixed findings still listed**: good news. Run `pnpm test:wcag:baseline` and commit the
  smaller baseline file with the fix. It updates Chromium's shared file first, then keeps a
  `<slug>.<browser>.json` only for a browser whose findings differ. It is the only supported
  way to update baselines: Firefox and WebKit compare against the shared file, so they run only
  after the Chromium half succeeded. Setting `WCAG_BASELINE=update` by hand across all projects
  at once races, with a browser reading the shared file while Chromium writes it.

Then open the changed page with `pnpm dev` and use it with the keyboard alone: Tab in and out,
operate it, open and close any surface, and check focus never gets lost. Automated
checks cover roughly a third of WCAG; `ACCESSIBILITY.md` lists the criteria that still need a
person.

## 4. Before the pull request

`pnpm verify` runs everything CI runs. In the PR description, say which of the steps above ran.

## Flaky checks

Do not add sleeps, retries, or `test.skip` to get a check green. Find the cause; if you cannot,
delete the check and write down why in the PR.
