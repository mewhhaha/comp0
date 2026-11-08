# React Compiler Performance Review

`@comp0/react` and `@comp0/core` ship JavaScript compiled by the Rust React Compiler through `oxc-transform-react@0.148.0` before `tsgo` emits declarations. The reviewed baseline contains 256 compiled files, including all 210 files compiled by Babel. Run `pnpm test:compiler-conformance` and review `react-compiler-files.json` before changing the compiler pin. The native binding emits fallback code for recoverable bailouts and exposes fatal failures through `result.fatal`; it does not emit recoverable bailout messages.

Compiler configuration targets React 19 and does not depend on `react-compiler-runtime`. The initial rollout uses `panicThreshold: "none"` so functions the compiler cannot safely optimize are skipped instead of failing a package build.

Manual memoization should stay limited to semantic identity, effect dependencies, context provider fanout, or measured hot paths. The compiler is the default memoization layer for ordinary local values, callbacks, and render-prop state objects.

Known hot paths:

- Picker item text registries in `Select` and `Combobox` are ref-backed so mounting many visible options does not cause one parent state update per item.
- `ListBox` caches document-order sorting behind a registry version counter. Keyboard movement reuses the sorted order until an item registers, unregisters, or changes element metadata.
- Overlay roots keep their public state and native dialog/popover lifecycle reconciliation separate, avoiding render-time DOM reads.

React Compiler improves update performance by memoizing React work. It does not reduce DOM event dispatch cost, browser layout or paint work, or the cost of rendering very large DOM trees by itself. Those scenarios still need component-level structure, virtualization, or DOM-specific optimization when measurements justify it.

## DOM State and Roving Tab Stops

Parts render their DOM state; they do not write it after commit (see "DOM state" in `AGENTS.md`). The usual case for imperative syncing is "avoid a re-render", so this section records what both approaches actually cost. Run `pnpm bench` to reproduce: `packages/react/bench/roving-tab-stop.bench.tsx` uses only the public Tabs API, so checking out an older commit and rerunning it measures that implementation.

Numbers below are from headless Chromium running the development React build with the compiler on: 5 repeats after a warm-up, the median per mount, the mean of 10 presses per key press. Compare rows, not absolute times; production builds are several times faster.

| Scenario                             | Tabs | State + subscription: commits / render ms / wall ms | Imperative sync (PR #36): commits / render ms / wall ms |
| ------------------------------------ | ---: | --------------------------------------------------- | ------------------------------------------------------- |
| mount, first tab selected            |  100 | 1 / 3.8 / 4.7                                       | 1 / 4.2 / 7.4                                           |
| mount, first tab selected            | 1000 | 1 / 23.0 / 27.1                                     | 1 / 24.3 / 783.7                                        |
| mount, no tab selected               |  100 | 2 / 4.7 / 5.6                                       | 1 / 2.5 / 4.8                                           |
| mount, no tab selected               | 1000 | 2 / 45.8 / 56.0                                     | 1 / 21.7 / 747.4                                        |
| ArrowRight, selection follows        |  100 | 1 / 1.8 / 2.4                                       | 1 / 1.8 / 8.4                                           |
| ArrowRight, selection follows        | 1000 | 1 / 12.8 / 17.7                                     | 1 / 17.1 / 535.7                                        |
| ArrowRight, controlled value rejects |  100 | 1 / 2.2 / 3.0                                       | 0 / 0 / 0.1                                             |
| ArrowRight, controlled value rejects | 1000 | 1 / 12.7 / 17.0                                     | 0 / 0 / 0.5                                             |

What the numbers say:

- **Imperative sync hides its cost from React.** Render time is about equal, but the imperative version's wall time grows quadratically: every `Tab` ran a layout effect that walked the whole collection, so one commit did O(n²) DOM work. Profiler time never shows it; only wall time does.
- **Fallback stops cost one extra commit.** With no valid selection, the first enabled tab is only known once tabs register after commit, so the subscription renders once more. That is linear and stays small.
- **Imperative sync wins when only focus moves.** When a controlled `value` rejects an arrow move, the imperative version moves `tabindex` without rendering, while the state version re-renders every tab because the stop lives in context. At 1000 tabs that is 17 ms against 0.5 ms. For tab lists this does not matter; a large grid that needs it should give each item its own subscription to "am I the stop?", so only the old and new stop render, rather than writing the DOM.
- **A subscription is only linear if registration is stable.** In an early version, `Tab`'s registration ref callback read `collection` from the context object, so the React Compiler made it depend on the whole context. Every stop move re-registered every tab, and each registration notified the subscription, which recomputed the snapshot: 4.1 s per arrow press and 4.3 s to mount 1000 tabs. Reading `collection` outside the callback fixed it, and the unit test "moves the stop in one commit without re-registering every tab" keeps it fixed.
