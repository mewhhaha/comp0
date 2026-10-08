import { component, p, prop } from "../define.js";

export default component({
  slug: "fieldset",
  title: "Fieldset",
  group: "fields",
  summary: "A native border and name for a related set of controls.",
  analogy: "Like a folder tab that names everything inside the folder.",
  whenToUse: "Use it for a group of choices such as contact methods.",
  steps: {
    main: "Wrap related controls in Fieldset.",
    supporting: "Put one short Legend first to name the group.",
    behavior:
      "Use disabled, invalid, or required on the group when that rule applies to all children.",
    code: "<Fieldset>\n  <Legend>Contact choices</Legend>\n</Fieldset>;",
  },
  imports: ["Fieldset", "Legend"],
  snippet: "<Fieldset><Legend>Contact choices</Legend>...</Fieldset>",
  parts: [
    p("Fieldset", "root", "Native fieldset that groups related controls.", true, false, [
      prop("disabled", "boolean", "Natively disables every control inside."),
      prop("invalid / required", "boolean", "Group-wide states exposed as data attributes."),
    ]),
    p("Legend", "label", "Native fieldset caption."),
  ],
  keyboard: [],
  stateHooks: [
    { attribute: "[data-disabled]", on: "Fieldset", meaning: "The whole group is disabled." },
    { attribute: "[data-invalid]", on: "Fieldset", meaning: "The group is invalid." },
    { attribute: "[data-required]", on: "Fieldset", meaning: "The group is required." },
  ],
  form: "Fieldset itself has no value; its named child controls submit normally.",
  accessibility: [
    "Put Legend first so the group has a name.",
    "Use it for related controls, not for decorative borders.",
    "Keep individual choices labelled too.",
  ],
  related: ["text-field", "checkbox", "radio"],
});
