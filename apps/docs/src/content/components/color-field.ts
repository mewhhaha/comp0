import { component, p, prop } from "../define.js";

export default component({
  slug: "color-field",
  title: "Color Field",
  group: "fields",
  summary: "A labelled native color swatch that opens the browser's picker.",
  analogy: "Like a paint chip on a hardware-store card: tap it to browse the full palette.",
  whenToUse: "Use it when people choose one opaque color, such as a theme accent.",
  steps: {
    main: "Start a TextField with a Label naming what the color is for.",
    supporting: "Put ColorField inside it instead of Input, with a name so the value submits.",
    behavior:
      'The native value is hex sRGB without alpha, such as "#0d9488"; say so in a Description when transparency might be expected.',
    code: '<TextField defaultValue="#0d9488">\n  <Label>Accent color</Label>\n  <ColorField name="accent" />\n</TextField>;',
  },
  imports: ["ColorField", "Description", "Label", "TextField"],
  snippet:
    '<TextField defaultValue="#0d9488"><Label>Accent color</Label><ColorField name="accent" /><Description>Hex sRGB only.</Description></TextField>',
  parts: [
    p(
      "TextField",
      "root",
      "Shared field brain that connects the label, the color input, help, and errors.",
      false,
      true,
      [
        prop(
          "value / defaultValue",
          "string",
          'Controlled or initial hex value such as "#0d9488".',
        ),
        prop("onChange", "(value: string) => void", "Receives the next hex value."),
        prop("id", "string", "Id of the input; the label and help ids derive from it."),
        prop(
          "disabled / invalid / required",
          "boolean",
          "Field state inherited by the color input and announced through the label pieces.",
        ),
      ],
    ),
    p("Label", "label", "Names the color for sighted and assistive users.", true, false),
    p(
      "ColorField",
      "input",
      "Native color input; the browser supplies the swatch and picker.",
      true,
      false,
      [
        prop("name", "string", "Submits the hex value with a form."),
        prop("value / defaultValue", "string", "Controlled or initial hex value when standalone."),
        prop(
          "onChange",
          "(event: ChangeEvent) => void",
          "Native change event; read event.currentTarget.value for the hex string.",
        ),
        prop("disabled / required", "boolean", "Overrides the surrounding field state."),
      ],
    ),
    p("Description", "feedback", "Hint wired via aria-describedby.", true, true),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Opens the browser color picker on the focused swatch." },
    { keys: ["Space"], action: "Opens the browser color picker on the focused swatch." },
  ],
  stateHooks: [
    { attribute: "[data-value]", on: "ColorField", meaning: "The current hex value." },
    { attribute: "[data-invalid]", on: "ColorField", meaning: "The field is invalid." },
    { attribute: ":disabled", on: "ColorField", meaning: "The input is disabled." },
    { attribute: "[data-focus-visible]", on: "ColorField", meaning: "Focused via keyboard." },
  ],
  form: "Submits its hex value under name like any native input.",
  accessibility: [
    "Use Label so the swatch has a name; a bare colored square says nothing.",
    "Show the chosen value or its meaning as visible text; the swatch alone is a color-only signal.",
    "Native color inputs hold opaque hex sRGB only; explain that limit in a Description when alpha or wide gamut might be expected.",
  ],
  related: ["text-field"],
});
