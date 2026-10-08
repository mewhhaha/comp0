import { component, p, prop } from "../define.js";

export default component({
  slug: "checkbox",
  title: "Checkbox",
  group: "fields",
  summary: "One tick box or a collection that can have several ticks.",
  analogy: "Like a sheet of stickers: you can keep more than one.",
  whenToUse: "Use it for independent yes/no choices or multiple selections.",
  steps: {
    main: "Start with a labelled Checkbox.",
    supporting: "Wrap related boxes in CheckboxGroup and give each value.",
    behavior: "Give the group a name when selected values should submit.",
    code: '<CheckboxGroup name="topics">\n  <Checkbox value="news">News</Checkbox>\n</CheckboxGroup>;',
  },
  imports: ["Checkbox", "CheckboxGroup"],
  snippet:
    '<CheckboxGroup name="topics">\n  <Checkbox value="news">News</Checkbox>\n</CheckboxGroup>;',
  parts: [
    p("CheckboxGroup", "root", "Optional shared name and value provider.", false, true, [
      prop("value / defaultValue", "string[]", "Controlled or initial selected values."),
      prop("onChange", "(value: string[]) => void", "Receives the next selected values."),
      prop("name", "string", "Shared submission name for the group."),
      prop("required", "boolean", "Requires at least one checkbox to be selected."),
      prop("invalid", "boolean", "Marks the group invalid and shows its FieldError."),
    ]),
    p("Checkbox", "input", "Label with a hidden native checkbox.", true, false, [
      prop("name", "string", "Submission name; falls back to the group name."),
      prop("value", "string", "Submitted value for this box."),
      prop("checked / defaultChecked", "boolean", "Controlled or initial tick state."),
      prop("onChange", "(checked: boolean) => void", "Receives the next tick state."),
      prop("indeterminate", "boolean", "Shows the mixed state."),
      prop("disabled", "boolean", "Disables the box."),
      prop("inputProps", "InputHTMLAttributes", "Props for the hidden native input."),
    ]),
  ],
  keyboard: [
    { keys: ["Space"], action: "Checks or unchecks the focused box." },
    { keys: ["Tab"], action: "Moves between checkboxes." },
  ],
  stateHooks: [
    { attribute: "[data-checked]", on: "Checkbox", meaning: "The box is checked." },
    { attribute: "[data-indeterminate]", on: "Checkbox", meaning: "The box is mixed." },
    { attribute: "[data-disabled]", on: "Checkbox", meaning: "The box cannot change." },
    { attribute: "[data-focused]", on: "Checkbox", meaning: "The hidden input has focus." },
    {
      attribute: "[data-focus-visible]",
      on: "Checkbox",
      meaning: "Focus should show a visible ring.",
    },
    { attribute: "[data-hovered]", on: "Checkbox", meaning: "A pointer is over the label." },
  ],
  form: "Each selected Checkbox submits its native name and value.",
  accessibility: [
    "Each checkbox needs visible choice text.",
    "Use Fieldset and Legend to name a collection.",
    "Show indeterminate state with more than color.",
  ],
  related: ["radio", "switch", "toggle-button"],
});
