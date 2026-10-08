import { component, p, prop } from "../define.js";

export default component({
  slug: "search-field",
  title: "Search Field",
  group: "fields",
  summary: "A labelled search box with an optional erase button.",
  analogy: "Like a library search desk with an eraser beside the query.",
  whenToUse: "Use it for a query that filters or finds things.",
  steps: {
    main: "Start with SearchField, Label, and SearchFieldInput.",
    supporting:
      "Add SearchFieldClear if clearing a query is useful; it appears only while the query has text.",
    behavior: "Name the input when the query should be submitted.",
    code: '<SearchField>\n  <Label>Search</Label>\n  <SearchFieldInput name="q" />\n  <SearchFieldClear aria-label="Clear search" />\n</SearchField>;',
  },
  imports: ["Label", "SearchField", "SearchFieldClear", "SearchFieldInput"],
  snippet:
    '<SearchField><Label>Search</Label><SearchFieldInput name="q" /><SearchFieldClear>Clear</SearchFieldClear></SearchField>',
  parts: [
    p("SearchField", "root", "Field provider with no DOM by default.", false, false, [
      prop("as", "ElementType", "Renders a wrapper element; there is no DOM without it."),
      prop("value / defaultValue", "string", "Controlled or initial field value."),
      prop("onChange", "(value: string) => void", "Receives the next value."),
      prop("disabled / invalid / required", "boolean", "Field-wide states shared with every part."),
      prop("onSubmit", "(value: string) => void", "Receives the query when Enter submits."),
      prop("onClear", "() => void", "Runs when the query is erased."),
    ]),
    p("SearchFieldInput", "input", "Native search input.", true, false, [
      prop("name", "string", "Submission name for the query."),
      prop("placeholder", "string", "Hint text; never a replacement for Label."),
    ]),
    p(
      "SearchFieldClear",
      "trigger",
      "Optional native clear button shown while the query has text.",
      true,
      true,
    ),
  ],
  keyboard: [
    { keys: ["Enter"], action: "Submits the surrounding form." },
    { keys: ["Escape"], action: "Erases the query while it has text." },
    { keys: ["Tab"], action: "Moves to the clear button while the query has text." },
  ],
  stateHooks: [
    { attribute: "[data-invalid]", on: "SearchFieldInput", meaning: "The field is invalid." },
    { attribute: "[data-disabled]", on: "SearchFieldInput", meaning: "The field is disabled." },
  ],
  form: "SearchFieldInput submits its native name and query.",
  accessibility: [
    "Label the search purpose, even when the placeholder says Search.",
    "Give the clear button understandable text or an aria-label.",
    "Announce result counts outside the input when results update.",
    'Pass as="search" when this is the page\'s search landmark; the native element announces it.',
  ],
  related: ["text-field", "combobox"],
});
