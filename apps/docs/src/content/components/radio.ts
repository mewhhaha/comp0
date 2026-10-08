import { component, p, prop } from "../define.js";

export default component({
  slug: "radio",
  title: "Radio",
  group: "fields",
  summary: "A set of choices where one choice wins.",
  analogy: "Like choosing one seat in a row of single-seat chairs.",
  whenToUse: "Use it for one choice from a short visible list.",
  steps: {
    main: "Start RadioGroup with a name.",
    supporting: "Add one Radio per choice, each with a different value.",
    behavior: "Use defaultValue to show the starting choice.",
    code: '<RadioGroup name="plan" defaultValue="pro">\n  <Radio value="pro">Pro</Radio>\n</RadioGroup>;',
  },
  imports: ["Radio", "RadioGroup"],
  snippet:
    '<RadioGroup name="plan" defaultValue="pro">\n  <Radio value="pro">Pro</Radio>\n</RadioGroup>;',
  parts: [
    p("RadioGroup", "root", "Selected-value provider; no DOM by default.", false, false, [
      prop("value / defaultValue", "string", "Controlled or initial choice."),
      prop("onChange", "(value: string) => void", "Receives the next choice."),
      prop("name", "string", "Shared submission name for the group."),
      prop("required", "boolean", "Requires one radio in the group to be selected."),
      prop("invalid", "boolean", "Marks the group invalid and shows its FieldError."),
    ]),
    p("Radio", "item", "Labelled native radio option.", true, false, [
      prop("value", "string", "This option’s value."),
      prop("name", "string", "Submission name; falls back to the group name."),
      prop("inputProps", "InputHTMLAttributes", "Props for the hidden native input."),
      prop("checked / defaultChecked", "boolean", "Controlled or initial standalone state."),
      prop("disabled", "boolean", "Disables the option."),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowDown", "ArrowRight"], action: "Moves to and selects the next radio." },
    { keys: ["ArrowUp", "ArrowLeft"], action: "Moves to and selects the previous radio." },
    { keys: ["Space"], action: "Selects the focused radio." },
  ],
  stateHooks: [
    { attribute: "[data-checked]", on: "Radio", meaning: "This radio is selected." },
    { attribute: "[data-disabled]", on: "Radio", meaning: "This radio is disabled." },
    { attribute: "[data-focused]", on: "Radio", meaning: "The hidden input has focus." },
    {
      attribute: "[data-focus-visible]",
      on: "Radio",
      meaning: "Focus should show a visible ring.",
    },
    { attribute: "[data-hovered]", on: "Radio", meaning: "A pointer is over the label." },
  ],
  form: "The selected radio submits RadioGroup.name and its value.",
  accessibility: [
    "Name the group with a Legend or aria-label.",
    "Use radio only when one choice is allowed.",
    "Keep every option label easy to click and read.",
  ],
  related: ["checkbox", "select"],
  moreExamples: [
    {
      id: "cards",
      title: "Plan cards",
      description: "Turn each radio into a full-width card with supporting details and price.",
    },
  ],
});
