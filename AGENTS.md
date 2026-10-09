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

State props: a root's primary state is `value`/`defaultValue`/`onChange(next)`; show/hide state is `open`/`defaultOpen`/`onOpenChange(next)`. Never name a state callback `onToggle`: that is the native `ToggleEvent` handler of the `popover`, `<details>`, and `<dialog>` elements overlays render, and it stays available on the `as` element. Checkable inputs keep the DOM-native `checked`; ToggleButton keeps `selected`. Collection items are identified by a required `value`; `MenuItem` is the one exception, because menu items are commands rather than selectable data.

Triggers that open a surface get their `id`, `aria-expanded`, `aria-controls`, `aria-haspopup`, `data-open`, and toggle-on-click from `useDisclosureTrigger` (`internal/disclosure-trigger.ts`); `disabledProps` (`internal/disabled.ts`) handles `disabled` on native buttons versus `aria-disabled` plus blocked activation everywhere else. Popover surfaces go through `useOverlaySurface` (`internal/overlay/`), including `initialFocus` for what receives focus on open.

Errors: `throw` only for programmer errors that make rendering impossible (a part outside its provider, `as={Fragment}` without exactly one child, duplicate collection values). Runtime data (chart values, tour steps, connections, layouts, limits) is validated with `warnOnce` from `internal/dev.ts`, which only reports in development, and the component falls back safely in production (skip the invalid entry, clamp, or render an accessible empty state).

Streaming: content may arrive progressively inside a `BusyRegion` (or `Messages busy`). Parts validate runtime data with `useWarnOnce()` from `internal/dev.ts` (pure builders take a `Warn` as their first argument), which stays silent while `useBusy()` is true and reports once the region settles. Nothing moves focus on its own while busy: guard programmatic `.focus()` and `showModal()` that are not a direct response to user input with `mayMoveFocus(busy)` from `internal/busy.ts`. `streaming.composition.test.tsx` and `chart/chart.streaming.test.tsx` hold the cross-family contract.

Naming: overlay roots (Dialog, AlertDialog, Drawer, Popover, Tooltip, Preview, Tour) call their surface `<Root>Content`; controls that own a popup (Select, Combobox, Menu, ColorPicker, DatePicker, DateRangePicker, MentionField) call it `<Root>Popover`. Option containers use HTML vocabulary (`*Option`, `*OptGroup`), menus use ARIA (`MenuItem`, `MenuGroup`). Buttons that dismiss a surface are `*Close`; buttons that clear a value are `*Clear`. Every chart is `<Name>Chart`.

Prefer data-driven styling hooks. `className` is always a string; there are no state render props. A function `children` is only for mapping data the consumer cannot otherwise reach (chart marks, legend items, pagination pages). State attributes mirror the ARIA state they reflect (`data-selected`, `data-checked`, `data-current`, `data-open`, `data-active` for the active descendant) plus the interaction attributes (`data-focused`, `data-focus-visible`, `data-hovered`, `data-pressed`, `data-disabled`). For boolean data attributes, use presence semantics through `dataAttr(value)` instead of serializing `true` or `false`, so styles can target attribute existence. The global `data-*` vocabulary (`data-slot`, the `data-value`/`data-label` identity pair, the ARIA mirrors, and the interaction attributes) lives in `packages/react/data-attributes.json`; any other `data-*` attribute a family emits must be documented in that family's docs entry `stateHooks`. `apps/docs/src/content/data-attributes.test.ts` scans each family folder and fails on undocumented attributes.

Avoid nested ternaries. Avoid long ternaries, especially ternaries that span more than three lines. Ternaries should usually fit on one line; prefer `let` bindings and `if` statements when the condition or branches need more room.

Do not break class name expressions out into separate variables just to shorten JSX. Keep class names in the `className` statement.

`pnpm lint` enforces these conventions through the project plugin in `scripts/oxlint-comp0.ts` (props placement, compact ternaries, inline class names, memo justification comments, presence data attributes, no synthetic test events) plus oxlint's `no-nested-ternary` and `consistent-type-definitions`. Fix the code rather than disabling a rule; add a rule there when a new convention can be checked mechanically. `pnpm test:compiler-conformance` fails when a component file is not compiled by the React Compiler (exceptions need a reason in `packages/react/react-compiler-exceptions.json`); regenerate the dist baseline with `pnpm compiler:baseline`.

## Intelligent UI (`@comp0/genui`)

`packages/genui` makes comp0 composable by models. A model writes one JSON tree (`{ "type": "Select", "label": ..., "options": [...] }`, containers take `children`); `parsePartialJson` renders any prefix of it, `validateResponse` sanitizes it against the catalog, and `GenUI` renders it inside `BusyRegion` so the streaming contract above applies. `catalog` is the model-facing API: Zod schemas are the single source of the validator, `responseJsonSchema` (with a strict structured-output variant), and `genuiPrompt`. There is no third-party runtime; the parser, store, expression evaluator, and renderer are ours. `@comp0/react` never imports it; new general-purpose primitives belong in `@comp0/react` and only get a facade here.

- Facades are accessible by schema: every interactive or data facade requires its accessible name (label, visible button text, chart title, table caption, image alt). No icon-only facades. A node missing a required prop is withheld, not drawn nameless.
- Facades destructure exactly their schema's props and never spread model output onto elements; the validator drops undeclared props and URLs go through `url()` schemas and `safeHref`/`safeImageSrc`. No prop may be named `type`: it is the discriminator.
- Props stream partially (cut strings, partial arrays, props not yet written); a facade must render something sensible from any prefix of its props. Nodes are keyed by JSON Pointer, so already drawn components never remount.
- Errors are collected once, after streaming, as structured `GenUIError`s (path, code, message) a host can send back to the model; nothing is reported for a prefix.
- Form values and bindings live in the external store (`createGenUIStore`) read with `useSyncExternalStore`, so the React Compiler memoizes every facade and there is no compiler exception. Never read the store through a getter during render.
- Computed values go through the whitelisted evaluator (`parseExpression`/`evaluateExpression`); never add `eval`, `Function`, property access, or an unlisted function.
- `genui.prompt.md` is generated from the catalog; run `pnpm --filter @comp0/genui prompt` after catalog changes (a test fails when it is stale; it is excluded from oxfmt because its exact bytes are the prompt).
- Marker schemas (`nodes`, `bindable`, `computed`, `url`) are identified by the schema definition object, so `.describe()` and `.optional()` keep them.

## Tests

Interact through `setup(ui)` from `packages/react/test/render.tsx`, which returns the render result plus a userEvent `user`. Use `fireClick`/`fireKeyDown` only for events userEvent cannot express, with an `oxlint-disable-next-line comp0/no-synthetic-events` comment that says why. The docs axe test only sees each example's initial render, so browser tests that open, expand, or activate a part also call `expectNoAxeViolations` from `packages/react/test/axe.ts` in that state. Pure modules (layout math, table models, ordering) get direct unit tests. `pnpm verify` runs the full local check set.

## Docs Component Pages

Every page under `/components/<slug>` renders from one entry file, `apps/docs/src/content/components/<slug>.ts`, which default-exports `component({...})` from `define.ts`: lesson copy, accessibility notes, parts (`p()`/`prop()`), keyboard, state hooks, form notes, and related links all live in that one file. There are no per-component route files. `routes/components/route.tsx` lays out the fixed section order (Example, Anatomy, Step by step, Keyboard, Forms and accessibility, API reference) from the entry's fields. `catalog.ts` loads every entry and orders them through `groupOrder`.

The live example lives in `apps/docs/src/examples/cases/<slug>.tsx` and must export `Example`. The raw file text is what the page displays as code (`sources.ts`), and the same module renders live (`registry.tsx`), so the displayed code cannot drift. Extra variants are `cases/<slug>.<id>.tsx` plus a `moreExamples` entry.

Adding a component page takes three edits: the entry file, the example, and its slug in `groupOrder`. `catalog.test.ts` enforces the invariants: unique slugs paired one-to-one with primary examples, file names matching slugs, every entry listed in exactly one group, resolvable `related` links, three lesson steps each, a registered example per variant, and that the example imports across all entries cover the public API exactly. `props.test.ts` checks the API tables against the component types: every documented prop must exist, and every own (non-DOM) prop must be documented (`DOCS_PROPS_SLUGS=select,menu` narrows it). Run both after docs edits.

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
