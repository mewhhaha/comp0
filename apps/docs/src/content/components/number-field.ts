import { component, p, prop } from "../define.js";

export default component({
  slug: "number-field",
  title: "Number Field",
  group: "fields",
  summary: "A native number box with fully styleable step buttons.",
  analogy: "Like a small counter with guardrails.",
  whenToUse: "Use it for quantities such as guests, price, or count.",
  steps: {
    main: "Compose NumberFieldInput with increment and decrement buttons.",
    supporting: "Set min, max, and step on NumberField when the range matters.",
    behavior: "Name NumberField so its native input submits.",
    code: '<NumberField name="guests" defaultValue={2} min={1}>\n  <NumberFieldInput />\n  <NumberFieldIncrement />\n  <NumberFieldDecrement />\n</NumberField>;',
  },
  imports: ["NumberField", "NumberFieldInput", "NumberFieldIncrement", "NumberFieldDecrement"],
  snippet:
    '<NumberField name="guests" defaultValue={2} min={1}>\n  <NumberFieldInput />\n  <NumberFieldIncrement />\n  <NumberFieldDecrement />\n</NumberField>;',
  parts: [
    p("NumberField", "root", "Field provider and wrapper div.", true, false, [
      prop("value / defaultValue", "number", "Controlled or initial number."),
      prop("onChange", "(value: number) => void", "Receives the next number."),
      prop("min / max / step", "number", "Range limits shared by the input and buttons."),
      prop("name", "string", "Submission name."),
      prop("disabled / invalid / required", "boolean", "Field-wide states."),
    ]),
    p(
      "NumberFieldInput",
      "input",
      "Native number input for typing and form submission.",
      true,
      false,
      [prop("HTML input props", "InputHTMLAttributes", "Forwards native input attributes.")],
    ),
    p("NumberFieldIncrement", "trigger", "Native button that increases by one step.", true, false, [
      prop("aria-label", "string", 'Defaults to "Increase value".'),
    ]),
    p("NumberFieldDecrement", "trigger", "Native button that decreases by one step.", true, false, [
      prop("aria-label", "string", 'Defaults to "Decrease value".'),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowUp"], action: "Increases by step." },
    { keys: ["ArrowDown"], action: "Decreases by step." },
  ],
  stateHooks: [
    { attribute: "[data-invalid]", on: "NumberField", meaning: "The value is invalid." },
    {
      attribute: "[data-disabled]",
      on: "NumberField / NumberFieldIncrement / NumberFieldDecrement",
      meaning: "The field is disabled or a step is unavailable at its boundary.",
    },
  ],
  form: 'NumberFieldInput submits as a named native number input. Step buttons use type="button" and default to tabIndex={-1} because Arrow keys provide the same keyboard operation on the input.',
  accessibility: [
    "Label the number and its unit.",
    "Set min, max, and step when they convey a real limit.",
    "Keep the native input available for typing and Arrow key changes.",
    "Show validation feedback in text, not only color.",
  ],
  related: ["slider", "text-field"],
});
