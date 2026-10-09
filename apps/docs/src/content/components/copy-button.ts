import { component, p, prop } from "../define.js";

export default component({
  slug: "copy-button",
  title: "CopyButton",
  group: "actions",
  summary: "Copies text to the clipboard and politely announces Copied.",
  analogy: "Like a copy icon that quietly says 'copied' out loud.",
  whenToUse: "Use it for code blocks, links, and generated text. For other actions use Button.",
  steps: {
    main: "Give CopyButton the text as value and a stable visible name.",
    supporting: "Set copiedText and failedText if the defaults need translating.",
    behavior:
      "Style the transient state with data-copied and data-failed; the status announcement is built in.",
    code: '<CopyButton value="npm i @comp0/react">Copy install command</CopyButton>;',
  },
  imports: ["CopyButton"],
  snippet: '<CopyButton value="npm i @comp0/react">Copy install command</CopyButton>',
  parts: [
    p(
      "CopyButton",
      "trigger",
      "Button that writes value to the clipboard, plus a hidden polite status.",
      true,
      false,
      [
        prop("value", "string", "The text copied to the clipboard."),
        prop("copiedText", "string", "Announced after a successful copy. Defaults to Copied."),
        prop("failedText", "string", "Announced when copying fails. Defaults to Copy failed."),
        prop(
          "resetDelay",
          "number",
          "Milliseconds the copied or failed state lasts. Defaults to 2000.",
        ),
        prop(
          "onCopied",
          "(value: string) => void",
          "Called after the clipboard accepted the text.",
        ),
        prop("onCopyError", "(error: unknown) => void", "Called when the clipboard write fails."),
        prop("as", "ElementType", "Renders another element in place of the button."),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Copies the value." },
    { keys: ["Space"], action: "Copies the value." },
  ],
  stateHooks: [
    {
      attribute: "[data-copied]",
      on: "CopyButton",
      meaning: "The last copy succeeded, for a short time.",
    },
    {
      attribute: "[data-failed]",
      on: "CopyButton",
      meaning: "The last copy failed, for a short time.",
    },
  ],
  form: "The button is type=button and submits nothing.",
  accessibility: [
    "The accessible name stays the same; the result is announced through a separate polite status so it is not read twice.",
    "A failed copy is announced too; give a manual fallback such as selectable text.",
    "The Clipboard API needs a secure context and a user gesture.",
  ],
  related: ["button", "status", "message"],
});
