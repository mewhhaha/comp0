import { component, p, prop } from "../define.js";

export default component({
  slug: "tag-picker",
  title: "Tag Picker",
  group: "fields",
  summary: "An editable collection that turns chosen options into removable tags.",
  analogy:
    "Like a guest list: type a name, add it to the cards, and remove a card when plans change.",
  whenToUse: "Use it for multiple known choices such as recipients, skills, or filters.",
  steps: {
    main: "Start TagPicker with a TagList that renders its value as Tag children.",
    supporting:
      "Add a TagPickerInput inside TextField and offer TagPickerOption children in a ListBox.",
    behavior:
      "Pass name when every selected value should submit; selecting an option clears the input and removes that option from the list.",
    code: '<TagPicker name="framework">\n  {({ value }) => (\n    <>\n      <TagList aria-label="Selected frameworks">\n        {value.map((value) => (\n          <Tag key={value} value={value}>\n            {value}\n          </Tag>\n        ))}\n      </TagList>\n      <TextField>\n        <TagPickerInput aria-label="Add framework" />\n      </TextField>\n      <ListBox aria-label="Frameworks">\n        <TagPickerOption value="react">React</TagPickerOption>\n      </ListBox>\n    </>\n  )}\n</TagPicker>;',
  },
  imports: [
    "ListBox",
    "Tag",
    "TagList",
    "TagPicker",
    "TagPickerInput",
    "TagPickerOption",
    "TextField",
  ],
  snippet:
    '<TagPicker name="framework">{({ value, remove }) => <><TagList aria-label="Selected frameworks">{value.map((value) => <Tag key={value} value={value}>{value}<button type="button" onClick={() => remove(value)}>Remove</button></Tag>)}</TagList><TextField><TagPickerInput aria-label="Add framework" /></TextField><ListBox aria-label="Frameworks"><TagPickerOption value="react">React</TagPickerOption></ListBox></>}</TagPicker>',
  parts: [
    p(
      "TagPicker",
      "root",
      "State provider that composes selected tags, an editable query, and available options.",
      false,
      false,
      [
        prop("value / defaultValue", "string[]", "Controlled or initial unique tag values."),
        prop("onChange", "(value: string[]) => void", "Receives the next selected values."),
        prop("inputValue / defaultInputValue", "string", "Controlled or initial query text."),
        prop("onInputChange", "(value: string) => void", "Receives the next query text."),
        prop("name", "string", "Submits one hidden input per selected value."),
        prop("filter", 'AutocompleteProps["filter"]', "Optional match rule for available options."),
        prop("disabled", "boolean", "Disables adding, removing, and submitted values."),
      ],
    ),
    p("TagList", "region", "Grid of selected Tag rows.", true, false),
    p("Tag", "item", "Selected tag; may contain a pointer-reachable remove button.", true, false, [
      prop("value", "string", "Selected value removed by the picker state."),
    ]),
    p("TextField", "root", "Optional field wiring around the editable input.", false, true),
    p("TagPickerInput", "input", "Native text input for the option query.", true, false),
    p("ListBox", "region", "Available matching options.", true, false),
    p(
      "TagPickerOption",
      "item",
      "Available option; selected values are omitted automatically.",
      true,
      false,
      [prop("value", "string", "Unique value to add to the tag list.")],
    ),
  ],
  keyboard: [
    { keys: ["ArrowDown", "ArrowUp"], action: "Moves through matching options from the input." },
    { keys: ["Enter"], action: "Adds the active option." },
    {
      keys: ["Backspace", "ArrowLeft", "ArrowRight"],
      action: "Moves from an empty input to the last tag; use Left in LTR or Right in RTL.",
    },
    { keys: ["Backspace", "Delete"], action: "Removes the focused tag." },
  ],
  stateHooks: [
    { attribute: "[data-empty]", on: "TagPicker", meaning: "No values are selected." },
    { attribute: "[data-disabled]", on: "TagPicker", meaning: "The picker is disabled." },
    {
      attribute: "[data-active]",
      on: "TagPickerOption",
      meaning: "The option has the keyboard highlight.",
    },
  ],
  form: "TagPicker submits one hidden input per selected value under name and restores uncontrolled values on form reset.",
  accessibility: [
    "Give both the selected TagList and available ListBox clear names when visible labels do not supply them.",
    "Backspace or the inline-backward arrow from an empty input moves to the last tag; that arrow is Left in LTR and Right in RTL. Delete and Backspace remove a focused tag, so keep the tag text meaningful.",
    "Do not make color the only difference between selected and available options.",
  ],
  related: ["tag-group", "autocomplete", "list-box"],
});
