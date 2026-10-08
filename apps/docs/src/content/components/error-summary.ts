import { component, p, prop } from "../define.js";

export default component({
  slug: "error-summary",
  title: "Error Summary",
  group: "actions",
  summary: "A focused list of form errors that lets people jump directly to each invalid answer.",
  analogy: "Like a checklist at the top of a returned form, with every note pointing to its field.",
  whenToUse: "Use it after an unsuccessful submission in addition to inline FieldError messages.",
  steps: {
    main: "Conditionally render ErrorSummary with an ErrorSummaryTitle when validation fails.",
    supporting:
      "Put matching messages in ErrorSummaryList and link each ErrorSummaryLink to its field id.",
    behavior:
      "The summary focuses itself on mount by default; keep each inline FieldError visible and worded the same.",
    code: '<ErrorSummary>\n  <ErrorSummaryTitle>There is a problem</ErrorSummaryTitle>\n  <ErrorSummaryList>\n    <li>\n      <ErrorSummaryLink href="#email">Enter a valid email</ErrorSummaryLink>\n    </li>\n  </ErrorSummaryList>\n</ErrorSummary>;',
  },
  imports: [
    "Button",
    "ErrorSummary",
    "ErrorSummaryLink",
    "ErrorSummaryList",
    "ErrorSummaryTitle",
    "FieldError",
    "Input",
    "Label",
    "TextField",
  ],
  snippet:
    '<ErrorSummary><ErrorSummaryTitle>There is a problem</ErrorSummaryTitle><ErrorSummaryList><li><ErrorSummaryLink href="#email">Enter a valid email</ErrorSummaryLink></li></ErrorSummaryList></ErrorSummary>',
  parts: [
    p(
      "ErrorSummary",
      "root",
      "Assertive, programmatically focusable summary labelled by its title.",
      true,
      false,
      [
        prop("autoFocus", "boolean", "Moves focus to the summary on mount; enabled by default."),
        prop("tabIndex", "number", "Defaults to -1 so focus can land without adding a tab stop."),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
    p("ErrorSummaryTitle", "label", "Visible h2 that names the summary."),
    p("ErrorSummaryList", "region", "Native unordered list of validation messages."),
    p("ErrorSummaryLink", "item", "Native anchor pointing to one invalid control.", true, false, [
      prop("href", "string", "Fragment URL for the matching invalid control id."),
    ]),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves from the focused summary to its first error link." },
    { keys: ["Enter"], action: "Moves from an error link to its matching field." },
  ],
  stateHooks: [
    {
      attribute: ":focus-visible",
      on: "ErrorSummary",
      meaning: "The newly mounted summary received visible keyboard focus.",
    },
  ],
  form: "The summary submits nothing; its links point into the form and supplement inline FieldError messages.",
  accessibility: [
    "Render the summary only after validation fails so its alert and focus movement correspond to a new error state.",
    "Link every ErrorSummaryLink to the native control, or to the first invalid control in a grouped answer.",
    "Repeat every message beside its field with identical wording; the summary supplements inline errors rather than replacing them.",
    "After destructive success or navigation, move focus to the new logical context instead of restoring the submit button.",
  ],
  related: ["alert", "text-field", "fieldset"],
});
