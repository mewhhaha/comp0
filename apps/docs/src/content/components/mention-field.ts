import { component, p, prop } from "../define.js";

export default component({
  slug: "mention-field",
  title: "Mention Field",
  group: "fields",
  summary:
    "A multi-line field that completes a token beside the caret without replacing the surrounding message.",
  analogy:
    "Like tagging a teammate in a note: type @, narrow the names, and insert one exactly where you are writing.",
  whenToUse:
    "Use it for people, topics, slash commands, or other token completions inside longer text.",
  steps: {
    main: "Start MentionField with a Label and MentionFieldInput.",
    supporting:
      "Add MentionFieldPopover with an explicitly labelled ListBox and its ListBoxOption suggestions; the surface follows the active token at the caret.",
    behavior:
      "Pass triggers for token prefixes and filter for matching. Selection replaces only the active token and returns focus to the message.",
    code: '<MentionField triggers={["@"]}>\n  <Label>Message</Label>\n  <MentionFieldInput name="message" />\n  <MentionFieldPopover>\n    <ListBox aria-label="Teammates">\n      <ListBoxOption value="Aisha">@Aisha</ListBoxOption>\n    </ListBox>\n  </MentionFieldPopover>\n</MentionField>;',
  },
  imports: [
    "Label",
    "ListBox",
    "ListBoxOption",
    "MentionField",
    "MentionFieldInput",
    "MentionFieldPopover",
  ],
  snippet:
    '<MentionField triggers={["@"]}>\n  <Label>Message</Label>\n  <MentionFieldInput name="message" />\n  <MentionFieldPopover>\n    <ListBox aria-label="Teammates">\n      <ListBoxOption value="Aisha">@Aisha</ListBoxOption>\n    </ListBox>\n  </MentionFieldPopover>\n</MentionField>;',
  parts: [
    p(
      "MentionField",
      "root",
      "Wrapper-free field provider that owns the message, active token, and caret position.",
      false,
      false,
      [
        prop(
          "id",
          "string",
          "Base id for the message input; the label, description, and error ids derive from it.",
        ),
        prop("value", "string", "Controlled message text."),
        prop("defaultValue", "string", "Initial uncontrolled message text."),
        prop("onChange", "(value: string) => void", "Receives the next complete message."),
        prop(
          "triggers",
          "readonly string[]",
          "Characters that begin a completion token; defaults to @.",
        ),
        prop(
          "filter",
          "(textValue: string, query: string) => boolean",
          "Optional client-side match rule for suggestion text.",
        ),
        prop(
          "disabled / invalid / required",
          "boolean",
          "Field-wide states shared with every part.",
        ),
        prop("as", "ElementType", "Renders a wrapper element; there is no DOM without it."),
      ],
    ),
    p("Label", "label", "Native label connected to the message input."),
    p(
      "MentionFieldInput",
      "input",
      "Native textarea that tracks the token and caret without moving DOM focus.",
      true,
      false,
      [
        prop("name", "string", "Submission name for the complete message."),
        prop("placeholder", "string", "Hint text; never a replacement for Label."),
      ],
    ),
    p(
      "MentionFieldPopover",
      "content",
      "Caret-anchored floating surface around the suggestion collection.",
      true,
      false,
      [prop("offset", "number", "Gap from the caret in pixels; defaults to 4.")],
    ),
    p("ListBox", "root", "Explicit labelled collection of matching completions.", true, false, [
      prop("aria-label", "string", "Accessible name for the suggestion collection."),
      prop(
        "value",
        "string",
        "Unused here: choosing a suggestion inserts it instead of keeping it selected.",
      ),
      prop("orientation", '"vertical" | "horizontal"', "Arrow-key axis."),
    ]),
    p("ListBoxOption", "item", "One token completion.", true, false, [
      prop("value", "string", "Text inserted after the active trigger."),
      prop("disabled", "boolean", "Excludes this suggestion from selection."),
      prop("textValue", "string", "Matching text when children contain rich content."),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowDown"], action: "Moves virtual focus to the next suggestion." },
    { keys: ["ArrowUp"], action: "Moves virtual focus to the previous suggestion." },
    { keys: ["Enter"], action: "Inserts the active suggestion at the caret." },
    { keys: ["Escape"], action: "Closes suggestions without changing the message." },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Moves the native caret and updates the active token.",
    },
  ],
  stateHooks: [
    {
      attribute: "[data-mention-field]",
      on: "MentionField",
      meaning: "Optional DOM root for the mention field.",
    },
    {
      attribute: "[data-mention-active]",
      on: "MentionFieldInput",
      meaning: "The caret is inside a completion token.",
    },
    {
      attribute: "[data-open]",
      on: "MentionFieldPopover",
      meaning: "Suggestions are visible.",
    },
    {
      attribute: "[data-trigger]",
      on: "MentionFieldPopover",
      meaning: "The active token trigger, such as @ or #.",
    },
    {
      attribute: "[data-active]",
      on: "ListBoxOption",
      meaning: "The suggestion has the virtual keyboard highlight.",
    },
    {
      attribute: "[aria-activedescendant]",
      on: "MentionFieldInput",
      meaning: "The textarea points to the active suggestion while retaining focus.",
    },
  ],
  form: "MentionFieldInput submits the complete native textarea value under its name.",
  accessibility: [
    "Give MentionFieldInput a visible Label and name the explicit ListBox when the field label does not describe its suggestions.",
    "Keep typed text valid without a selected suggestion; mention completion must remain optional.",
    "Render the virtually focused ListBoxOption while aria-activedescendant points to it.",
    "Do not trigger suggestions inside words such as email addresses.",
  ],
  related: ["autocomplete", "list-box", "text-area"],
});
