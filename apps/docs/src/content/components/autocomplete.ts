import { component, p, prop } from "../define.js";

export default component({
  slug: "autocomplete",
  title: "Autocomplete",
  group: "pickers",
  summary: "A provider that gives an existing text field a filtered collection of completions.",
  analogy: "Like typing at a travel desk while the matching destinations stay within reach.",
  whenToUse:
    "Use it when the text remains the person’s query and choosing a result is a separate collection action; use Combobox when a choice must become the field value.",
  steps: {
    main: "Wrap the field and its result collection in Autocomplete; it adds no DOM element.",
    supporting:
      "Compose the field from SearchField and SearchFieldInput, then render results with ListBox and ListBoxOption.",
    behavior:
      "Pass filter to match item text. Handle collection selection or menu actions yourself—choosing a result never overwrites the query.",
    code: '<Autocomplete filter={contains}>\n  <SearchField>\n    <Label>Destination</Label>\n    <SearchFieldInput name="destination" />\n    <ListBox aria-label="Destinations">\n      <ListBoxOption value="paris">Paris</ListBoxOption>\n    </ListBox>\n  </SearchField>\n</Autocomplete>;',
  },
  imports: [
    "Autocomplete",
    "Label",
    "ListBox",
    "ListBoxOption",
    "Menu",
    "MenuItem",
    "MenuList",
    "MenuPopover",
    "MenuTrigger",
    "SearchField",
    "SearchFieldInput",
    "TextArea",
    "TextField",
  ],
  snippet:
    '<Autocomplete filter={contains}>\n  <SearchField>\n    <Label>Destination</Label>\n    <SearchFieldInput name="destination" />\n    <ListBox aria-label="Destinations">\n      <ListBoxOption value="paris">Paris</ListBoxOption>\n    </ListBox>\n  </SearchField>\n</Autocomplete>;',
  parts: [
    p(
      "Autocomplete",
      "root",
      "Wrapper-free provider for one editable query and a composed collection.",
      false,
      false,
      [
        prop("children", "ReactNode", "A text field and its ListBox or Menu collection."),
        prop(
          "filter",
          "(textValue: string, inputValue: string) => boolean",
          "Optional client-side match rule for collection item text; omit it for externally filtered results.",
        ),
        prop(
          "inputValue / defaultInputValue",
          "string",
          "Controlled or initial completion query; an inline editor may pass only its current token.",
        ),
        prop("onInputChange", "(value: string) => void", "Receives the next typed text."),
        prop(
          "disableAutoFocusFirst",
          "boolean",
          "Leaves virtual focus empty after the query changes.",
        ),
        prop(
          "disableVirtualFocus",
          "boolean",
          "Restores the collection’s normal DOM-focus behavior.",
        ),
      ],
    ),
    p(
      "SearchField",
      "root",
      "Editable query field; use TextField and TextArea for inline completion.",
      false,
      false,
      [
        prop(
          "id",
          "string",
          "Base id for the input; the label, description, and error ids derive from it.",
        ),
        prop("value / defaultValue", "string", "Controlled or initial field value."),
        prop("onChange", "(value: string) => void", "Receives the next value."),
        prop(
          "disabled / invalid / required",
          "boolean",
          "Field-wide states shared with every part.",
        ),
        prop("onSubmit", "(value: string) => void", "Receives the query when Enter submits."),
        prop("onClear", "() => void", "Runs when the query is erased."),
      ],
    ),
    p("Label", "label", "Visible name connected to the query field."),
    p(
      "SearchFieldInput",
      "input",
      "Native search input that provides the completion query.",
      true,
      false,
      [
        prop("name", "string", "Submission name for the typed query."),
        prop("placeholder", "string", "Hint text; never a replacement for Label."),
        prop(
          "autoComplete",
          "string",
          "Native browser autofill hint; independent from application suggestions.",
        ),
      ],
    ),
    p(
      "ListBox",
      "region",
      "Selectable completion results; it owns selection state and callbacks.",
      true,
      false,
      [
        prop("value / defaultValue", "string", "Controlled or initial selected item key."),
        prop("onChange", "(value: string) => void", "Receives the selected completion key."),
        prop("aria-label", "string", "Names results when no visible heading names them."),
        prop("orientation", '"vertical" | "horizontal"', "Arrow-key axis."),
      ],
    ),
    p("ListBoxOption", "item", "One selectable completion result.", true, false, [
      prop("value", "string", "Collection key passed to ListBox.onChange."),
      prop("disabled", "boolean", "Excludes this result from selection."),
      prop(
        "textValue",
        "string",
        "Matching and typeahead text when rich children do not provide a plain label.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowDown"], action: "Moves virtual focus to the next matching result." },
    { keys: ["ArrowUp"], action: "Moves virtual focus to the previous matching result." },
    { keys: ["Home"], action: "Keeps native caret movement and clears virtual focus." },
    { keys: ["End"], action: "Keeps native caret movement and clears virtual focus." },
    { keys: ["ArrowLeft"], action: "Returns to text editing and clears virtual focus." },
    { keys: ["ArrowRight"], action: "Returns to text editing and clears virtual focus." },
    { keys: ["Enter"], action: "Selects the active listbox item or runs the active menu item." },
    { keys: ["Escape"], action: "Uses the composed field or menu’s normal Escape behavior." },
  ],
  stateHooks: [
    {
      attribute: "[aria-activedescendant]",
      on: "SearchFieldInput, TextArea",
      meaning: "The query field points to the virtually focused completion.",
    },
    {
      attribute: "[aria-controls]",
      on: "SearchFieldInput, TextArea",
      meaning: "The query field points at its composed completion collection.",
    },
    {
      attribute: "[aria-autocomplete]",
      on: "SearchFieldInput, TextArea",
      meaning: "The field advertises its list of text-dependent completions.",
    },
    {
      attribute: "[data-active]",
      on: "ListBoxOption, MenuItem",
      meaning: "The item has the virtual keyboard highlight.",
    },
    {
      attribute: "[data-selected]",
      on: "ListBoxOption",
      meaning: "The collection selected this completion.",
    },
    {
      attribute: "[data-disabled]",
      on: "ListBoxOption, MenuItem",
      meaning: "The completion cannot be selected or activated.",
    },
  ],
  form: "The composed SearchFieldInput or TextArea owns native name and form serialization. ListBox selection and MenuItem actions stay separate from the typed query.",
  accessibility: [
    "Give the text field a visible Label and give its ListBox or MenuList a clear name when the purpose is not evident.",
    "Keep the active matching item mounted while virtual focus refers to it; use disableVirtualFocus when the collection should move DOM focus instead.",
    "Make empty and loading messages non-selectable, and do not use a completion as the only way to enter a value.",
  ],
  related: ["combobox", "search-field", "list-box"],
  moreExamples: [
    {
      id: "menu",
      title: "Searchable menu",
      description: "Filter command actions while Menu keeps its own activation behavior.",
    },
    {
      id: "recipients",
      title: "Email recipients",
      description:
        "Add matching contacts as recipient tokens and clear the query after each selection.",
    },
  ],
});
