import { component, p, prop } from "../define.js";

export default component({
  slug: "comparison",
  title: "Comparison",
  group: "navigation",
  summary:
    "Options side by side in a real table, so every value is read with its option and feature.",
  analogy: "Like the spec sheet next to two phones: the same rows, one column each.",
  whenToUse: "Use it to weigh plans, products, or alternatives against the same list of features.",
  steps: {
    main: "Start Comparison with a name, then add one ComparisonOption per option in the header row.",
    supporting:
      "Add a ComparisonRow per feature in ComparisonBody, with a ComparisonFeature and one ComparisonValue per option.",
    behavior:
      "Mark the suggested option with recommended and style the data attributes; use included for yes or no values so they have a text alternative.",
    code: '<Comparison aria-label="Plans">\n  <ComparisonHeader>\n    <tr>\n      <th scope="col">Feature</th>\n      <ComparisonOption value="pro" recommended>\n        Pro\n      </ComparisonOption>\n    </tr>\n  </ComparisonHeader>\n  <ComparisonBody>\n    <ComparisonRow>\n      <ComparisonFeature>Support</ComparisonFeature>\n      <ComparisonValue option="pro" included>\n        ✓\n      </ComparisonValue>\n    </ComparisonRow>\n  </ComparisonBody>\n</Comparison>;',
  },
  imports: [
    "Comparison",
    "ComparisonBody",
    "ComparisonFeature",
    "ComparisonHeader",
    "ComparisonOption",
    "ComparisonRow",
    "ComparisonValue",
  ],
  snippet:
    '<Comparison aria-label="Plans"><ComparisonHeader><tr><th scope="col">Feature</th><ComparisonOption value="pro">Pro</ComparisonOption></tr></ComparisonHeader><ComparisonBody><ComparisonRow><ComparisonFeature>Projects</ComparisonFeature><ComparisonValue option="pro">Unlimited</ComparisonValue></ComparisonRow></ComparisonBody></Comparison>',
  parts: [
    p("Comparison", "root", "Native table that holds the whole comparison.", true, false, [
      prop(
        "aria-label",
        "string",
        "Names the table when there is no native caption child or aria-labelledby.",
      ),
      prop(
        "as",
        "ElementType",
        "Renders another element in place of the default; Fragment merges the props into its single child.",
      ),
    ]),
    p("ComparisonHeader", "root", "Native thead holding the row of option headers."),
    p("ComparisonOption", "item", "Column header naming one option.", true, false, [
      prop("value", "string", "Identity that pairs the column with its ComparisonValue cells."),
      prop(
        "recommended",
        "boolean",
        "Marks the suggested option; announced as hidden text and exposed as data-recommended.",
      ),
      prop(
        "recommendedLabel",
        "string",
        "The text announced after the name of a recommended option; defaults to Recommended.",
      ),
    ]),
    p("ComparisonBody", "root", "Native tbody holding one row per feature."),
    p("ComparisonRow", "item", "Native tr that detects whether its values differ."),
    p("ComparisonFeature", "item", "Row header (th with scope=row) naming one feature."),
    p(
      "ComparisonValue",
      "item",
      "Cell holding the value of a feature for one option.",
      true,
      false,
      [
        prop("option", "string", "The value of the ComparisonOption this cell belongs to."),
        prop(
          "included",
          "boolean",
          "A yes or no value: adds the text Included or Not included and hides any children (the visual mark) from assistive technology.",
        ),
        prop("label", "string", "Overrides the text alternative of an included value."),
      ],
    ),
  ],
  keyboard: [],
  stateHooks: [
    {
      attribute: "[data-recommended]",
      on: "ComparisonOption, ComparisonValue",
      meaning:
        "The option is recommended; its cells share the attribute so a whole column can be highlighted.",
    },
    {
      attribute: "[data-differs]",
      on: "ComparisonRow, ComparisonValue",
      meaning: "The values in the row are not all the same.",
    },
    {
      attribute: "[data-included]",
      on: "ComparisonValue",
      meaning: "An included value that is true.",
    },
    {
      attribute: "[data-option]",
      on: "ComparisonValue",
      meaning: "The value of the option the cell belongs to.",
    },
  ],
  form: "No form behavior; a comparison presents data and submits nothing.",
  accessibility: [
    "It renders a native table, so screen readers announce the option and the feature for every value.",
    "Always name the table with a caption child, aria-label, or aria-labelledby; a warning appears in development without one.",
    "Give the empty corner cell visible or visually hidden text such as Feature.",
    "Recommendations and yes or no values have text, not only color or icons, so none depend on sight.",
    "Highlight with data-recommended and data-differs rather than adding text that repeats.",
  ],
  related: ["table", "visually-hidden", "meter"],
});
