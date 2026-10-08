import { component, p, prop } from "../define.js";

export default component({
  slug: "editable",
  title: "Editable",
  group: "fields",
  summary: "Plain text that turns into an input when clicked.",
  analogy: "Like a name tag written in pencil: tap it, rewrite it, and it settles back into place.",
  whenToUse: "Use it to rename something in place, such as a document title or a list name.",
  steps: {
    main: "Wrap Editable around EditableView and EditableInput.",
    supporting:
      "EditableView shows the committed value and enters edit mode on click; EditableInput takes over while editing.",
    behavior:
      "Enter commits, Escape cancels, and clicking away commits; give the input a name so a form submits the committed value.",
    code: '<Editable defaultValue="Untitled document">\n  <EditableView />\n  <EditableInput name="title" aria-label="Document title" />\n</Editable>;',
  },
  imports: ["Editable", "EditableInput", "EditableView"],
  snippet:
    '<Editable defaultValue="Untitled document"><EditableView /><EditableInput name="title" aria-label="Document title" /></Editable>',
  parts: [
    p("Editable", "root", "Context provider with no DOM by default.", false, false, [
      prop("as", "ElementType", "Renders a wrapper element; there is no DOM without it."),
      prop("value / defaultValue", "string", "Controlled or initial committed value."),
      prop(
        "onChange",
        "(value: string) => void",
        "Receives the committed value when an edit commits, not per keystroke.",
      ),
      prop("open / defaultOpen", "boolean", "Controlled or initial edit mode."),
      prop("onOpenChange", "(open: boolean) => void", "Receives the next edit mode."),
      prop("disabled", "boolean", "Blocks entering edit mode and disables both parts."),
    ]),
    p(
      "EditableView",
      "trigger",
      "Native button showing the committed value; click enters edit mode.",
      true,
      false,
      [
        prop(
          "children",
          "ReactNode",
          "Custom display; defaults to the committed value. Style [data-empty] and [data-open] for state.",
        ),
      ],
    ),
    p(
      "EditableInput",
      "input",
      "Native input that stays in the DOM so its name always submits.",
      true,
      false,
      [prop("name", "string", "Submission name for the committed value.")],
    ),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Enters edit mode.", scope: "view" },
    { keys: ["Enter"], action: "Commits the draft and returns to the view.", scope: "input" },
    {
      keys: ["Escape"],
      action: "Cancels editing and restores the committed value.",
      scope: "input",
    },
    { keys: ["Tab"], action: "Moves focus away; leaving the input commits the draft." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "Editable / EditableView / EditableInput",
      meaning: "An edit is in progress.",
    },
    {
      attribute: "[data-empty]",
      on: "EditableView",
      meaning: "The committed value is empty, so a placeholder can be styled.",
    },
    {
      attribute: "[data-disabled]",
      on: "Editable / EditableView / EditableInput",
      meaning: "Editing cannot start.",
    },
  ],
  form: "The always-present EditableInput submits its native name with the committed value.",
  accessibility: [
    "EditableView is a real button, so keyboard users reach it with Tab and press Enter to start editing.",
    "Give EditableInput an aria-label that names the value, such as Document title; the view's text is hidden while editing.",
    "Show the edit affordance, such as a pencil icon, without relying on hover alone.",
    "Style [data-empty] on EditableView so an empty value still leaves something visible to click.",
  ],
  related: ["text-field", "search-field"],
});
