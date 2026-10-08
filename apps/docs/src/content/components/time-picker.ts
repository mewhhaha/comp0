import { component, p, prop } from "../define.js";

export default component({
  slug: "time-picker",
  title: "Time Picker",
  group: "pickers",
  summary: "A typed time input with a custom list of useful times.",
  analogy: "Like writing an appointment time or choosing one from the receptionist’s schedule.",
  whenToUse:
    "Use this composition when people may type an exact time but a short set of common times speeds up selection.",
  steps: {
    main: "Keep a labelled TimeField as the editable source of truth, and hide its browser-owned indicator when adding the custom trigger.",
    supporting: "Open a ListBox of times from a PopoverTrigger beside the field.",
    behavior: "Synchronize list selection with the field and close the popover after a choice.",
    code: '<>\n  <Label htmlFor="time">Meeting time</Label>\n  <TimeField id="time" name="time" defaultValue="09:00" />\n  <Popover>\n    <PopoverTrigger aria-label="Choose time" />\n    <PopoverContent>\n      <ListBox aria-label="Available times">\n        <ListBoxOption value="09:00">9:00 AM</ListBoxOption>\n      </ListBox>\n    </PopoverContent>\n  </Popover>\n</>;',
  },
  imports: [
    "Label",
    "ListBox",
    "ListBoxOption",
    "Popover",
    "PopoverContent",
    "PopoverTrigger",
    "TimeField",
  ],
  snippet:
    '<>\n  <Label htmlFor="time">Meeting time</Label>\n  <TimeField id="time" name="time" defaultValue="09:00" />\n  <Popover>\n    <PopoverTrigger aria-label="Choose time" />\n    <PopoverContent>\n      <ListBox aria-label="Available times">\n        <ListBoxOption value="09:00">9:00 AM</ListBoxOption>\n      </ListBox>\n    </PopoverContent>\n  </Popover>\n</>;',
  parts: [
    p("Label", "label", "Visible name connected to the TimeField."),
    p("TimeField", "input", "Native editable time input and form control.", true, false, [
      prop("value", "string", "Controlled time as HH:mm."),
      prop("name", "string", "Submission name for the time value."),
      prop("onChange", "(event) => void", "Receives typed native input changes."),
    ]),
    p("Popover", "root", "Wrapper-free provider for the suggested-time popover.", false, false, [
      prop(
        "id",
        "string",
        "Base for the generated trigger and content ids; also the wrapper id when as is set.",
      ),
      prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
      prop("onOpenChange", "(open: boolean) => void", "Receives the next open state."),
    ]),
    p("PopoverTrigger", "trigger", "Icon button that opens the time suggestions.", true, false, [
      prop("aria-label", "string", "Names the icon-only trigger."),
    ]),
    p("PopoverContent", "content", "Floating surface for the suggested times.", true, false, [
      prop("placement", "PopoverPlacement", "Places the surface beside the trigger."),
      prop("offset", "number", "Pixel gap between the trigger and surface."),
    ]),
    p("ListBox", "region", "Selectable collection synchronized with the TimeField.", true, false, [
      prop("value", "string", "The selected HH:mm value, kept in sync with the TimeField."),
      prop("orientation", '"vertical" | "horizontal"', "Arrow-key axis."),
    ]),
    p("ListBoxOption", "item", "One localized label backed by an HH:mm value.", true, false, [
      prop("value", "string", "The HH:mm value this option selects."),
      prop("textValue", "string", "Text used for typeahead when the label is not plain text."),
      prop("disabled", "boolean", "Disables the option."),
    ]),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Opens from the trigger or selects the focused time." },
    { keys: ["Space"], action: "Opens from the trigger or selects the focused time." },
    { keys: ["Escape"], action: "Closes the suggestions and returns focus." },
    { keys: ["ArrowUp", "ArrowDown"], action: "Moves through the suggested times." },
  ],
  stateHooks: [
    { attribute: "[data-open]", on: "PopoverTrigger", meaning: "The suggestions are open." },
    { attribute: "[data-selected]", on: "ListBoxOption", meaning: "The field uses this time." },
    { attribute: "[data-value]", on: "TimeField", meaning: "The field has a time value." },
  ],
  form: "TimeField remains the native form control; give it a name and it submits the synchronized HH:mm value.",
  accessibility: [
    "Keep the TimeField editable so the suggested list is never the only way to enter a time.",
    "When adding a separate PopoverTrigger, you must hide the browser-owned indicator so only one picker button is visible.",
    "Name the icon-only trigger and the list of suggested times separately.",
    "Format visible options for the locale while keeping stable HH:mm values for the field and form.",
  ],
  related: ["date-picker", "date-field", "list-box"],
});
