import { component, p, prop } from "../define.js";

export default component({
  slug: "toggle-button",
  title: "Toggle Button",
  group: "actions",
  summary: "A button that stays on or off after a press.",
  analogy: "Like a light switch that shows its own position.",
  whenToUse: "Use one for an independent setting or a group for small formatting choices.",
  steps: {
    main: "Start with one ToggleButton.",
    supporting:
      "Wrap related toggles in ToggleButtonGroup; give each button a value when the group should manage the selection.",
    behavior:
      'Pass type="single" or type="multiple" with value/defaultValue and onChange on the group, or keep defaultSelected per button when the group only organizes them.',
    code: '<ToggleButtonGroup type="multiple" defaultValue={["bold"]} aria-label="Text style">\n  <ToggleButton value="bold">Bold</ToggleButton>\n</ToggleButtonGroup>;',
  },
  imports: ["ToggleButton", "ToggleButtonGroup"],
  snippet:
    '<ToggleButtonGroup type="multiple" defaultValue={["bold"]} aria-label="Text style"><ToggleButton value="bold">Bold</ToggleButton><ToggleButton value="italic">Italic</ToggleButton></ToggleButtonGroup>',
  parts: [
    p(
      "ToggleButtonGroup",
      "root",
      "Optional group; it announces the relationship and manages selection once type, value, defaultValue, or onChange is set.",
      true,
      true,
      [
        prop("aria-label", "string", "Names the group for assistive technology."),
        prop(
          "orientation",
          '"horizontal" | "vertical"',
          "Direction exposed through data-orientation for styling.",
        ),
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
    p("ToggleButton", "root", "Native button that owns the press target.", true, false, [
      prop("value", "string", "Identifies the button inside a selection-managing group."),
      prop(
        "selected / defaultSelected",
        "boolean",
        "Controlled or initial on state when standalone.",
      ),
      prop("onChange", "(selected: boolean) => void", "Receives the next on state."),
      prop("disabled", "boolean", "Disables the toggle."),
      prop(
        "command / commandfor",
        "string",
        "Invoker command and target id, forwarded to the native button.",
      ),
      prop("pending", "boolean", "Disables the button and sets aria-busy while work is in flight."),
    ]),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Toggles the button." },
    { keys: ["Space"], action: "Toggles the button." },
  ],
  stateHooks: [
    { attribute: "[data-selected]", on: "ToggleButton", meaning: "The button is on." },
    { attribute: "[data-disabled]", on: "ToggleButton", meaning: "It cannot change." },
  ],
  form: "Toggle buttons do not create native form values.",
  accessibility: [
    "Give icon-only toggles an aria-label.",
    "Make the selected state visible, not only color.",
    "Explain what on and off mean when it is not obvious.",
  ],
  related: ["button", "checkbox", "toolbar"],
});
