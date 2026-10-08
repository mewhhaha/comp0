import { component, p, prop } from "../define.js";

export default component({
  slug: "tag-group",
  title: "Tag Group",
  group: "navigation",
  summary: "A row of removable, selectable little labels.",
  analogy: "Like luggage tags: keep the ones that apply, pull off the rest.",
  whenToUse: "Use it for filters, keywords, and picked options.",
  steps: {
    main: "Start TagGroup with selection and removal callbacks.",
    supporting: "Add a visible Label, then put the tags inside TagList.",
    behavior: "Give every Tag a value; wire onRemove for Delete and value/onChange for selection.",
    code: '<TagGroup onRemove={remove}>\n  <Label>Filters</Label>\n  <TagList>\n    <Tag value="news">News</Tag>\n  </TagList>\n</TagGroup>;',
  },
  imports: ["Button", "Label", "Tag", "TagGroup", "TagList"],
  snippet:
    '<TagGroup onRemove={remove}>\n  <Label>Filters</Label>\n  <TagList>\n    <Tag value="news">News</Tag>\n  </TagList>\n</TagGroup>;',
  parts: [
    p("TagGroup", "root", "Selection and removal provider.", false, false, [
      prop(
        "as",
        "ElementType",
        "Renders a wrapper element that carries the root's DOM props; without it the root renders no DOM and DOM props are a type error.",
      ),
      prop("value / defaultValue", "string[]", "Controlled or initial selected tags."),
      prop("onChange", "(value: string[]) => void", "Receives the next selected tags."),
      prop(
        "onRemove",
        "(value: string) => void",
        "Receives a tag removed with Delete or Backspace.",
      ),
    ]),
    p("Label", "label", "Visible name connected to TagList.", true, false),
    p("TagList", "root", "Grid container and the tags' keyboard boundary.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop("aria-label", "string", "Names the tag list when no visible Label is shown."),
    ]),
    p("Tag", "item", "Removable, selectable label that can hold a control.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
      prop("value", "string", "This tag’s identity; required."),
      prop("disabled", "boolean", "Disables the tag."),
      prop(
        "textValue",
        "string",
        "Overrides the text crawled from children when markup makes it ambiguous.",
      ),
    ]),
  ],
  keyboard: [
    { keys: ["ArrowRight"], action: "Moves to the next tag." },
    { keys: ["ArrowLeft"], action: "Moves to the previous tag." },
    { keys: ["Home"], action: "Moves to the first tag." },
    { keys: ["End"], action: "Moves to the last tag." },
    { keys: ["Space"], action: "Toggles the focused tag's selection." },
    { keys: ["Enter"], action: "Toggles the focused tag's selection." },
    { keys: ["Delete"], action: "Removes the focused tag when onRemove is wired." },
    { keys: ["Backspace"], action: "Removes the focused tag when onRemove is wired." },
  ],
  stateHooks: [
    { attribute: "[data-selected]", on: "Tag", meaning: "The tag is selected." },
    { attribute: "[data-disabled]", on: "Tag", meaning: "The tag is disabled." },
    { attribute: ":focus-visible", on: "Tag", meaning: "The tag has keyboard focus." },
  ],
  form: "Selection does not create a native form value; mirror it into hidden inputs when a form needs it.",
  accessibility: [
    "Use a visible Label for the tag list, or give TagList an aria-label when no label is shown.",
    "Keep remove controls reachable by pointer; Delete removes from the keyboard.",
    "Show selection with more than color.",
  ],
  related: ["grid-list", "checkbox"],
});
