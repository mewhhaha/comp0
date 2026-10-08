import { component, p, prop } from "../define.js";

export default component({
  slug: "text-field",
  title: "Text Field",
  group: "fields",
  summary: "A shared field brain that connects a label, one text input, help, and errors.",
  analogy: "Like a name tag kit: every piece knows which input it belongs to.",
  whenToUse: "Use it for a one-line text value such as an email or name.",
  steps: {
    main: "Start TextField with Label and Input.",
    supporting: "Add Description for a useful hint and FieldError for validation feedback.",
    behavior: "Give Input a native name so a form can send its value.",
    code: '<TextField>\n  <Label>Email</Label>\n  <Input name="email" />\n</TextField>;',
  },
  imports: ["Description", "FieldError", "Input", "Label", "TextField"],
  snippet:
    '<TextField required><Label>Email</Label><Input name="email" type="email" /><Description>For receipts.</Description><FieldError>Enter an email.</FieldError></TextField>',
  parts: [
    p("TextField", "root", "Field provider; it owns no DOM unless as is supplied.", false, false, [
      prop("as", "ElementType", "Renders a wrapper element; there is no DOM without it."),
      prop("value / defaultValue", "string", "Controlled or initial field value."),
      prop("onChange", "(value: string) => void", "Receives the next value."),
      prop("disabled / invalid / required", "boolean", "Field-wide states shared with every part."),
    ]),
    p("Label", "label", "Native label linked to the control.", true, false, [
      prop("htmlFor", "string", "Auto-wired to the field control; set it only to override."),
    ]),
    p(
      "Input",
      "input",
      "Native single-line control that owns typing and submission.",
      true,
      false,
      [
        prop("name", "string", "Submission name for the value."),
        prop("type", "string", 'Native input type such as "email" or "password".'),
        prop("placeholder", "string", "Hint text; never a replacement for Label."),
        prop("disabled / required", "boolean", "Override the field-wide state for this control."),
      ],
    ),
    p("Description / FieldError", "feedback", "Linked help or error text.", true, true, [
      prop("forceMount", "boolean", "FieldError only: keep it rendered while the field is valid."),
    ]),
  ],
  keyboard: [{ keys: ["Tab"], action: "Moves to and from the native control." }],
  stateHooks: [
    { attribute: "[data-invalid]", on: "Input", meaning: "The field is invalid." },
    { attribute: "[data-required]", on: "Input", meaning: "The field is required." },
    { attribute: "[data-disabled]", on: "Input", meaning: "The field is disabled." },
  ],
  form: "Input submits its native name and value.",
  accessibility: [
    "Use Label so the input has a clear name.",
    "Put Description and FieldError near their field.",
    "Do not rely on placeholder text as the only label.",
  ],
  related: ["text-area", "checkbox", "number-field"],
});
