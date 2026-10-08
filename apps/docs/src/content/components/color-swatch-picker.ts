import { component, p, prop } from "../define.js";

export default component({
  slug: "color-swatch-picker",
  title: "Color Swatch Picker",
  group: "fields",
  summary: "A compact radio group for choosing one named color chip.",
  analogy: "Like a paint-card fan: choose one chip and the choice stays visible.",
  whenToUse: "Use it when the available colors are few, known, and worth seeing at once.",
  steps: {
    main: "Start ColorSwatchPicker with a Legend that says what the color controls.",
    supporting: "Add one ColorSwatchPickerItem for each valid hex color.",
    behavior:
      "Give the picker a name when it belongs in a form; selected colors are normalized to lowercase six-digit hex values.",
    code: '<ColorSwatchPicker name="accent" defaultValue="#2563eb">\n  <Legend>Accent color</Legend>\n  <ColorSwatchPickerItem color="#2563eb" aria-label="Blue" />\n</ColorSwatchPicker>;',
  },
  imports: ["ColorSwatchPicker", "ColorSwatchPickerItem", "Legend"],
  snippet:
    '<ColorSwatchPicker name="accent" defaultValue="#2563eb"><Legend>Accent color</Legend><ColorSwatchPickerItem color="#2563eb" aria-label="Blue" /><ColorSwatchPickerItem color="#e11d48" aria-label="Rose" /></ColorSwatchPicker>',
  parts: [
    p(
      "ColorSwatchPicker",
      "root",
      "Native radio group that normalizes one selected hex color.",
      true,
      false,
      [
        prop(
          "value / defaultValue",
          "string",
          "Controlled or initial hex color; short hex values normalize to six digits.",
        ),
        prop("onChange", "(value: string) => void", "Receives the selected normalized hex color."),
        prop("name", "string", "Submission name for the selected color."),
        prop("disabled / required", "boolean", "Native radio-group constraints."),
        prop("invalid", "boolean", "Marks the group invalid."),
      ],
    ),
    p("Legend", "label", "Native fieldset legend naming the color choice."),
    p(
      "ColorSwatchPickerItem",
      "item",
      "Native radio label painted with its required hex color.",
      true,
      false,
      [
        prop("color", "string", "Valid hex color, normalized for the item value and background."),
        prop(
          "inputProps",
          "InputHTMLAttributes",
          "Names an icon-only swatch or customizes its radio input.",
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["ArrowRight", "ArrowDown"], action: "Moves and selects the next color." },
    { keys: ["ArrowLeft", "ArrowUp"], action: "Moves and selects the previous color." },
    { keys: ["Space"], action: "Selects the focused color." },
  ],
  stateHooks: [
    {
      attribute: "[data-checked]",
      on: "ColorSwatchPickerItem",
      meaning: "This swatch is selected.",
    },
    {
      attribute: "[data-value]",
      on: "ColorSwatchPickerItem",
      meaning: "The normalized hex color.",
    },
    {
      attribute: "[data-focused]",
      on: "ColorSwatchPickerItem",
      meaning: "Its radio has keyboard focus.",
    },
  ],
  form: "Submits one native radio value under name as a normalized lowercase #rrggbb color.",
  accessibility: [
    "Use Legend to name the color choice and give each swatch a specific visible or accessible name.",
    "Show which color is selected with a border, checkmark, or text in addition to the color itself.",
    "Keep the allowed palette small; use Color Picker when people need an arbitrary color.",
  ],
  related: ["color-picker", "color-field", "radio"],
});
