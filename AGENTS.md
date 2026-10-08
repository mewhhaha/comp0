# AGENTS.md

## Project Posture

This is a greenfield headless React component library. Prefer the cleanest native-feeling API over compatibility layers. Breaking changes are encouraged when they remove legacy aliases, clarify component contracts, or make the public API more DOM-native.

Do not preserve old prop names as compatibility aliases unless the user explicitly asks for backwards compatibility.

## React Compiler

The package build and client Vite environments use the exactly pinned `oxc-transform-react@0.148.0`. The docs app and both Vitest projects enable it through `@vitejs/plugin-react` with `compiler: true`; the plugin leaves server environments uncompiled. Before updating the compiler, run `pnpm test:compiler-conformance` and review the per-file baseline in `packages/react/react-compiler-files.json`. Let the compiler memoize ordinary local values and callbacks. Keep explicit `useMemo`/`useCallback` only when semantic identity is part of the behavior, an effect dependency would loop after a compiler bailout, context fanout requires it, or measurements justify it; explain the constraint in a comment.

## Package Layout

`packages/react/src/<family>/` holds one component family per folder, named after its docs slug, with an `index.ts` that re-exports only files in that folder. `packages/react/src/index.ts` is nothing but `export * from "./<family>/index.js"` lines. Cross-family plumbing lives in `packages/react/src/internal/` and is never re-exported. Family suites sit next to their components; suites that exercise several families stay at the `src` root. `source-conventions.test.ts` enforces this layout.

`@comp0/core` holds the framework-level primitives every family builds on: `useControllableState` (value, setter, and `{ controlled, reset, restore }` for form reset), `mergeProps` (classes, styles, refs, and handlers where an earlier `preventDefault` stops later ones), `useCollection`/`useCollectionNavigation` (DOM-ordered item registry plus arrow/Home/End/typeahead resolution), and the interaction hooks. Use them instead of hand-rolling registries, sorting, key handling, or prop merging.

## Component API and Styling

Prefer children-driven composition for components. Expose DOM-similar props and behavior wherever possible, and keep custom component contracts close to the native element or ARIA pattern they model.

Props types: declare `export type XProps` directly above component `X`, built on `ComponentProps<"tag">` for the element the part renders, so `ref` is part of the props type. Use `type`, never `interface`.

Polymorphism goes through `internal/polymorphic.tsx`. Every part that renders an HTML element accepts `as` and renders as JSX through `const Part = partElement(as, "tag")`; `as={Fragment}` merges the part's props into its single child. Provider roots render no element by default: type them with `RootProps` so DOM props are only accepted together with `as`, and render `<Root>` from `const Root = rootElement(as)`. Keep both as JSX rather than wrapping props in a helper call, so the React Compiler can see refs and handlers as JSX attributes and keep compiling the component. Link-like parts take a generic `as` so router props such as `to` type-check.

Contexts come from `createRequiredContext(rootName)` in `internal/context.ts`, which names the missing provider in its error. Form-associated composites submit through `FormValue` (`internal/form-value.tsx`) instead of hand-written hidden inputs.

State props: a root's primary state is `value`/`defaultValue`/`onChange(next)`; show/hide state is `open`/`defaultOpen`/`onToggle(next)`. Checkable inputs keep the DOM-native `checked`; ToggleButton keeps `selected`. Collection items are identified by a required `value`.

Naming: overlay roots (Dialog, AlertDialog, Drawer, Popover, Tooltip, Preview, Tour) call their surface `<Root>Content`; controls that own a popup (Select, Combobox, Menu, ColorPicker, DatePicker, DateRangePicker, MentionField) call it `<Root>Popover`. Option containers use HTML vocabulary (`*Option`, `*OptGroup`), menus use ARIA (`MenuItem`, `MenuGroup`). Buttons that dismiss a surface are `*Close`; buttons that clear a value are `*Clear`. Every chart is `<Name>Chart`.

Prefer data-driven styling hooks. `className` is always a string; there are no state render props. A function `children` is only for mapping data the consumer cannot otherwise reach (chart marks, legend items, pagination pages). State attributes mirror the ARIA state they reflect (`data-selected`, `data-checked`, `data-current`, `data-open`, `data-active` for the active descendant) plus the interaction attributes (`data-focused`, `data-focus-visible`, `data-hovered`, `data-pressed`, `data-disabled`). For boolean data attributes, use presence semantics through `dataAttr(value)` instead of serializing `true` or `false`, so styles can target attribute existence.

Avoid nested ternaries. Avoid long ternaries, especially ternaries that span more than three lines. Ternaries should usually fit on one line; prefer `let` bindings and `if` statements when the condition or branches need more room.

Do not break class name expressions out into separate variables just to shorten JSX. Keep class names in the `className` statement.

`pnpm lint` enforces these conventions through the project plugin in `scripts/oxlint-comp0.ts` (props placement, compact ternaries, inline class names, memo justification comments, presence data attributes) plus oxlint's `no-nested-ternary` and `consistent-type-definitions`. Fix the code rather than disabling a rule; add a rule there when a new convention can be checked mechanically.

## Docs Component Pages

Every page under `/components/<slug>` renders from one entry file, `apps/docs/src/content/components/<slug>.ts`, which default-exports `component({...})` from `define.ts`: lesson copy, accessibility notes, parts (`p()`/`prop()`), keyboard, state hooks, form notes, and related links all live in that one file. There are no per-component route files. `routes/components/route.tsx` lays out the fixed section order (Example, Anatomy, Step by step, Keyboard, Forms and accessibility, API reference) from the entry's fields. `catalog.ts` loads every entry and orders them through `groupOrder`.

The live example lives in `apps/docs/src/examples/cases/<slug>.tsx` and must export `Example`. The raw file text is what the page displays as code (`sources.ts`), and the same module renders live (`registry.tsx`), so the displayed code cannot drift. Extra variants are `cases/<slug>.<id>.tsx` plus a `moreExamples` entry.

Adding a component page takes three edits: the entry file, the example, and its slug in `groupOrder`. `catalog.test.ts` enforces the invariants: unique slugs paired one-to-one with primary examples, file names matching slugs, every entry listed in exactly one group, resolvable `related` links, three lesson steps each, a registered example per variant, and that the example imports across all entries cover the public API exactly. Run it after docs edits.

## Anatomy Diagrams

The anatomy wireframe is generated, not drawn: `parseParts` in `apps/docs/src/components/teaching/Anatomy.tsx` turns the ordered `parts` array into a diagram, so part order, `kind`, and `ownsDom` are a small layout language. Order parts the way the DOM nests.

- `root` with `ownsDom: false` — dashed provider frame around everything after it. Use for context-only wrappers (`TextField`, `Select`, `Menu`).
- `root` with `ownsDom: true` — solid container frame. It wraps the run of `item` parts that directly follow it (`TabList`, `TableBody`), or everything after it when no items follow.
- `label`, `feedback`, `value` — small leaves: plain text, dotted note, chip. A `value` directly after a `trigger` is absorbed into the trigger's button.
- `input` — a form control drawn from the part name (search, textarea, checkbox, switch, slider). A `trigger` directly after an `input` joins it in one row (`SearchFieldClear`, `DatePickerTrigger`).
- `trigger` — a button. Names matching clear/close/dismiss, previous/back, next/forward, play/pause, drag/handle, or resize render as small icon buttons; consecutive triggers sit together in one row (`CarouselPrevious`/`CarouselNext`). A trigger gets a dropdown chevron when items or an inline region follow it, and a wide silhouette when a floating panel follows.
- `content` — a floating overlay panel with a dashed drop connector that consumes every later part. Only use it for parts that truly float: popovers, dialogs, tooltips, toasts.
- `region` — an inline surface that wraps the run of `item`/`input` parts directly after it. Use it for content that stays in the page flow: viewports, tracks, tab and accordion panels, calendar grids.
- `graphic` — a data graphic drawn from the part name. Bar, pie, line, and area graphics render their corresponding silhouettes, and consecutive graphics share one row.
- `table` — a compact data table silhouette for a single part that owns the whole native table.
- `item` — a repeated collection sketch, shaped by name: radios, tab/button chips, breadcrumbs, slides, calendar or table cells, generic rows.

The wireframe failing to look like the component is a data bug before it is a parser bug: fix the entry's kinds and order first, and only extend `Anatomy.tsx` when the vocabulary genuinely lacks the shape. After editing parts, open the page and confirm the sketch reads as the component at a glance.
