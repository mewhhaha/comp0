import { component, p, prop } from "../define.js";

export default component({
  slug: "citation",
  title: "Citation",
  group: "navigation",
  summary: "Numbered inline references that link to a list of sources.",
  analogy: "Like footnotes: a small number in the text, the full reference at the bottom.",
  whenToUse:
    "Use it for answers, articles, and summaries that cite where a claim comes from, including text that is still being written.",
  steps: {
    main: "Wrap the text and the list in Citations, then add a Source with a value and title for each source.",
    supporting: "Put a Citation with the matching value after each claim it supports.",
    behavior:
      "Numbers follow the order of the sources in the list; each citation is named like Source 2: Title and links to its entry.",
    code: '<Citations>\n  <p>\n    Tea grows at altitude <Citation value="atlas" />.\n  </p>\n  <Sources aria-label="Sources">\n    <Source value="atlas" title="Tea atlas" href="https://example.com" />\n  </Sources>\n</Citations>;',
  },
  imports: ["Citation", "Citations", "Source", "Sources"],
  snippet:
    '<Citations><p>Tea grows at altitude <Citation value="atlas" />.</p><Sources aria-label="Sources"><Source value="atlas" title="Tea atlas" /></Sources></Citations>',
  parts: [
    p(
      "Citations",
      "root",
      "Connects citations to the source list; the sources can sit anywhere.",
      false,
      false,
      [
        prop(
          "as",
          "ElementType",
          "Renders a wrapper element; without it the root renders no DOM and DOM props are a type error.",
        ),
      ],
    ),
    p("Citation", "trigger", "Inline link to a source, shown as its number.", true, false, [
      prop("value", "string", "The value of the Source this citation points at."),
      prop(
        "children",
        "ReactNode",
        "Replaces the default number such as [2]; the accessible name stays Source 2: Title.",
      ),
      prop(
        "as",
        "ElementType",
        "Renders another element in place of the default; Fragment merges the props into its single child.",
      ),
    ]),
    p("Sources", "root", "Native ordered list of sources.", true, false, [
      prop("aria-label", "string", "Names the list when no visible heading does."),
    ]),
    p("Source", "item", "List item for one source, with its title linked to href.", true, false, [
      prop("value", "string", "Identity that pairs the source with its citations."),
      prop("title", "string", "The name of the source, shown and announced with each citation."),
      prop("href", "string", "Where the source lives; the title links there when given."),
    ]),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves focus between citations and source links." },
    { keys: ["Enter"], action: "Follows the focused citation to its source entry." },
  ],
  stateHooks: [
    {
      attribute: "[data-number]",
      on: "Citation, Source",
      meaning: "The 1-based position of the source in the list.",
    },
    {
      attribute: "[data-missing]",
      on: "Citation",
      meaning: "No Source has the value; the citation renders as an inert span.",
    },
  ],
  form: "No form behavior.",
  accessibility: [
    "A bare number is meaningless to a screen reader, so each citation is named Source 2: Title.",
    "Citations are real links to the source entry, so they work without script and show where focus lands.",
    "A citation to a missing source degrades to an inert Unknown source span and warns in development; it stays silent inside a busy region while the answer is still arriving.",
    "Name the list with a heading or aria-label so people can find it.",
  ],
  related: ["link", "busy-region", "feed"],
});
