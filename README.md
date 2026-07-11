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
  Select,
  SelectContent,
  SelectOption,
  SelectTrigger,
  SelectValue,
} from "@comp0/react";

export function PlanSelect() {
  return (
    <Select name="plan" defaultValue="basic">
      <Label>Plan</Label>
      <SelectTrigger>
        <SelectValue placeholder="Choose a plan" />
      </SelectTrigger>
      <SelectContent>
        <SelectOption value="basic">Basic</SelectOption>
        <SelectOption value="pro">Pro</SelectOption>
      </SelectContent>
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
