import { component, p, prop } from "../define.js";

export default component({
  slug: "button",
  title: "Button",
  group: "actions",
  summary: "A familiar native button for one immediate action.",
  analogy: "Like a doorbell: one press sends one clear request.",
  whenToUse: "Use it to save, delete, open, or submit—not to change pages.",
  steps: {
    main: "Put Button where the action happens.",
    supporting: "Write a short verb such as Save.",
    behavior: 'Connect onClick, or use type="submit" in a form.',
    code: "<Button onClick={save}>Save</Button>;",
  },
  imports: ["Button"],
  snippet: "<Button onClick={save}>Save</Button>;",
  parts: [
    p("Button", "root", "Native button and press target.", true, false, [
      prop("onClick", "(event: MouseEvent) => void", "Runs the action on press."),
      prop("type", '"button" | "submit" | "reset"', 'Native button type; defaults to "button".'),
      prop("disabled", "boolean", "Disables the button; pending also disables it."),
      prop("pending", "boolean", "Marks a busy action: disables the button and sets aria-busy."),
      prop("as", "ElementType", "Renders another element with button semantics restored."),
    ]),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Presses the focused button." },
    { keys: ["Space"], action: "Presses the focused button." },
  ],
  stateHooks: [
    { attribute: "[data-disabled]", on: "Button", meaning: "The button is disabled." },
    { attribute: "[data-pending]", on: "Button", meaning: "The action is busy." },
    { attribute: "[data-pressed]", on: "Button", meaning: "The button is being pressed." },
    { attribute: "[data-hovered]", on: "Button", meaning: "A non-touch pointer is over it." },
    { attribute: "[data-focused]", on: "Button", meaning: "The button has focus." },
    {
      attribute: "[data-focus-visible]",
      on: "Button",
      meaning: "Focus should show a visible ring.",
    },
  ],
  form: 'A native Button submits a form when type="submit".',
  accessibility: [
    "Use a visible verb that describes the action.",
    "Keep a visible focus ring.",
    "Use Link instead when the action changes the URL.",
    "Give an icon-only Button an aria-label; its Tooltip is supplementary and must not be its only accessible name.",
  ],
  related: ["toggle-button", "link", "file-trigger", "tooltip"],
  moreExamples: [
    {
      id: "icon-tooltip",
      title: "Icon button with tooltip",
      description:
        "Name an icon-only button directly, then add a tooltip that reveals the same action on hover or focus.",
    },
  ],
});
