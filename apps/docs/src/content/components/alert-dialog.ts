import { component, p, prop } from "../define.js";

export default component({
  slug: "alert-dialog",
  title: "Alert Dialog",
  group: "pickers",
  summary: "A modal layer for a serious decision that needs attention.",
  analogy: "Like a stop sign before a dangerous turn.",
  whenToUse: "Use it before destructive or hard-to-undo actions.",
  steps: {
    main: "Start AlertDialog with the button that begins the decision.",
    supporting: "Put plain consequences and clear choices in AlertDialogContent.",
    behavior: "Make the safe or cancel choice easy to find.",
    code: '<AlertDialog>\n  <DialogTrigger>Delete</DialogTrigger>\n  <AlertDialogContent aria-label="Delete item">This cannot be undone.</AlertDialogContent>\n</AlertDialog>;',
  },
  imports: ["AlertDialog", "AlertDialogContent", "DialogTrigger"],
  snippet:
    '<AlertDialog>\n  <DialogTrigger>Delete</DialogTrigger>\n  <AlertDialogContent aria-label="Delete item">This cannot be undone.</AlertDialogContent>\n</AlertDialog>;',
  parts: [
    p("AlertDialog", "root", "Modal open-state provider for an urgent decision.", false, false, [
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
    p("DialogTrigger", "trigger", "Button that opens the alert.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Fragment merges the trigger onto your own element child.",
      ),
    ]),
    p("AlertDialogContent", "content", "Modal alert dialog content.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop("aria-label", "string", "Accessible name for the decision."),
      prop("portal", "boolean", "Renders into document.body; on by default."),
      prop(
        "closedby",
        '"any" | "closerequest" | "none"',
        "Native dismissal policy; none blocks Escape when the decision must be explicit.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["Escape"], action: "Closes when dismissal is allowed." },
    { keys: ["Tab"], action: "Cycles inside the modal." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "DialogTrigger, AlertDialogContent",
      meaning: "The alert is open.",
    },
    { attribute: ":open", on: "AlertDialogContent", meaning: "Native pseudo-class equivalent." },
  ],
  form: "No native form behavior; put a confirmation form inside when needed.",
  accessibility: [
    "Name the consequence, not just the button.",
    "Put the safer choice where it is easy to find.",
    "Do not use an alert dialog for ordinary, reversible actions.",
  ],
  related: ["dialog", "button"],
});
