import { component, p, prop } from "../define.js";

export default component({
  slug: "code-editor",
  title: "Code Editor",
  group: "fields",
  summary: "A small native code editor that can switch between read-only display and editing.",
  analogy: "Like a scratch file: inspect it safely, then unlock it when changes are needed.",
  whenToUse:
    "Use it for short editable examples, configuration, templates, or code previews—not as a replacement for a full IDE.",
  steps: {
    main: "Start a TextField with Label and CodeEditor.",
    supporting: "Use native value, defaultValue, name, and onChange props just like a text area.",
    behavior:
      "Set readOnly while showing code; remove it to edit. Tab always leaves the editor instead of being trapped for indentation.",
    code: '<TextField>\n  <Label>Source code</Label>\n  <CodeEditor name="source" defaultValue={code} readOnly />\n</TextField>;',
  },
  imports: ["CodeEditor", "Description", "Label", "TextField"],
  snippet:
    '<TextField>\n  <Label>Source code</Label>\n  <Description>Tab moves to the next control.</Description>\n  <CodeEditor name="source" defaultValue={code} readOnly />\n</TextField>;',
  parts: [
    p("TextField", "root", "Optional field provider; it owns no DOM by default.", false, false, [
      prop(
        "id",
        "string",
        "Base id for the editor; the label, description, and error ids derive from it.",
      ),
      prop("value", "string", "Controlled editor value."),
      prop("defaultValue", "string", "Initial uncontrolled editor value."),
      prop("onChange", "(value: string) => void", "Receives the next value."),
      prop("disabled", "boolean", "Disables the editor."),
      prop("invalid", "boolean", "Marks the editor invalid."),
      prop("required", "boolean", "Requires a value when a form submits."),
    ]),
    p("Label", "label", "Native label linked to the editor.", true, false, [
      prop("htmlFor", "string", "Auto-wired to the editor; set it only to override."),
    ]),
    p("CodeEditor", "input", "Native textarea with code-friendly text defaults.", true, false, [
      prop("value", "string", "Controlled source text."),
      prop("defaultValue", "string", "Initial uncontrolled source text."),
      prop("onChange", "ChangeEventHandler", "Receives the native textarea change event."),
      prop("name", "string", "Submission name for the source text."),
      prop("readOnly", "boolean", "Keeps code focusable and selectable while preventing edits."),
      prop("wrap", '"hard" | "soft" | "off"', 'Line wrapping mode; defaults to "off".'),
      prop("spellCheck", "boolean", "Spell checking; defaults to false."),
      prop("autoCapitalize", "string", 'Automatic capitalization; defaults to "none".'),
      prop("autoCorrect", "string", 'Automatic correction; defaults to "off".'),
      prop("autoComplete", "string", 'Browser completion; defaults to "off".'),
    ]),
    p("Description", "feedback", "Optional linked editing instructions.", true, true),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves to the next control; it does not insert indentation." },
    { keys: ["Shift", "Tab"], action: "Moves to the previous control." },
  ],
  stateHooks: [
    { attribute: "[data-readonly]", on: "CodeEditor", meaning: "The code cannot be edited." },
    { attribute: "[data-disabled]", on: "CodeEditor", meaning: "The editor is disabled." },
    { attribute: "[data-invalid]", on: "CodeEditor", meaning: "The editor is invalid." },
    {
      attribute: "[data-focus-visible]",
      on: "CodeEditor",
      meaning: "Keyboard focus should show a visible ring.",
    },
  ],
  form: "CodeEditor submits its native name and complete source value. Read-only editors still submit; disabled editors do not.",
  accessibility: [
    "Give the editor a visible Label that names the code or configuration being edited.",
    "Use readOnly rather than disabled when people should still focus, scroll, select, and copy the code.",
    "CodeEditor is a native textarea, so it already exposes multi-line textbox semantics; do not add role=textbox, aria-multiline, or contentEditable.",
    "Tab moves to the next control. If an application adds Tab indentation, it must also provide and explain a keyboard command that leaves the editor.",
    "Treat syntax colors, squiggles, and token hovers as supplemental. Keep decorative highlighting hidden from assistive technology and pointer events, use Tooltip for hover surfaces, provide a documented command that shows the same information at the caret, and expose every diagnostic as text and a keyboard-reachable action.",
  ],
  related: ["text-area", "text-field", "editable", "tooltip"],
  moreExamples: [
    {
      id: "diagnostics",
      title: "Syntax highlighting and diagnostics",
      description:
        "Layer non-interactive syntax tokens over the native editor, add delayed pointer and keyboard-triggered hover details, then expose mocked LSP feedback as keyboard-reachable diagnostic actions.",
    },
  ],
});
