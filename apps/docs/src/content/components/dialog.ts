import { component, p, prop } from "../define.js";

export default component({
  slug: "dialog",
  title: "Dialog",
  group: "pickers",
  summary: "A modal layer that asks people to finish or dismiss a focused task.",
  analogy: "Like stepping into a small room before returning to the hallway.",
  whenToUse: "Use it for work that should temporarily block the page behind it.",
  steps: {
    main: "Start Dialog with DialogTrigger.",
    supporting: "Put a labelled DialogContent after the trigger.",
    behavior: "Keep a clear close or finish action inside the content.",
    code: '<Dialog>\n  <DialogTrigger>Open details</DialogTrigger>\n  <DialogContent aria-label="Details">Details</DialogContent>\n</Dialog>;',
  },
  imports: ["Dialog", "DialogContent", "DialogTrigger"],
  snippet:
    '<Dialog>\n  <DialogTrigger>Open details</DialogTrigger>\n  <DialogContent aria-label="Details">Details</DialogContent>\n</Dialog>;',
  parts: [
    p("Dialog", "root", "Modal open-state provider.", false, false, [
      prop(
        "as",
        "ElementType",
        "Renders a wrapper element that carries the root's data attributes and DOM props; without it the root renders no DOM.",
      ),
      prop(
        "id",
        "string",
        "Base for the generated trigger and content ids; also the wrapper id when as is set.",
      ),
      prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
      prop("onOpenChange", "(open: boolean) => void", "Receives the next open state."),
    ]),
    p("DialogTrigger", "trigger", "Button that opens the dialog.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Fragment merges the trigger onto your own element child.",
      ),
    ]),
    p("DialogContent", "content", "Modal dialog element.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop("aria-label", "string", "Accessible name for the dialog task."),
      prop("portal", "boolean", "Renders into document.body; on by default."),
      prop(
        "closedby",
        '"any" | "closerequest" | "none"',
        "Native dismissal policy; any adds light dismiss where supported.",
      ),
      prop("onClose", "(event) => void", "Native dialog close event."),
    ]),
  ],
  keyboard: [
    { keys: ["Escape"], action: "Closes and restores trigger focus." },
    { keys: ["Tab"], action: "Cycles inside the modal." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "DialogTrigger, DialogContent",
      meaning: "The dialog is open.",
    },
    { attribute: ":open", on: "DialogContent", meaning: "Native pseudo-class equivalent." },
  ],
  form: "No native form behavior; forms may live inside DialogContent.",
  accessibility: [
    "Give DialogContent an accessible name.",
    "Keep focus inside the modal until it closes.",
    "Include a clear way to finish or dismiss the task.",
  ],
  related: ["modal", "alert-dialog", "popover"],
  moreExamples: [
    {
      id: "command-palette",
      title: "Command palette",
      description:
        "Open a modal search from a ⌘K trigger, filter commands with Autocomplete, and run one to close the dialog.",
    },
  ],
});
