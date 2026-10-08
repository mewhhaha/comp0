import { component, p, prop } from "../define.js";

export default component({
  slug: "select",
  title: "Select",
  group: "pickers",
  summary: "A button that opens a list and keeps one chosen value.",
  analogy: "Like a closed box that shows the label of the thing inside.",
  whenToUse: "Use it for one form choice from a known list.",
  steps: {
    main: "Start Select with a value or defaultValue.",
    supporting:
      "Put SelectValue inside SelectTrigger, then add SelectPopover beside it; wrap related options in a labelled SelectOptGroup.",
    behavior:
      "Select owns its value, field, form serialization, and open state; control the list with open, defaultOpen, and onOpenChange.",
    code: '<Select name="size" defaultValue="small">\n  <Label>Size</Label>\n  <SelectTrigger>\n    <SelectValue />\n  </SelectTrigger>\n  <SelectPopover>\n    <SelectOption value="small">Small</SelectOption>\n  </SelectPopover>\n</Select>;',
  },
  imports: [
    "Label",
    "Select",
    "SelectOptGroup",
    "SelectPopover",
    "SelectOption",
    "SelectTrigger",
    "SelectValue",
  ],
  snippet:
    '<Select name="size" defaultValue="small"><Label>Size</Label><SelectTrigger><SelectValue /></SelectTrigger><SelectPopover><SelectOptGroup label="Standard sizes"><SelectOption value="small">Small</SelectOption></SelectOptGroup></SelectPopover></Select>',
  parts: [
    p(
      "Select",
      "root",
      "Selected value, open state, and optional visually hidden native select provider.",
      false,
      false,
      [
        prop("as", "ElementType", "Renders a wrapper element; there is no DOM without it."),
        prop(
          "id",
          "string",
          "Base for the generated trigger, listbox, and field ids; also the wrapper id when `as` is set.",
        ),
        prop("value / defaultValue", "string", "Controlled or initial choice."),
        prop("onChange", "(value: string) => void", "Receives the next choice."),
        prop("open / defaultOpen", "boolean", "Controlled or initial open state of the listbox."),
        prop("onOpenChange", "(open: boolean) => void", "Receives the next open state."),
        prop("name", "string", "Submission name for the hidden native select."),
        prop("form", "string", "Associates the native select with a form by id."),
        prop("disabled / invalid / required", "boolean", "Field-wide states."),
      ],
    ),
    p("Label", "label", "Visible name connected to the trigger."),
    p("SelectTrigger", "trigger", "Button that opens choices.", true, false, [
      prop("disabled", "boolean", "Disables opening."),
      prop("aria-label", "string", "Names the trigger when there is no visible Label."),
    ]),
    p("SelectValue", "value", "Selected option text.", true, false, [
      prop("placeholder", "ReactNode", "Shown while nothing is selected."),
      prop("value", "ReactNode", "Overrides the displayed text for the selected option."),
    ]),
    p("SelectPopover", "content", "The listbox surface.", true, false, [
      prop("aria-label", "string", "Names the listbox when there is no visible Label."),
      prop(
        "placement",
        "PopoverPlacement",
        'Trigger side to open on, such as "bottom"; flips when there is no room.',
      ),
      prop("offset", "number", "Pixel gap between the trigger and the listbox."),
    ]),
    p("SelectOptGroup", "region", "Optional native-style group of related options.", true, true, [
      prop("label", "string", "Names the group before its options."),
    ]),
    p("SelectOption", "item", "Selectable option.", true, false, [
      prop("value", "string", "This option’s value."),
      prop("disabled", "boolean", "Disables the option."),
      prop(
        "textValue",
        "string",
        "Overrides the text crawled from children when markup makes it ambiguous.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Opens or chooses." },
    { keys: ["Space"], action: "Opens or chooses." },
    {
      keys: ["ArrowDown", "ArrowUp"],
      action: "Opens from the trigger, then moves through options.",
    },
    { keys: ["Home"], action: "Moves to the first option.", scope: "open list" },
    { keys: ["End"], action: "Moves to the last option.", scope: "open list" },
    { keys: ["Escape"], action: "Closes the list." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "SelectTrigger, SelectPopover",
      meaning: "Choices are open.",
    },
    {
      attribute: ":popover-open",
      on: "SelectPopover",
      meaning: "Native pseudo-class equivalent.",
    },
    { attribute: "[data-placeholder]", on: "SelectValue", meaning: "No value is selected." },
    { attribute: "[data-value]", on: "SelectValue", meaning: "A value is selected." },
  ],
  form: "When name or required is set, Select renders a visually hidden native select proxy for submission and validation; it is not an input type=hidden.",
  accessibility: [
    "Use a visible Label so the trigger and its listbox share a clear name; without one, name both parts explicitly.",
    "Give every SelectOptGroup a native label so grouped options have a name.",
    "Make the chosen value readable in SelectValue.",
    "Typing on the closed trigger selects the matching option, and typing in the open list moves to it, like a native select.",
    "Use native required feedback or FieldError to explain a missing choice.",
  ],
  related: ["combobox", "list-box"],
});
