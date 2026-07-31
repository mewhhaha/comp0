# AGENTS.md

## Project Posture

This is a greenfield headless React component library. Prefer the cleanest native-feeling API over compatibility layers. Breaking changes are encouraged when they remove legacy aliases, clarify component contracts, or make the public API more DOM-native.

Do not preserve old prop names as compatibility aliases unless the user explicitly asks for backwards compatibility.

## React Compiler

Assume the React Compiler everywhere: the package build, the docs app, and both vitest projects run the Rust port through the exactly pinned `oxc-transform@0.135.0`. Version 0.136.0 stopped emitting fallback code for this repo's expected compiler bailouts, and the Node API was removed after that release. Do not bump it without rerunning the Babel-versus-oxc conformance comparison and updating the compiled-file smoke baseline. Let the compiler memoize ordinary local values and callbacks. Keep explicit `useMemo`/`useCallback` only when semantic identity is part of the behavior, an effect dependency would loop after a compiler bailout, context fanout requires it, or measurements justify it; explain the constraint in a comment.

## Component API and Styling

Prefer children-driven composition for components. Expose DOM-similar props and behavior wherever possible, and keep custom component contracts close to the native element or ARIA pattern they model.

Prefer data-driven styling hooks. For boolean data attributes, use presence semantics such as `value || undefined` instead of serializing `true` or `false`, so styles can target attribute existence.

Avoid nested ternaries. Avoid long ternaries, especially ternaries that span more than three lines. Ternaries should usually fit on one line; prefer `let` bindings and `if` statements when the condition or branches need more room.

Do not break class name expressions out into separate variables just to shorten JSX. Keep class names in the `className` statement.

Co-locate a component's props type immediately above the component. Name it after the component with a `Props` suffix, such as `TableProps`. Prefer `type` over `interface` for component props.

## Docs Component Pages

Every page under `/components/<slug>` renders from one `ComponentDoc` entry in `apps/docs/src/content/catalog.ts`; there are no per-component route files. `routes/components/route.tsx` lays out the fixed section order (Example, Anatomy, Step by step, Keyboard, Forms and accessibility, API reference) from that entry's fields. To add or change a page, edit the catalog entry — `common()` assembles it, `p()`/`prop()` build parts, and the `lessons`/`accessibility` maps hold the prose keyed by slug.

The live example lives in `apps/docs/src/examples/cases/<slug>.tsx` and must export `Example`. The raw file text is what the page displays as code (`sources.ts`), and the same module renders live (`registry.tsx`), so the displayed code cannot drift. Extra variants are `cases/<slug>.<id>.tsx` plus a `moreExamples` entry.

`catalog.test.ts` enforces the invariants: exact component count, unique slugs, resolvable `related` links, three lesson steps each, a registered example per slug and variant, and that the example imports across all entries cover the public API exactly. Run it after catalog edits.

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
