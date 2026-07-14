# comp0

Headless React 19 components and behavior hooks with native-first DOM semantics, accessible interaction patterns, and SSR-safe rendering. comp0 provides behavior and structure without prescribing styles.

The public packages expose a single root entry point:

- [`@comp0/react`](https://www.npmjs.com/package/@comp0/react) provides children-composed components.
- [`@comp0/core`](https://www.npmjs.com/package/@comp0/core) provides React behavior hooks and DOM utilities.

Browse the [component documentation](https://comp0-docs.horrible.workers.dev) for live examples, anatomy, keyboard behavior, form contracts, and API references.

## Installation

comp0 requires React 19. Install the component package with its React peers:

```sh
pnpm add @comp0/react react@^19 react-dom@^19
```

Install `@comp0/core` directly when you want the hooks without the component package:

```sh
pnpm add @comp0/core react@^19
```

## Quick start

Import components from the package root and style the element they render:

```tsx
import { Button } from "@comp0/react";

export function SaveButton() {
  return (
    <Button className="rounded-md bg-slate-900 px-3 py-2 text-white data-hovered:bg-slate-700">
      Save changes
    </Button>
  );
}
```

## Composition

Provider roots coordinate state and ARIA relationships. Explicit parts own the rendered controls and surfaces:

```tsx
import {
  Label,
  Select,
  SelectOption,
  SelectPopover,
  SelectTrigger,
  SelectValue,
} from "@comp0/react";

export function PlanSelect() {
  return (
    <Select as="div" className="select" defaultValue="basic" name="plan">
      <Label>Plan</Label>
      <SelectTrigger>
        <SelectValue placeholder="Choose a plan" />
      </SelectTrigger>
      <SelectPopover placement="bottom" offset={4}>
        <SelectOption value="basic">Basic</SelectOption>
        <SelectOption value="pro">Pro</SelectOption>
      </SelectPopover>
    </Select>
  );
}
```

Provider-only roots render their children directly by default. Pass `as` when a root should own a layout or styling element, as the `Select` above does.

## Styling and state attributes

comp0 emits no component CSS or default class names. Pass `className` to the part that owns the DOM element and use its native attributes or presence-based state attributes such as `data-hovered`, `data-focused`, `data-selected`, `data-open`, and `data-disabled`.

```tsx
<Button className="rounded-lg bg-teal-700 px-3 py-2 text-white data-hovered:bg-teal-800 data-disabled:opacity-50">
  Save
</Button>

<SelectOption
  className="px-3 py-2 data-selected:bg-teal-100 data-selected:font-medium"
  value="small"
>
  Small
</SelectOption>
```

The attributes are present only while their state is true, so they work with Tailwind data variants and plain CSS:

```css
.button[data-hovered] {
  background: color-mix(in oklab, CanvasText 8%, Canvas);
}
```

## Controlled and uncontrolled state

Stateful roots follow the familiar React controlled/uncontrolled shape. Value owners accept `value`, `defaultValue`, and `onChange(nextValue)`. Open-state roots accept `open`, `defaultOpen`, and `onToggle(nextOpen)`.

```tsx
import { useState } from "react";

const [plan, setPlan] = useState("basic");

<Select value={plan} onChange={setPlan}>
  {/* Select parts */}
</Select>;
```

These root callbacks receive the next state directly. Native leaf elements keep native React event handlers.

## Forms

Form components use native-shaped props such as `name`, `required`, `disabled`, and `invalid`. Composite controls such as `Select` synchronize a hidden native form control so they participate in submission and constraint validation, while text inputs and other leaf controls expose their native events directly.

Associate `Label`, `Description`, and validation feedback parts with the same field root. The root supplies the required IDs and ARIA relationships.

## Routing

Polymorphic components compose with router links through `as`:

```tsx
import { Link as Comp0Link } from "@comp0/react";
import { Link as RouterLink } from "react-router";

<Comp0Link as={RouterLink} to="/settings">
  Settings
</Comp0Link>;
```

comp0 is router-agnostic. It does not currently provide a navigation provider or adapter; routing state and navigation remain the router's responsibility.

## Core hooks

`@comp0/core` includes controlled-state, collection registry, roving-focus, typeahead, focus-ring, hover, press, prop-merging, ref-composition, and presence-data-attribute utilities.

```tsx
import { dataAttr, usePress } from "@comp0/core";

export function PressSurface() {
  const { pressProps, isPressed } = usePress<HTMLButtonElement>();
  return (
    <button {...pressProps} data-pressed={dataAttr(isPressed)}>
      Press
    </button>
  );
}
```

## Server rendering

The packages avoid DOM access during render and are designed for React server rendering and hydration. Components that coordinate browser APIs do so after mounting. Interactive components still need to run in a client boundary in React Server Components applications.

## React Compiler

The JavaScript published to npm is already transformed by the React Compiler for React 19. Applications consuming `@comp0/react` or `@comp0/core` from npm do not need to compile the packages again.

If you alias directly to this repository's source, vendor the source, or otherwise bypass the published output, apply the same React Compiler setup used by the repository. See [CONTRIBUTING.md](./CONTRIBUTING.md#react-compiler) for the exact configuration and maintenance constraints.

## Contributing

Development setup, verification commands, and repository architecture are documented in [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
