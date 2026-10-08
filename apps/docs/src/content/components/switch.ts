import { component, p, prop } from "../define.js";

export default component({
  slug: "switch",
  title: "Switch",
  group: "fields",
  summary: "An on/off setting backed by a native checkbox.",
  analogy: "Like a wall switch with an honest wire behind it.",
  whenToUse: "Use it for a setting that plainly means on or off.",
  steps: {
    main: "Add Switch beside its setting words.",
    supporting: "Choose defaultChecked when it needs a starting state.",
    behavior: "Give it a name if a form must send the setting.",
    code: '<Switch name="alerts">Email alerts</Switch>;',
  },
  imports: ["Switch"],
  snippet: '<Switch name="alerts">Email alerts</Switch>;',
  parts: [
    p("Switch", "input", "Label with a hidden native checkbox.", true, false, [
      prop("name", "string", "Submission name for the setting."),
      prop("checked / defaultChecked", "boolean", "Controlled or initial on state."),
      prop("onChange", "(checked: boolean) => void", "Receives the next on state."),
      prop("disabled", "boolean", "Disables the switch."),
      prop("inputProps", "InputHTMLAttributes", "Props for the hidden native input."),
    ]),
  ],
  keyboard: [{ keys: ["Space"], action: "Changes the switch." }],
  stateHooks: [
    { attribute: "[data-checked]", on: "Switch", meaning: "The switch is on." },
    { attribute: "[data-disabled]", on: "Switch", meaning: "The switch is disabled." },
    { attribute: "[data-focused]", on: "Switch", meaning: "The hidden input has focus." },
    {
      attribute: "[data-focus-visible]",
      on: "Switch",
      meaning: "Focus should show a visible ring.",
    },
    { attribute: "[data-hovered]", on: "Switch", meaning: "A pointer is over the label." },
  ],
  form: "A selected switch submits like a native checkbox.",
  accessibility: [
    "Label the setting, not merely the current state.",
    "Make on and off understandable without color.",
    "Use a checkbox instead when the choice belongs in a multi-select list.",
  ],
  related: ["checkbox", "toggle-button"],
});
