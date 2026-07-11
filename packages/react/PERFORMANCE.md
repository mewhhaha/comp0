# React Compiler Performance Review

`@comp0/react` ships JavaScript compiled with React Compiler. The package build runs Babel over `src` with `babel-plugin-react-compiler` before `tsgo` emits declarations. `@comp0/core` is compiled the same way because it provides hook-bearing runtime helpers used by the React package.

Compiler configuration targets React 19 and does not depend on `react-compiler-runtime`. The initial rollout uses `panicThreshold: "none"` so functions the compiler cannot safely optimize are skipped instead of failing a package build.

Manual memoization should stay limited to semantic identity, effect dependencies, context provider fanout, or measured hot paths. The compiler is the default memoization layer for ordinary local values, callbacks, and render-prop state objects.

Known hot paths:

- Picker item text registries in `Select` and `Combobox` are ref-backed so mounting many visible options does not cause one parent state update per item.
- `ListBox` caches document-order sorting behind a registry version counter. Keyboard movement reuses the sorted order until an item registers, unregisters, or changes element metadata.
- Overlay roots keep their public state and native dialog/popover lifecycle reconciliation separate, avoiding render-time DOM reads.

React Compiler improves update performance by memoizing React work. It does not reduce DOM event dispatch cost, browser layout or paint work, or the cost of rendering very large DOM trees by itself. Those scenarios still need component-level structure, virtualization, or DOM-specific optimization when measurements justify it.
