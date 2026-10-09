import { component, p, prop } from "../define.js";

export default component({
  slug: "output",
  title: "Output",
  group: "fields",
  summary: "The native output element for a result computed from other controls.",
  analogy: "Like the total on a receipt: it changes when the items do, and nobody types into it.",
  whenToUse:
    "Use it for a calculated value such as a price, a total, or a converted unit that follows one or more inputs.",
  steps: {
    main: "Render Output where the result belongs and put the computed value in as its children.",
    supporting: "Point htmlFor at the ids of the controls the result is computed from.",
    behavior:
      "Recompute the children when an input changes; the implicit status role announces the new result politely. Give it a name to submit it with the form.",
    code: '<>\n  <Slider id="seats" aria-label="Seats" value={seats} onChange={setSeats} />\n  <Output htmlFor="seats" name="total">\n    ${seats * 12}\n  </Output>\n  ;\n</>;',
  },
  imports: ["Output"],
  snippet: '<Output htmlFor="seats" name="total">$24</Output>',
  parts: [
    p(
      "Output",
      "value",
      "Native output element with an implicit polite status role.",
      true,
      false,
      [
        prop(
          "htmlFor",
          "string | string[]",
          "The ids of the controls the result is computed from; a list is joined with spaces.",
        ),
        prop("name", "string", "Submits the result with its form under this name."),
        prop("form", "string", "The id of the form the output belongs to when it is outside it."),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
  ],
  keyboard: [],
  stateHooks: [],
  form: "Submits its text content under name, and resets to its default value with the form.",
  accessibility: [
    "The implicit status role announces each change politely, so keep the content to the result itself and put the label in a separate element.",
    "Name what the result is with visible text next to it, or with aria-label or aria-labelledby.",
    "Avoid recomputing on every keystroke of a text input when the announcements would be noisy; commit on change instead.",
    "Output is a native element, so as is only for styling needs; the default keeps the native semantics.",
  ],
  related: ["slider", "meter", "status"],
});
