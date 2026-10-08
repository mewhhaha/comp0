import { component, p, prop } from "../define.js";

export default component({
  slug: "pin-input",
  title: "Pin Input",
  group: "fields",
  summary: "A row of one-character fields for entering a short code.",
  analogy: "Like the digit boxes on a paper form: one square per character.",
  whenToUse: "Use it for one-time passcodes, PINs, and confirmation codes.",
  steps: {
    main: "Wrap one PinInputField per character in PinInput with an aria-label.",
    supporting:
      "Give each field its own aria-label; typing fills and advances, and pasting distributes the whole code.",
    behavior:
      "Wire onComplete to submit or verify as soon as the last field fills; pass name for form posts and mask for secret PINs.",
    code: '<PinInput name="otp" onComplete={verify} aria-label="Verification code">\n  <PinInputField aria-label="Digit 1" />\n  <PinInputField aria-label="Digit 2" />\n  <PinInputField aria-label="Digit 3" />\n  <PinInputField aria-label="Digit 4" />\n</PinInput>;',
  },
  imports: ["PinInput", "PinInputField"],
  snippet:
    '<PinInput name="otp" onComplete={verify} aria-label="Verification code">\n  <PinInputField aria-label="Digit 1" />\n  <PinInputField aria-label="Digit 2" />\n  <PinInputField aria-label="Digit 3" />\n  <PinInputField aria-label="Digit 4" />\n</PinInput>;',
  parts: [
    p(
      "PinInput",
      "root",
      "Group that owns the joined code and moves focus between the fields.",
      true,
      false,
      [
        prop("value / defaultValue", "string", "Controlled or initial joined code."),
        prop("onChange", "(value: string) => void", "Receives the next joined code."),
        prop(
          "onComplete",
          "(value: string) => void",
          "Fires once each time typing or pasting fills every field.",
        ),
        prop(
          "type",
          '"numeric" | "alphanumeric"',
          'Accepted characters; "numeric" filters to digits and is the default.',
        ),
        prop("mask", "boolean", "Renders the fields as password inputs."),
        prop("name", "string", "Submits one hidden input carrying the joined code."),
        prop("form", "string", "Associates the hidden value with a form by id."),
        prop("disabled", "boolean", "Disables every field."),
        prop("aria-label", "string", "Names the group for assistive technology; required."),
      ],
    ),
    p(
      "PinInputField",
      "input",
      'Native single-character input; its index follows the order the fields mount in. The first field advertises autocomplete="one-time-code".',
      true,
      false,
      [
        prop("aria-label", "string", 'Names this field, such as "Digit 1"; required per field.'),
        prop("className", "string", "Style each cell of the code."),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Backspace"], action: "Clears the field, or moves back when it is already empty." },
    { keys: ["ArrowLeft"], action: "Moves to the field on the visual left." },
    { keys: ["ArrowRight"], action: "Moves to the field on the visual right." },
    { keys: ["Tab"], action: "Leaves the code; typing a character already advances." },
  ],
  stateHooks: [
    {
      attribute: "[data-disabled]",
      on: "PinInput, PinInputField",
      meaning: "Entry is disabled.",
    },
    {
      attribute: ":focus-visible",
      on: "PinInputField",
      meaning: "The field has keyboard focus.",
    },
    {
      attribute: ":placeholder-shown",
      on: "PinInputField",
      meaning: "The field is still empty when a placeholder is set.",
    },
  ],
  form: "Submits one hidden input named `name` carrying the joined code.",
  accessibility: [
    "Name the group and every field: an aria-label on PinInput and one per PinInputField, such as Digit 1.",
    "The first field advertises autocomplete=one-time-code so platforms can offer the received code.",
    "Horizontal field arrows mirror in RTL while Backspace still returns to the preceding logical field.",
    "Keep a visible way to submit as well; do not rely on onComplete alone to move people forward.",
  ],
  related: ["text-field", "number-field"],
});
