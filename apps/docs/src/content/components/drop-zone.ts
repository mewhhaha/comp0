import { component, p, prop } from "../define.js";

export default component({
  slug: "drop-zone",
  title: "Drop Zone",
  group: "actions",
  summary: "A surface that accepts files dropped from the desktop.",
  analogy: "Like a mail slot: drag the right envelope over it and it tells you whether it fits.",
  whenToUse:
    "Use it when dragging files is a convenient alternative to choosing them in a file picker.",
  steps: {
    main: "Start with a DropZone and explain which files it accepts in visible text.",
    supporting:
      "Add a FileTrigger inside it so keyboard and touch users can choose the same files.",
    behavior:
      "Use accept on both parts and handle accepted and rejected drops separately when the distinction matters.",
    code: '<DropZone accept="image/*" onDrop={upload}>\n  <FileTrigger accept="image/*">Choose images</FileTrigger>\n</DropZone>;',
  },
  imports: ["DropZone", "FileTrigger"],
  snippet:
    '<DropZone accept="image/*" onDrop={upload}><p>Drop images here</p><FileTrigger accept="image/*">Choose images</FileTrigger></DropZone>',
  parts: [
    p(
      "DropZone",
      "root",
      "Native div that accepts matching files dropped from outside the page.",
      true,
      false,
      [
        prop("accept", "string", "Comma-separated MIME types, wildcards, or file extensions."),
        prop(
          "onDrop",
          "(files: File[]) => void",
          "Receives files only when every file matches accept.",
        ),
        prop(
          "onDropRejected",
          "(files: File[]) => void",
          "Receives files when one or more files do not match accept.",
        ),
        prop("disabled", "boolean", "Stops the zone from accepting file drags or drops."),
      ],
    ),
    p(
      "FileTrigger",
      "trigger",
      "Optional native file chooser using the same accept filter.",
      true,
      true,
    ),
  ],
  keyboard: [],
  stateHooks: [
    {
      attribute: "[data-drop-target]",
      on: "DropZone",
      meaning: "A file drag is over the zone.",
    },
    { attribute: "[data-accept]", on: "DropZone", meaning: "The dragged files match accept." },
    {
      attribute: "[data-reject]",
      on: "DropZone",
      meaning: "One or more dragged files do not match accept.",
    },
    { attribute: "[data-disabled]", on: "DropZone", meaning: "The zone ignores file drops." },
  ],
  form: "DropZone does not create form values. FileTrigger submits selected files with its native name prop.",
  accessibility: [
    "Describe accepted files in visible text; accept filters files but does not name the task for assistive technology.",
    "Always include FileTrigger or another keyboard-reachable file chooser; dropping is pointer-only.",
    "Show rejected files and upload errors in text, not only through the drop zone color.",
  ],
  related: ["file-trigger", "progress-bar"],
});
