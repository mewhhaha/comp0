import { component, p, prop } from "../define.js";

export default component({
  slug: "progress-bar",
  title: "Progress Bar",
  group: "actions",
  summary: "A fully styleable progress indicator for how much of a task is done.",
  analogy: "Like a moving truck's loading gauge filling toward full.",
  whenToUse: "Use it while work completes over time, such as an upload.",
  steps: {
    main: "Add ProgressBar where the task's status belongs.",
    supporting: "Name it with a wired Label or an aria-label.",
    behavior:
      "Pass value as the completed fraction of max, or omit value while the total is unknown; add your own fill and size it with --comp0-progress-value.",
    code: '<ProgressBar aria-label="Uploading photos" value={0.4}>\n  <span className="fill" />\n</ProgressBar>;',
  },
  imports: ["ProgressBar"],
  snippet:
    '<ProgressBar aria-label="Uploading photos" value={0.4}>\n  <span className="fill" />\n</ProgressBar>;',
  parts: [
    p(
      "ProgressBar",
      "root",
      "Styleable div with progressbar semantics and an optional custom fill.",
      true,
      false,
      [
        prop(
          "value",
          "number",
          "Completed amount between 0 and max; omit it for an indeterminate bar.",
        ),
        prop("max", "number", "Upper bound of the range; defaults to 1."),
        prop(
          "children",
          "ReactNode | (state: ProgressBarState) => ReactNode",
          "Custom track contents or a render function receiving value, max, and percentage.",
        ),
        prop("aria-label", "string", "Names the bar when it is not labelled by visible text."),
        prop("aria-labelledby", "string", "Points to the visible text that names the bar."),
        prop(
          "aria-valuetext",
          "string",
          "Explains a determinate value when the number alone is not meaningful, such as “3 of 5 files”.",
        ),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
  ],
  keyboard: [],
  stateHooks: [
    {
      attribute: "[data-indeterminate]",
      on: "ProgressBar",
      meaning: "No value was given; the bar shows unknown progress.",
    },
    {
      attribute: "--comp0-progress-value",
      on: "ProgressBar",
      meaning: "Normalized 0–1 value for sizing a custom fill.",
    },
  ],
  form: "No form behavior; progress reports status and submits nothing.",
  accessibility: [
    "Always name the bar with a Label or an aria-label.",
    "Show the percentage as visible text when precision matters.",
    "Use Meter instead for a measurement that is not task progress.",
  ],
  related: ["meter"],
});
