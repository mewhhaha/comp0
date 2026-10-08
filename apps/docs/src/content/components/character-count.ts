import { component, p, prop } from "../define.js";

export default component({
  slug: "character-count",
  title: "Character Count",
  group: "fields",
  summary: "A live, field-linked count of how much text remains before a native length limit.",
  analogy: "Like the page count printed at the bottom of a writing form.",
  whenToUse:
    "Use it when a text limit is important enough that people need to plan what they write.",
  steps: {
    main: "Give TextField an initial or controlled value so it can share the current text with CharacterCount.",
    supporting:
      "Put the same maxLength on TextArea and CharacterCount; the native control enforces the limit.",
    behavior:
      "Keep the output visible and concise; it is automatically associated with the field and announced politely.",
    code: '<TextField defaultValue="">\n  <TextArea maxLength={160} />\n  <CharacterCount maxLength={160} />\n</TextField>;',
  },
  imports: ["CharacterCount", "Label", "TextArea", "TextField"],
  snippet:
    '<TextField defaultValue=""><Label>Biography</Label><TextArea maxLength={160} /><CharacterCount maxLength={160} /></TextField>',
  parts: [
    p(
      "TextField",
      "root",
      "Wrapper-free value provider shared by the native control and count.",
      false,
      false,
      [
        prop("value", "string", "Controlled text value."),
        prop("defaultValue", "string", "Initial uncontrolled text value."),
        prop("onChange", "(value: string) => void", "Receives the next text value."),
      ],
    ),
    p("Label", "label", "Visible name for the text control."),
    p("TextArea", "input", "Native text control that enforces maxLength.", true, false, [
      prop("maxLength", "number", "Native maximum accepted character count."),
    ]),
    p(
      "CharacterCount",
      "feedback",
      "Polite output associated with the field through aria-describedby and for.",
      true,
      false,
      [
        prop("maxLength", "number", "Non-negative integer used to calculate remaining text."),
        prop(
          "children",
          "ReactNode | (state: CharacterCountState) => ReactNode",
          "Custom output receiving count, maximum, remaining, and limitReached.",
        ),
      ],
    ),
  ],
  keyboard: [{ keys: ["Tab"], action: "Moves to and from the native text control." }],
  stateHooks: [
    { attribute: "[data-empty]", on: "CharacterCount", meaning: "The field has no text." },
    {
      attribute: "[data-limit-reached]",
      on: "CharacterCount",
      meaning: "No characters remain.",
    },
    {
      attribute: "[data-count]",
      on: "CharacterCount",
      meaning: "Current character count.",
    },
    {
      attribute: "[data-remaining]",
      on: "CharacterCount",
      meaning: "Characters remaining before the limit.",
    },
  ],
  form: "TextArea submits its native value; CharacterCount submits nothing.",
  accessibility: [
    "Put the same non-negative maxLength on the native control and CharacterCount so the message matches the enforced limit.",
    "Keep the count visible and associated with the control; do not communicate the limit only after it is reached.",
    "Give TextField value, defaultValue, or onChange so CharacterCount receives the current text.",
  ],
  related: ["text-area", "text-field", "fieldset"],
});
