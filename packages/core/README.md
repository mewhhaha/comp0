# @comp0/core

React 19 behavior hooks and DOM utilities for building accessible headless interfaces. It includes interaction hooks, controllable state, collection and focus utilities, prop merging, ref composition, and presence-based data attributes.

```sh
pnpm add @comp0/core react@^19
```

```tsx
import { dataAttr, usePress } from "@comp0/core";

function PressSurface() {
  const { pressProps, isPressed } = usePress<HTMLButtonElement>();
  return (
    <button {...pressProps} data-pressed={dataAttr(isPressed)}>
      Press
    </button>
  );
}
```

The package has one root entry point, and its published JavaScript is already transformed by the React Compiler. See the [documentation](https://comp0-docs.horrible.workers.dev) for API details.

MIT licensed.
