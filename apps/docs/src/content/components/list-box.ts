import { component, p, prop } from "../define.js";

export default component({
  slug: "list-box",
  title: "List Box",
  group: "navigation",
  summary: "A keyboard-friendly list for selecting an item.",
  analogy: "Like a tray of labelled choices with one highlighted card.",
  whenToUse: "Use it for choice lists that are not necessarily a form select.",
  steps: {
    main: "Start ListBox with an aria-label.",
    supporting: "Add ListBoxOption for each selectable item.",
    behavior: "Use ListBoxOptGroup when a long list needs labelled groups.",
    code: '<ListBox aria-label="Color">\n  <ListBoxOption value="red">Red</ListBoxOption>\n</ListBox>;',
  },
  imports: ["ListBox", "ListBoxOption", "ListBoxOptGroup", "ListBoxSeparator"],
  snippet:
    '<ListBox aria-label="Color">\n  <ListBoxOption value="red">Red</ListBoxOption>\n</ListBox>;',
  parts: [
    p("ListBox", "root", "Selectable list container.", true, false, [
      prop("aria-label", "string", "Names the list; nothing labels it automatically."),
      prop("value / defaultValue", "string", "Controlled or initial selection."),
      prop("onChange", "(value: string) => void", "Receives the next selection."),
      prop("orientation", '"vertical" | "horizontal"', "Arrow-key axis."),
    ]),
    p("ListBoxOptGroup", "root", "Optional labelled section.", true, true, [
      prop("aria-label", "string", "Names the group of options."),
    ]),
    p("ListBoxSeparator", "label", "Rule between groups of options.", true, true),
    p("ListBoxOption", "item", "Selectable option.", true, false, [
      prop("value", "string", "This option’s selection key."),
      prop("disabled", "boolean", "Disables the option."),
      prop(
        "textValue",
        "string",
        "Overrides the text crawled from children when markup makes it ambiguous.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowDown"], action: "Moves to and selects the next option." },
    { keys: ["ArrowUp"], action: "Moves to and selects the previous option." },
    { keys: ["Home"], action: "Moves to and selects the first option." },
    { keys: ["End"], action: "Moves to and selects the last option." },
    { keys: ["Enter"], action: "Selects the focused option." },
    { keys: ["Space"], action: "Selects the focused option." },
  ],
  stateHooks: [
    { attribute: "[data-selected]", on: "ListBoxOption", meaning: "The option is selected." },
    {
      attribute: ":focus-visible",
      on: "ListBoxOption",
      meaning: "The option has visible keyboard focus.",
    },
    { attribute: "[data-disabled]", on: "ListBoxOption", meaning: "The option is disabled." },
  ],
  form: "No native form behavior by itself.",
  accessibility: [
    "Give the list an aria-label when it has no visible heading.",
    "Keep the focused option visibly distinct from selected state.",
    "Do not put buttons or links inside an option.",
  ],
  related: ["menu", "select"],
});
