# comp0

Headless React 19 components and behavior hooks with native-first DOM semantics, SSR-safe behavior, and no runtime implementation dependencies beyond React and React DOM.

comp0 is an internal alpha. Its API is intentionally small and breaking changes are preferred over compatibility aliases.

## Packages

- `@comp0/core` provides public React behavior hooks and DOM utilities without rendered components.
- `@comp0/react` provides children-composed components built on core.
- `@comp0/docs` is the local documentation and playground application.

Both public packages expose one root entry point. Component subpath imports are not supported.

```sh
pnpm add @comp0/core @comp0/react react react-dom
```

## Composition

Provider-only roots render their children directly. Explicit parts own DOM behavior and ARIA relationships:

```tsx
import {
  Label,
  Popover,
  Select,
  SelectPopover,
  SelectOption,
  SelectTrigger,
  SelectValue,
} from "@comp0/react";

export function PlanSelect() {
  return (
    <Select name="plan" defaultValue="basic">
      <Label>Plan</Label>
      <Popover>
        <SelectTrigger>
          <SelectValue placeholder="Choose a plan" />
        </SelectTrigger>
        <SelectPopover>
          <SelectOption value="basic">Basic</SelectOption>
          <SelectOption value="pro">Pro</SelectOption>
        </SelectPopover>
      </Popover>
    </Select>
  );
}
```

Use `as` when a provider root needs a real styling or layout wrapper:

```tsx
<Select as="div" className="select">
  {/* explicit parts */}
</Select>
```

Leaf inputs retain native React event handlers. Composite value owners use HTML-shaped `value`, `defaultValue`, `name`, and `onChange(nextValue)` props. Open-state roots use `open`, `defaultOpen`, and `onToggle(nextOpen)`. These state callbacks are documented as deliberate differences from native DOM event objects.

## Core hooks

`@comp0/core` includes controlled-state, collection registry, roving-focus, typeahead, focus-ring, hover, press, prop-merging, ref-composition, and presence-data-attribute utilities.

```tsx
import { dataAttr, usePress } from "@comp0/core";

export function PressSurface() {
  const { pressProps, isPressed } = usePress();
  return (
    <button {...pressProps} data-pressed={dataAttr(isPressed)}>
      Press
    </button>
  );
}
```

## React catalog

The graduated alpha surface covers:

- buttons, toggles, links, file triggers, and visually hidden content;
- text fields, search fields, checkbox/radio groups, switches, number fields, and sliders;
- accordion, disclosure, tabs, and breadcrumbs;
- listbox and menu collections;
- explicit Select and Combobox families;
- explicit Dialog, Popover, and Tooltip families.

Date/time, color, table/tree/grid, carousel, drag-and-drop, toast, transition, and parity-placeholder families were removed. They can return only after meeting the same behavior, accessibility, browser-test, documentation, and package-contract gates.

## React Compiler

comp0 assumes the [React Compiler](https://react.dev/learn/react-compiler). Component source contains no hand-written `useMemo`/`useCallback` memoization; the compiler inserts it at build time. The published `dist` output is already compiled, so apps consuming the packages from npm need nothing extra.

If you consume the package source directly (workspace alias, vendoring, or a monorepo), you must run the compiler yourself:

```sh
pnpm add -D oxc-transform@0.135.0
```

```ts
import { transform } from "oxc-transform";

const result = await transform(filename, source, {
  reactCompiler: { target: "19", panicThreshold: "none" },
  typescript: { onlyRemoveTypeImports: true },
  jsx: { runtime: "automatic", development: false },
});
```

The Rust compiler integration is experimental. Version 0.136.0 stopped emitting fallback code for expected compiler bailouts, and the Node API was removed after that release, so this repository pins 0.135.0 exactly and guards its Babel-era compiled-file count. Rerun the conformance comparison before changing the pin. In a Vite app, this repository's `react-compiler-vite.ts` shows the pre-transform wiring the docs app and test suites use. Installing the compiler in your own app is recommended regardless — your components get the same automatic memoization.

## Styling

comp0 ships behavior rather than CSS. Boolean data attributes use presence semantics:

```css
.button[data-hovered] {
  background: color-mix(in oklab, CanvasText 8%, Canvas);
}

.option[data-selected] {
  background: Highlight;
}
```

## Development

```sh
pnpm install
pnpm exec playwright install chromium
pnpm dev
```

Run the complete local verification set:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:browser
pnpm build
pnpm test:package
pnpm test:compiler-smoke
```

`test:package` packs both public packages, installs them in a temporary consumer, typechecks a composition, executes both roots, and verifies that undeclared subpaths are rejected.

### Docs RSC Worker

The docs app runs React Router RSC Framework Mode on Cloudflare Workers. Route content and Shiki highlighting are server components; the shell, live examples, copy button, previews, and lesson pager are client islands. The server passes only a slim navigation/search index into the shell.

The preview stack is pinned exactly in `apps/docs/package.json`: React Router 8.2.0, `@vitejs/plugin-react` 6.0.3, `@vitejs/plugin-rsc` 0.5.27, `@cloudflare/vite-plugin` 1.44.0, and Wrangler 4.110.0. These APIs are experimental, so upgrade them as one tested set and repeat the cold-cache, bundle-boundary, Worker preview, and browser checks.

```sh
pnpm dev
pnpm --filter @comp0/docs build
pnpm --filter @comp0/docs run preview
pnpm --filter @comp0/docs run deploy
```

The build checks that the catalog and Shiki do not enter client assets. Client JavaScript fell from the SPA baseline of 1,064,729 bytes to 600,577 bytes in the RSC build, a 43.6% reduction. The deployed Worker is [comp0-docs.horrible.workers.dev](https://comp0-docs.horrible.workers.dev).
