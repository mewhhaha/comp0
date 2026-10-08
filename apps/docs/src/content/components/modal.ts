import { component, p, prop } from "../define.js";

export default component({
  slug: "modal",
  title: "Modal",
  group: "pickers",
  summary: "A complete modal task composed from the Dialog primitives.",
  analogy: "Like a temporary workbench placed over the page until one focused job is finished.",
  whenToUse:
    "Use this composition for short forms or focused tasks that must pause interaction with the page behind them.",
  steps: {
    main: "Start with Dialog and a DialogTrigger.",
    supporting: "Compose the heading, content, and actions inside DialogContent.",
    behavior: "Name the content from its visible heading and provide an explicit close action.",
    code: '<Dialog>\n  <DialogTrigger>Edit profile</DialogTrigger>\n  <DialogContent aria-labelledby="profile-title">\n    <h2 id="profile-title">Edit profile</h2>\n  </DialogContent>\n</Dialog>;',
  },
  imports: ["Dialog", "DialogContent", "DialogTrigger"],
  snippet:
    '<Dialog>\n  <DialogTrigger>Edit profile</DialogTrigger>\n  <DialogContent aria-labelledby="profile-title">\n    <h2 id="profile-title">Edit profile</h2>\n  </DialogContent>\n</Dialog>;',
  parts: [
    p("Dialog", "root", "Wrapper-free provider for the composed modal state.", false, false, [
      prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
      prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
    ]),
    p("DialogTrigger", "trigger", "Button that opens the modal.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Fragment merges the trigger onto your own element child.",
      ),
    ]),
    p("DialogContent", "content", "Native modal surface containing the task.", true, false, [
      prop("aria-labelledby", "string", "Points to the modal's visible heading."),
      prop("portal", "boolean", "Renders into document.body; on by default."),
      prop(
        "closedby",
        '"any" | "closerequest" | "none"',
        "Native dismissal policy; any adds light dismiss where supported.",
      ),
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
      meaning: "The modal is open.",
    },
    { attribute: ":open", on: "DialogContent", meaning: "Native pseudo-class equivalent." },
  ],
  form: "Forms inside DialogContent submit normally; method=dialog closes the modal without navigation.",
  accessibility: [
    "Connect DialogContent to a visible heading with aria-labelledby.",
    "Keep the task short enough to understand without the page behind it.",
    "Include an explicit close action even when Escape can dismiss the modal.",
  ],
  related: ["dialog", "alert-dialog"],
  moreExamples: [
    {
      id: "drawer",
      title: "Right-side drawer",
      description: "Present a focused modal task from the right edge of the viewport.",
    },
  ],
});
