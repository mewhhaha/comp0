import { component, p, prop } from "../define.js";

export default component({
  slug: "combobox",
  title: "Combobox",
  group: "pickers",
  summary: "A text box that can also offer matching choices.",
  analogy: "Like a librarian who listens while you type and suggests books.",
  whenToUse: "Use it when people may type to narrow a long set of choices.",
  steps: {
    main: "Start Combobox with a labelled ComboboxInput.",
    supporting:
      "Place ComboboxTrigger beside the input, then add ComboboxPopover as the listbox of results; group related results with ComboboxOptGroup.",
    behavior:
      "Combobox owns the selected value, field, form serialization, and open state; control the results with open, defaultOpen, and onToggle.",
    code: '<Combobox name="city">\n  <Label>City</Label>\n  <ComboboxInput />\n  <ComboboxTrigger aria-label="Show suggestions" />\n  <ComboboxPopover>\n    <ComboboxOption value="Paris">Paris</ComboboxOption>\n  </ComboboxPopover>\n</Combobox>;',
  },
  imports: [
    "Combobox",
    "ComboboxInput",
    "ComboboxOptGroup",
    "ComboboxOption",
    "ComboboxPopover",
    "ComboboxTrigger",
    "Label",
  ],
  snippet:
    '<Combobox name="city"><Label>City</Label><ComboboxInput /><ComboboxTrigger aria-label="Show suggestions" /><ComboboxPopover><ComboboxOptGroup label="Europe"><ComboboxOption value="Paris">Paris</ComboboxOption></ComboboxOptGroup></ComboboxPopover></Combobox>',
  parts: [
    p(
      "Combobox",
      "root",
      "Selected-value, open-state, and form-serialization provider.",
      false,
      false,
      [
        prop("as", "ElementType", "Renders a wrapper element; there is no DOM without it."),
        prop("value / defaultValue", "string", "Controlled or initial committed option."),
        prop("onChange", "(value: string) => void", "Receives the committed option."),
        prop("inputValue / defaultInputValue", "string", "Controlled or initial editable text."),
        prop("onInputChange", "(value: string) => void", "Receives the editable text."),
        prop("open / defaultOpen", "boolean", "Controlled or initial open state of the results."),
        prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
        prop("filter", "(textValue, inputValue) => boolean", "Custom match rule for results."),
        prop(
          "autoHighlight",
          "boolean",
          "Activates the first visible enabled option whenever the editable text changes.",
        ),
        prop("name", "string", "Submission name."),
        prop("form", "string", "Associates the combobox value with a form by id."),
      ],
    ),
    p("Label", "label", "Visible name connected to the input."),
    p(
      "ComboboxInput",
      "input",
      "Native text input that owns editing and required validity.",
      true,
      false,
      [
        prop("placeholder", "string", "Hint text; never a replacement for Label."),
        prop("aria-label", "string", "Names the input when there is no visible Label."),
        prop("disabled / required", "boolean", "Override the field-wide state for this control."),
      ],
    ),
    p(
      "ComboboxTrigger",
      "trigger",
      "Optional button that opens or closes the suggestions with a pointer.",
      true,
      true,
      [
        prop(
          "aria-label",
          "string",
          'Names the button; defaults to the English "Show suggestions".',
        ),
        prop("disabled", "boolean", "Disables the trigger and inherits Combobox.disabled."),
      ],
    ),
    p("ComboboxPopover", "content", "The listbox results surface.", true, false, [
      prop("aria-label", "string", "Names the results list when there is no visible Label."),
      prop(
        "placement",
        "PopoverPlacement",
        'Input side to open on, such as "bottom"; flips when there is no room.',
      ),
      prop("offset", "number", "Pixel gap between the input and the listbox."),
    ]),
    p("ComboboxOptGroup", "region", "Optional native-style group of related results.", true, true, [
      prop("label", "string", "Names the group before its results."),
    ]),
    p("ComboboxOption", "item", "Selectable result.", true, false, [
      prop("value", "string", "This result’s value."),
      prop("disabled", "boolean", "Disables the result."),
      prop(
        "textValue",
        "string",
        "Overrides the text crawled from children when markup makes it ambiguous.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowDown"], action: "Opens the results or moves to the next option." },
    {
      keys: ["ArrowUp"],
      action: "Moves to the previous option, or the last when none is active.",
    },
    { keys: ["Home"], action: "Moves to the first option.", scope: "open results" },
    { keys: ["End"], action: "Moves to the last option.", scope: "open results" },
    {
      keys: ["Enter"],
      action: "Selects the active option from the input or opens from ComboboxTrigger.",
    },
    { keys: ["Space"], action: "Opens suggestions from ComboboxTrigger." },
    { keys: ["Escape"], action: "Closes results." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "ComboboxInput, ComboboxTrigger, ComboboxPopover",
      meaning: "Results are open.",
    },
    {
      attribute: ":popover-open",
      on: "ComboboxPopover",
      meaning: "Native pseudo-class equivalent.",
    },
    { attribute: "[data-selected]", on: "ComboboxOption", meaning: "Option is selected." },
    {
      attribute: "[data-active]",
      on: "ComboboxOption",
      meaning: "Option is active and receives the visible keyboard highlight.",
    },
    {
      attribute: "[aria-activedescendant]",
      on: "ComboboxInput",
      meaning: "The input points to the keyboard-active option while focus stays in the input.",
    },
  ],
  form: "Combobox.name owns selected-value serialization. ComboboxInput owns text editing and required validity.",
  accessibility: [
    "Use a visible Label so the input and results list share a clear name; without one, name both parts explicitly.",
    "Give every ComboboxOptGroup a native label so grouped results have a name.",
    "Keep option text specific enough to distinguish matches.",
    "Do not hide required instructions only in the result list.",
  ],
  related: ["select", "autocomplete", "search-field"],
});
