import { component, p, prop } from "../define.js";

export default component({
  slug: "text-area",
  title: "Text Area",
  group: "fields",
  summary: "A multi-line native text box with the same label and feedback pieces.",
  analogy: "Like a bigger notebook instead of a single-line sticky note.",
  whenToUse: "Use it when people need to write a note, message, or longer answer.",
  steps: {
    main: "Start a TextField with Label.",
    supporting: "Put TextArea inside it instead of Input.",
    behavior: "Give TextArea a name so the full text submits.",
    code: '<TextField>\n  <Label>Notes</Label>\n  <TextArea name="notes" />\n</TextField>;',
  },
  imports: ["Description", "FieldError", "Label", "TextArea", "TextField"],
  snippet: '<TextField>\n  <Label>Notes</Label>\n  <TextArea name="notes" />\n</TextField>;',
  parts: [
    p("TextField", "root", "Optional field provider; it owns no DOM by default.", false, false, [
      prop(
        "id",
        "string",
        "Base id for the control; the label, description, and error ids derive from it.",
      ),
      prop("value / defaultValue", "string", "Controlled or initial field value."),
      prop("onChange", "(value: string) => void", "Receives the next value."),
      prop("disabled / invalid / required", "boolean", "Field-wide states shared with every part."),
    ]),
    p("Label", "label", "Native label for the text area.", true, false, [
      prop("htmlFor", "string", "Auto-wired to the field control; set it only to override."),
    ]),
    p(
      "TextArea",
      "input",
      "Native multi-line control that owns typing and submission.",
      true,
      false,
      [
        prop("name", "string", "Submission name for the text."),
        prop("rows", "number", "Visible line count."),
        prop("placeholder", "string", "Hint text; never a replacement for Label."),
        prop("disabled / required", "boolean", "Override the field-wide state for this control."),
      ],
    ),
    p("Description / FieldError", "feedback", "Optional linked help or error text.", true, true, [
      prop("forceMount", "boolean", "FieldError only: keep it rendered while the field is valid."),
    ]),
  ],
  keyboard: [{ keys: ["Tab"], action: "Moves to and from the native text area." }],
  stateHooks: [
    {
      attribute: "[data-disabled]",
      on: "TextArea",
      meaning: "The surrounding field is disabled.",
    },
    { attribute: "[data-invalid]", on: "TextArea", meaning: "The surrounding field is invalid." },
  ],
  form: "TextArea submits its native name and multi-line value.",
  accessibility: [
    "Give the multi-line box a visible Label.",
    "Explain character limits in Description when they matter.",
    "Use FieldError to state what needs fixing.",
  ],
  related: ["text-field", "character-count", "fieldset"],
});
