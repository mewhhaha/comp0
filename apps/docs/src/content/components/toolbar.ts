import { component, p, prop } from "../define.js";

export default component({
  slug: "toolbar",
  title: "Toolbar",
  group: "actions",
  summary: "A labelled strip of controls that share one tab stop.",
  analogy: "Like the tool tray beside a workbench: everything at hand, one reach away.",
  whenToUse: "Use it when several related controls would otherwise each cost a Tab press.",
  steps: {
    main: "Wrap the controls in Toolbar and give it an aria-label.",
    supporting: "Group related toggles in ToggleButtonGroup so their relationship is announced.",
    behavior: "Pick orientation to match the layout; arrow keys follow it automatically.",
    code: '<Toolbar aria-label="Text formatting">\n  <ToggleButtonGroup type="multiple" aria-label="Text style">\n    <ToggleButton value="bold">Bold</ToggleButton>\n  </ToggleButtonGroup>\n</Toolbar>;',
  },
  imports: ["Toolbar", "ToggleButton", "ToggleButtonGroup"],
  snippet:
    '<Toolbar aria-label="Text formatting"><ToggleButtonGroup type="multiple" defaultValue={["bold"]} aria-label="Text style"><ToggleButton value="bold">Bold</ToggleButton><ToggleButton value="italic">Italic</ToggleButton></ToggleButtonGroup><ToggleButtonGroup type="single" defaultValue="left" aria-label="Alignment"><ToggleButton value="left">Left</ToggleButton><ToggleButton value="right">Right</ToggleButton></ToggleButtonGroup></Toolbar>',
  parts: [
    p(
      "Toolbar",
      "root",
      "Row of controls that shares one tab stop; arrow keys move between them.",
      true,
      false,
      [
        prop("aria-label", "string", "Names the toolbar for assistive technology."),
        prop(
          "orientation",
          '"horizontal" | "vertical"',
          'Arrow-key direction, announced via aria-orientation; defaults to "horizontal".',
        ),
      ],
    ),
    p(
      "ToggleButtonGroup",
      "root",
      "Optional selection group inside the toolbar; it announces the relationship and can manage which values are on.",
      true,
      true,
      [
        prop("aria-label", "string", "Names the group for assistive technology."),
        prop("type", '"single" | "multiple"', "Whether the group keeps one value or many."),
        prop(
          "value / defaultValue",
          "string | string[]",
          "Controlled or initial selection: a string for single, a string[] for multiple.",
        ),
        prop(
          "onChange",
          "(value: string | string[]) => void",
          'Receives the next selection; "" when a single group empties.',
        ),
      ],
    ),
    p("ToggleButton", "item", "Native button that owns one press target.", true, true, [
      prop("value", "string", "Identifies the button inside a selection-managing group."),
      prop("disabled", "boolean", "Removes the button from the toolbar's arrow-key order."),
      prop(
        "selected / defaultSelected",
        "boolean",
        "Controlled or initial on state when standalone.",
      ),
      prop("pending", "boolean", "Marks a busy action: disables the button and sets aria-busy."),
      prop(
        "command / commandfor",
        "string",
        "Native invoker attributes: the command to run and the id of the element it targets.",
      ),
    ]),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Moves into the toolbar to the last-used control; Tab again leaves.",
    },
    {
      keys: ["ArrowRight"],
      action: "Moves to the next control without wrapping.",
      scope: "horizontal",
    },
    {
      keys: ["ArrowLeft"],
      action: "Moves to the previous control without wrapping.",
      scope: "horizontal",
    },
    { keys: ["ArrowDown"], action: "Moves to the next control.", scope: "vertical" },
    { keys: ["ArrowUp"], action: "Moves to the previous control.", scope: "vertical" },
    { keys: ["Home"], action: "Moves to the first control." },
    { keys: ["End"], action: "Moves to the last control." },
    { keys: ["Enter"], action: "Presses the focused control." },
    { keys: ["Space"], action: "Presses the focused control." },
  ],
  stateHooks: [
    { attribute: "[data-orientation]", on: "Toolbar", meaning: "The arrow-key direction." },
    { attribute: "[data-selected]", on: "ToggleButton", meaning: "The button is on." },
  ],
  form: "A toolbar does not create form values; its controls submit their own.",
  accessibility: [
    "Give the toolbar an aria-label that names the task, such as Text formatting.",
    "Keep controls in a visual order that matches the arrow-key order.",
    "Horizontal arrow movement mirrors automatically when the toolbar inherits RTL direction.",
    "Nested composites like a listbox or menu keep their own arrow keys; do not double-handle them.",
  ],
  related: ["toggle-button", "menu"],
});
