import { component, p, prop } from "../define.js";

export default component({
  slug: "color-picker",
  title: "Color Picker",
  group: "pickers",
  summary:
    "A custom color picker with a swatch, two-dimensional color area, hue slider, and editable hex value.",
  analogy:
    "Like a paint-mixing tray: choose the hue, then place the marker where that hue becomes lighter, darker, or more saturated.",
  whenToUse:
    "Use it when the browser color input is too limited and people need a polished, consistent opaque sRGB picker.",
  steps: {
    main: "Start ColorPicker with a ColorPickerTrigger containing ColorSwatch and ColorPickerValue.",
    supporting:
      "Put ColorArea with ColorAreaThumb, a hue ColorSlider, and ColorPickerInput inside ColorPickerPopover.",
    behavior:
      'Use a lowercase opaque hex value such as "#0d9488". Keep the picker value immediate and defer only expensive previews derived from it; pass name to ColorPicker when the value belongs in a form. This release has no alpha or wide-gamut color support.',
    code: '<ColorPicker defaultValue="#0d9488">\n  <ColorPickerTrigger>\n    <ColorSwatch />\n    <ColorPickerValue />\n  </ColorPickerTrigger>\n  <ColorPickerPopover>\n    <ColorArea>\n      <ColorAreaThumb />\n    </ColorArea>\n    <ColorSlider channel="hue" />\n    <ColorPickerInput />\n  </ColorPickerPopover>\n</ColorPicker>;',
  },
  imports: [
    "ColorPicker",
    "ColorPickerTrigger",
    "ColorPickerPopover",
    "ColorArea",
    "ColorAreaThumb",
    "ColorSlider",
    "ColorSwatch",
    "ColorPickerValue",
    "ColorPickerInput",
  ],
  snippet:
    '<ColorPicker defaultValue="#0d9488">\n  <ColorPickerTrigger>\n    <ColorSwatch />\n    <ColorPickerValue />\n  </ColorPickerTrigger>\n  <ColorPickerPopover>\n    <ColorArea>\n      <ColorAreaThumb />\n    </ColorArea>\n    <ColorSlider channel="hue" />\n    <ColorPickerInput />\n  </ColorPickerPopover>\n</ColorPicker>;',
  parts: [
    p(
      "ColorPicker",
      "root",
      "Shared opaque sRGB color value and open-state provider.",
      false,
      false,
      [
        prop(
          "value / defaultValue",
          '"#rrggbb"',
          "Controlled or initial lowercase opaque hex value.",
        ),
        prop("onChange", "(value: string) => void", "Receives the next lowercase hex value."),
        prop(
          "open / defaultOpen",
          "boolean",
          "Controlled or initial open state of the color popover.",
        ),
        prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
        prop("name", "string", "Submission name for the hidden hex input."),
        prop("form", "string", "Associates the hidden value with a form by id."),
        prop("disabled / invalid / required", "boolean", "Field-wide states."),
        prop(
          "as",
          "ElementType",
          "Renders a wrapper element carrying the root's data attributes; there is no DOM without it.",
        ),
      ],
    ),
    p(
      "ColorPickerTrigger",
      "trigger",
      "Button that shows the current swatch and opens the picker.",
      true,
      false,
      [prop("aria-label", "string", "Names the trigger when its visible content is not enough.")],
    ),
    p("ColorSwatch", "value", "Visual chip filled with the current color.", true),
    p("ColorPickerValue", "value", "Current lowercase hex value.", true),
    p(
      "ColorPickerPopover",
      "content",
      "Floating dialog surface for precise color selection.",
      true,
      false,
      [
        prop("aria-label", "string", 'Defaults to the English "Color picker"; pass a translation.'),
        prop(
          "placement",
          "PopoverPlacement",
          'Trigger side to open on, such as "bottom start"; flips when there is no room.',
        ),
        prop("offset", "number", "Pixel gap between the trigger and the surface."),
      ],
    ),
    p(
      "ColorArea",
      "region",
      "Two-dimensional saturation and brightness control backed by hidden native range inputs.",
      true,
      false,
      [prop("aria-label", "string", "Names the saturation and brightness control.")],
    ),
    p(
      "ColorAreaThumb",
      "input",
      "Visual marker positioned at the chosen saturation and brightness.",
      true,
    ),
    p(
      "ColorSlider",
      "input",
      "Native hue range control synchronized with the color area.",
      true,
      false,
      [prop("channel", '"hue"', "Selects the hue channel; this release supports hue only.")],
    ),
    p(
      "ColorPickerInput",
      "input",
      "Editable hex input synchronized with the picker value.",
      true,
      false,
      [prop("aria-label", "string", "Names the hex input when no visible text does.")],
    ),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Opens the picker from the trigger." },
    { keys: ["Space"], action: "Opens the picker from the trigger." },
    { keys: ["Escape"], action: "Closes the popover and returns focus to the trigger." },
    {
      keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
      action: "Adjust the focused saturation, brightness, or hue range.",
    },
    {
      keys: ["Home", "End"],
      action: "Move the focused color-area axis to its minimum or maximum.",
    },
    {
      keys: ["PageUp", "PageDown"],
      action: "Make a larger change on the focused color-area axis.",
    },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "ColorPickerTrigger, ColorPickerPopover",
      meaning: "The color popover is open.",
    },
    {
      attribute: ":popover-open",
      on: "ColorPickerPopover",
      meaning: "Native pseudo-class equivalent.",
    },
    { attribute: "[data-value]", on: "ColorPicker", meaning: "A color is selected." },
    {
      attribute: "[data-disabled]",
      on: "ColorPickerTrigger",
      meaning: "The picker is disabled.",
    },
  ],
  form: "ColorPicker submits one hidden input under name with its lowercase #rrggbb value. It represents opaque sRGB only: alpha and wide-gamut colors are not supported.",
  accessibility: [
    "Give the trigger an accessible name when its visible swatch and hex value do not say what the color controls.",
    "ColorArea exposes two hidden native range inputs, one each for saturation and brightness, with two-dimensional slider descriptions; keep the visual thumb and value visible.",
    "Keep the hex input available for precise entry, and do not use color alone to convey the selected value or its meaning.",
    "Keep controlled picker updates urgent so its native ranges and announced value stay synchronized. Use useDeferredValue for expensive page, canvas, or theme previews instead.",
  ],
  related: ["color-field", "slider", "popover", "text-field"],
});
