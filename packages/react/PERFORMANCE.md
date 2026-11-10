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
- **Tabs has since moved to the per-item store.** The "State + subscription" column above is the stop in React state and context. With `useTabStopStore` a rejected arrow re-renders only the two tabs whose answer flips: 1 commit / 0.40 ms render / 1.95 ms wall at 1000 tabs, measured later on a slower machine where "selection follows" took 38.5 ms wall, so compare it with the 17.0 ms above only as an order of magnitude.

### Menubar, ListBox, and GridList

`packages/react/bench/collection-tab-stop.bench.tsx` measures the same move for the three collections that render their own items, again through the public API only. Same setup as above; mount rows are the median per mount, arrow rows the mean of 10 presses from a focused first item. Both columns were measured in one session with the same `measure.tsx` (see "Measuring the development build" below). All three use `useTabStopStore`; each family's rows were re-measured together after its switch.

| Family   | Scenario            | Items | Rendered stop: commits / render ms / wall ms | Imperative sync: commits / render ms / wall ms |
| -------- | ------------------- | ----: | -------------------------------------------- | ---------------------------------------------- |
| Menubar  | mount               |   100 | 2 / 8.3 / 9.3                                | 1 / 8.2 / 10.1                                 |
| Menubar  | mount               |  1000 | 2 / 70.8 / 79.7                              | 1 / 68.2 / 607.8                               |
| Menubar  | ArrowRight          |    10 | 1 / 0.04 / 0.11                              | 0 / 0 / 0.05                                   |
| Menubar  | ArrowRight          |  1000 | 1 / 0.15 / 0.85                              | 0 / 0 / 0.5                                    |
| ListBox  | mount, selected     |  1000 | 1 / 20.8 / 23.2                              | 1 / 20.4 / 22.3                                |
| ListBox  | mount, no selection |  1000 | 2 / 20.4 / 24.4                              | 3 / 41.4 / 49.5                                |
| ListBox  | ArrowDown           |  1000 | 1 / 15.2 / 19.2                              | 2 / 14.3 / 18.2                                |
| GridList | mount, selected     |  1000 | 1 / 52.1 / 55.2                              | 1 / 45.9 / 50.2                                |
| GridList | mount, no selection |  1000 | 2 / 51.7 / 57.1                              | 3 / 80.0 / 93.0                                |
| GridList | ArrowDown           |  1000 | 1 / 0.19 / 0.76                              | 1.1 / 27.8 / 35.5                              |

- **Menubar mount was quadratic.** Every trigger's layout effect walked the whole bar, so 1000 triggers took 0.6 s of wall time that Profiler never saw. The subscription is linear, at the cost of one extra commit: with no remembered item the stop is the first enabled trigger, known only after triggers register.
- **ListBox and GridList lose a commit and about half the unselected mount.** The `selected → activeKey` effects are gone, so an unselected mount is two commits instead of three, and the second re-renders only the item that becomes the stop (ListBox 49.5 → 24.4 ms, GridList 93.0 → 57.1 ms wall at 1000). A ListBox arrow press is one commit instead of two.
- **A moving stop re-renders only the items it moves between.** With the stop in React state and context, every trigger reads the context, so one ArrowRight re-rendered all of them: 24.5 ms wall at 1000 triggers and 0.29 ms at 10, with the React Compiler on. `useTabStopStore` keeps the stop outside React state and each trigger subscribes to `useIsTabStop`, a boolean, so a press re-renders the two triggers whose answer flips: 0.85 ms at 1000. The same narrowing makes the mount's second commit cheaper (108.6 → 79.7 ms wall at 1000). GridList arrows move focus only, so they gain the same way (34.0 ms with context → 0.76 ms at 1000 rows). Use it wherever many items read a value a key press moves.
- **ListBox arrows still re-render every option.** Selection follows focus, and every option reads the selected key from context to render `aria-selected`, so each press re-renders all of them whatever holds the stop: 18.6 ms with the stop in context, 19.2 ms with the store, 18.2 ms imperative, at 1000 options. Narrowing it would mean copying the controlled `value` into a store after commit, which the DOM state rules rule out.

### Collection pass against a root tab stop

With nothing selected, no item can hold the stop until one registers, which leaves server HTML without a tab stop. Two fixes were measured on ListBox: a collection pass, where the options are collected ahead of the real ones on the server and while hydrating (`internal/collection-pass.tsx`), and the root as the stop (`tabIndex={0}` on the listbox until an option registers, then `-1`). The pass was kept and rolled out to GridList and TabList, with Menubar triggers recording themselves in render order; the root stop was removed. In the development build the root stop also made the unselected mount walk the root's children in its second commit (45.5 to 54.4 ms wall at 1000 options). Both were built from the same entry as production bundles (React production build, React Compiler on, minified), the root-stop variant from the commit before the prototype. Hydration ran in headless Chromium through `pnpm bench`, timed from `hydrateRoot` until the list settled and laid out, variants alternating over 4 rounds; server render is `renderToString` in Node with `NODE_ENV=production`, 3 runs of 200 samples. Cells are the median with the range across rounds, in ms. The harness was a one-off and is not in the repo.

| Scenario                  | Options | Hydration, pass  | Hydration, root stop | Server, pass | Server, root stop |
| ------------------------- | ------: | ---------------- | -------------------- | ------------ | ----------------- |
| Nothing selected          |     100 | 1.3 (1.0–1.5)    | 1.4 (1.0–1.4)        | 0.37–0.48    | 0.32–0.35         |
| Nothing selected          |    1000 | 16.8 (12.5–18.0) | 15.2 (12.0–16.1)     | 3.6–5.1      | 3.5–3.8           |
| Selected option           |    1000 | 14.6 (10.3–15.0) | 12.8 (8.2–14.0)      | 3.9–5.3      | 2.8–4.3           |
| `value` matches no option |    1000 | 14.0 (12.5–17.7) | 16.6 (13.1–18.3)     | 4.1–5.2      | 4.0–4.3           |

- **The pass costs little in production.** Hydration differs by about a tenth at 1000 options, inside the spread between rounds, and not measurably at 100. Server render is up to about 1 ms slower at 1000. The 25–30% hydration cost first measured in jsdom with the development build does not carry over.
- **Only the pass is correct when the value matches no option.** Its server HTML has one tab stop in every scenario; the root-stop HTML has none in that one until hydration.
- **Unmounting a large ListBox is slow, and was before either variant.** `root.unmount()` in the production build takes about 2 ms at 100 options, 15–70 ms at 300, and 0.6 s (selected) to 1.9 s (nothing selected) at 1000, the same at the commit before the tab stop store. The cause is not yet investigated; no existing bench measures unmount.

### Measuring the development build

React's development build captures an owner stack (an `Error` plus `console.createTask`) for every JSX element, but only for the first 10,000 elements after a render that starts more than a second after the last reset. A 1000-row GridList mount creates about 3,000 elements, so whether a sample paid for stacks depended on how long the previous samples took: the same code measured 16 ms or 56 ms wall depending on what ran before it, which first looked like a 3× regression from `useTabStop`. `measure.tsx` now resets that counter before every measurement, so each sample costs what one fresh interaction would. Absolute numbers recorded before this change (the Tabs table above) may include samples that skipped stack capture; compare rows measured in the same session.
