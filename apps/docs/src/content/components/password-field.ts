import { component, p, prop } from "../define.js";

export default component({
  slug: "password-field",
  title: "Password Field",
  group: "fields",
  summary: "A hidden-first password input with a built-in show and hide action.",
  analogy: "Like a covered keyhole: reveal the characters only when you need to check them.",
  whenToUse:
    "Use it for sign-in, account creation, and password changes where people may need to inspect what they entered.",
  steps: {
    main: "Start PasswordField with a Label and PasswordFieldInput.",
    supporting:
      "Add PasswordFieldToggle plus Description and FieldError when people need help or validation feedback.",
    behavior:
      "Choose current-password for sign-in or new-password for a new credential; the field starts hidden and manages revealing itself.",
    code: '<PasswordField required>\n  <Label>Password</Label>\n  <PasswordFieldInput name="password" autoComplete="current-password" />\n  <PasswordFieldToggle />\n  <Description>Use a password manager if you have one.</Description>\n  <FieldError>Enter your password.</FieldError>\n</PasswordField>;',
  },
  imports: [
    "Description",
    "FieldError",
    "Label",
    "PasswordField",
    "PasswordFieldInput",
    "PasswordFieldToggle",
  ],
  snippet:
    '<PasswordField required>\n  <Label>Password</Label>\n  <PasswordFieldInput name="password" autoComplete="current-password" />\n  <PasswordFieldToggle />\n  <Description>Use a password manager if you have one.</Description>\n  <FieldError>Enter your password.</FieldError>\n</PasswordField>;',
  parts: [
    p(
      "PasswordField",
      "root",
      "Field provider with an internal hidden-first reveal state; it owns no DOM unless as is supplied.",
      false,
      false,
      [
        prop("as", "ElementType", "Renders a wrapper element; there is no DOM without it."),
        prop("value / defaultValue", "string", "Controlled or initial password value."),
        prop("onChange", "(value: string) => void", "Receives the next password value."),
        prop(
          "disabled / invalid / required",
          "boolean",
          "Field-wide states shared with every part.",
        ),
        prop(
          "visibleAnnouncement / hiddenAnnouncement",
          "string",
          "Localizes the polite status announced after the reveal state changes.",
        ),
      ],
    ),
    p("Label", "label", "Native label linked to the password input.", true, false, [
      prop("htmlFor", "string", "Auto-wired to the field control; set it only to override."),
    ]),
    p(
      "PasswordFieldInput",
      "input",
      "Native password input that becomes text only while the field is revealed.",
      true,
      false,
      [
        prop("name", "string", "Submission name for the password."),
        prop(
          "autoComplete",
          '"current-password" | "new-password"',
          "Password-manager hint chosen for this form.",
        ),
        prop(
          "spellCheck",
          "boolean",
          "Defaults to false to keep password text out of spell checking.",
        ),
        prop(
          "autoCapitalize",
          "string",
          'Defaults to "none", including while the password is revealed as text.',
        ),
      ],
    ),
    p(
      "PasswordFieldToggle",
      "trigger",
      "Client-only native button that reveals or re-hides the same input; its name changes between Show password and Hide password.",
      true,
      false,
      [
        prop(
          "children",
          "ReactNode",
          "Optional visible content; defaults to the current action label. Style [data-visible] for the revealed state.",
        ),
        prop(
          "showLabel / hideLabel",
          "string",
          "Localizes the changing accessible and default visible action labels.",
        ),
        prop("disabled", "boolean", "Overrides the field-wide disabled state for this button."),
      ],
    ),
    p("Description / FieldError", "feedback", "Linked help or error text.", true, true, [
      prop("forceMount", "boolean", "FieldError only: keep it rendered while the field is valid."),
    ]),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves from the password input to the reveal button." },
    { keys: ["Enter", "Space"], action: "Shows or hides the password from the reveal button." },
    { keys: ["Enter"], action: "Submits the surrounding form from the password input." },
  ],
  stateHooks: [
    {
      attribute: "[data-visible]",
      on: "PasswordField wrapper, PasswordFieldInput, PasswordFieldToggle",
      meaning: "The password is revealed.",
    },
    { attribute: "[data-invalid]", on: "PasswordFieldInput", meaning: "The field is invalid." },
    {
      attribute: "[data-disabled]",
      on: "PasswordFieldInput, PasswordFieldToggle",
      meaning: "The field is disabled.",
    },
  ],
  form: "PasswordFieldInput submits its native name and password value. It re-hides after the owning form submits and when a page is restored from the back-forward cache.",
  accessibility: [
    "PasswordField is progressively enhanced: without JavaScript, the native password input still works; the reveal button appears only after hydration.",
    'Use autoComplete="current-password" for sign-in and autoComplete="new-password" for a new credential. Keep paste and password-manager filling available; PasswordFieldInput defaults to spellCheck={false} and autoCapitalize="none".',
    "The changing Show password and Hide password name describes the action, so the toggle does not use aria-pressed. Avoid confirm-password fields and maxLength: let people inspect or paste the credential, then show a clear validation error if needed.",
  ],
  related: ["text-field", "pin-input", "fieldset"],
});
