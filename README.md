# comp0

Headless React 19 components with native-first DOM semantics, SSR-safe behavior, and no third-party runtime implementation dependencies beyond React and React DOM.

comp0 is a greenfield component library for teams that want accessible interaction primitives without adopting a visual design system. Components render meaningful DOM, expose state through data attributes, and leave layout, animation, color, and typography to the application.

## Packages

- `@comp0/react`: the public React component package.
- `@comp0/core`: first-party interaction, collection, state, and rendering utilities used by `@comp0/react`.
- `@comp0/docs`: the local documentation and playground app.

`@comp0/react` has peer dependencies on `react >=19.0.0` and `react-dom >=19.0.0`.

## Install

```sh
pnpm add @comp0/react react react-dom
```

For workspace development, depend on the local package:

```json
{
  "dependencies": {
    "@comp0/react": "workspace:*"
  }
}
```

## Usage

Import components from the package root:

```tsx
import { Button, FieldError, Input, Label, TextField } from "@comp0/react";

export function ProfileForm() {
  return (
    <form action="/api/profile">
      <TextField>
        <Label>Email</Label>
        <Input name="email" type="email" required />
        <FieldError>Enter a valid email address.</FieldError>
      </TextField>

      <Button type="submit">Save</Button>
    </form>
  );
}
```

Compose larger widgets from explicit parts:

```tsx
import { Button, Label, ListBox, ListBoxItem, Popover, Select, SelectValue } from "@comp0/react";

export function PlanSelect() {
  return (
    <Select name="plan" defaultValue="basic">
      <Label>Plan</Label>
      <Button>
        <SelectValue placeholder="Choose a plan" />
      </Button>
      <Popover>
        <ListBox>
          <ListBoxItem id="basic">Basic</ListBoxItem>
          <ListBoxItem id="pro">Pro</ListBoxItem>
        </ListBox>
      </Popover>
    </Select>
  );
}
```

Use controlled state when the application owns the value:

```tsx
import { Button } from "@comp0/react";

export function SaveButton({ isSaving }: { isSaving: boolean }) {
  return (
    <Button disabled={isSaving} pending={isSaving}>
      {({ pending }) => (pending ? "Saving..." : "Save changes")}
    </Button>
  );
}
```

## Styling

comp0 ships behavior, not CSS. Style components with your own classes, selectors, and data attributes.

Boolean data attributes use presence semantics:

```css
.button[data-hovered] {
  background: color-mix(in oklab, CanvasText 8%, Canvas);
}

.checkbox[data-selected] .indicator {
  background: Highlight;
}

.select[data-open] .chevron {
  rotate: 180deg;
}
```

Many interactive components also accept state render props for `children` and `className`, so styles and content can react to state without duplicating event logic.

## Component Surface

The React package exports headless parts across these families:

- Buttons: `Button`, `ToggleButton`, `ToggleButtonGroup`, `Pressable`, `FileTrigger`.
- Forms: `Label`, `Description`, `FieldError`, `Fieldset`, `Legend`, `TextField`, `Input`, `TextArea`, `SearchField`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Radio`, `Switch`, `NumberField`, `Slider`, `SliderOutput`, `SliderTrack`, `SliderThumb`.
- Pickers: `Select`, `SelectValue`, `SelectOption`, `Combobox`, `ComboBoxValue`, `ComboboxOption`, `Autocomplete`.
- Collections: `Collection`, `CollectionBuilder`, `ListBox`, `ListBoxItem`, `ListBoxSection`, `Menu`, `MenuItem`, `MenuSection`, `Feed`, `GridList`, `TagGroup`, `Tree`, and related item, header, section, and load-more parts.
- Navigation: `Link`, `Accordion`, `Disclosure`, `Tabs`, `Breadcrumbs`, `Toolbar`, `Menubar`, and related trigger, item, panel, and content parts.
- Date and time: `Calendar`, `RangeCalendar`, `DateField`, `DateInput`, `DateSegment`, `TimeField`, `DatePicker`, `DateRangePicker`, and calendar grid parts.
- Color: `ColorPicker`, `ColorField`, `ColorArea`, `ColorSlider`, `ColorWheel`, `ColorSwatch`, `ColorSwatchPicker`, and related color parts.
- Overlays: `DialogTrigger`, `Dialog`, `AlertDialog`, `Modal`, `ModalOverlay`, `Popover`, `OverlayArrow`, `TooltipTrigger`, `Tooltip`.
- Tables: `Table`, `ResizableTableContainer`, `TableHeader`, `Column`, `ColumnResizer`, `TableBody`, `Row`, `Cell`, `TableLoadMoreItem`.
- Text and layout: `Text`, `Heading`, `Header`, `Keyboard`, `Separator`, `Group`, `WindowSplitter`, `Focusable`, `VisuallyHidden`.
- Status and motion: `ProgressBar`, `Meter`, `Carousel`, `SharedElementTransition`, `SharedElement`, and unstable toast parts.

The package root exports the full surface. Dedicated package subpaths are also available for `@comp0/react/button`, `@comp0/react/dialog`, and `@comp0/react/listbox`.

## Principles

- Native-first: prefer native elements and browser behavior before custom ARIA patterns.
- Children-driven: compose with explicit child parts instead of large configuration objects.
- Data-driven styling: reflect state with data attributes that applications can target.
- SSR-safe: avoid DOM reads during render and use React-generated ids for hydration-safe wiring.
- Form-compatible: preserve native field names, values, disabled state, and submission behavior where the pattern supports it.

## Development

Install dependencies:

```sh
pnpm install
```

Run the docs app:

```sh
pnpm dev
```

Build all packages:

```sh
pnpm build
```

Run checks:

```sh
pnpm test
pnpm test:browser
pnpm typecheck
pnpm lint
pnpm format:check
```

Run the React Compiler smoke test:

```sh
pnpm test:compiler-smoke
```

The docs app lives in `apps/docs`, the React package lives in `packages/react`, and shared primitives live in `packages/core`.
