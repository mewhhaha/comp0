import { component, p, prop } from "../define.js";

export default component({
  slug: "file-trigger",
  title: "File Trigger",
  group: "actions",
  summary: "A visible label that asks the browser for files.",
  analogy: "Like asking a receptionist to open the filing cabinet.",
  whenToUse: "Use it when a person must choose local files.",
  steps: {
    main: "Style FileTrigger itself and give it clear words such as Upload photo.",
    supporting: "Pass native file props such as accept, multiple, name, and onChange directly.",
    behavior:
      "The native input stays visually hidden but focusable by default, so keyboard users can reach it.",
    code: '<FileTrigger name="photo">Upload photo</FileTrigger>;',
  },
  imports: ["FileTrigger"],
  snippet: '<FileTrigger name="photo">Upload photo</FileTrigger>;',
  parts: [
    p("FileTrigger", "trigger", "Native label that owns the visible trigger words.", true, false, [
      prop("name", "string", "Native form submission name."),
      prop("accept", "string", "Accepted file types using native input syntax."),
      prop("multiple", "boolean", "Allows more than one file to be selected."),
      prop("onChange", "(event: ChangeEvent) => void", "Receives the native file change event."),
    ]),
    p("file input", "input", "Visually hidden native file input owned by FileTrigger."),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Opens the browser file picker." },
    { keys: ["Space"], action: "Opens the browser file picker." },
  ],
  stateHooks: [],
  form: "The hidden input submits selected files using FileTrigger's name prop.",
  accessibility: [
    "Name the visible trigger after the file task.",
    "Show accepted file types in visible help when needed.",
    "The input ships visually hidden but focusable; do not re-hide it with the hidden attribute.",
  ],
  related: ["button", "text-field"],
});
