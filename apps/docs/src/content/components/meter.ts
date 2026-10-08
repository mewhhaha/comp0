import { component, p, prop } from "../define.js";

export default component({
  slug: "meter",
  title: "Meter",
  group: "actions",
  summary: "A fully styleable gauge for a measurement within a known range.",
  analogy: "Like a fuel gauge: a level, not a task getting done.",
  whenToUse: "Use it for usage levels such as storage, battery, or password strength.",
  steps: {
    main: "Add Meter where the measurement belongs and pass value with min and max.",
    supporting: "Name it with a wired Label or an aria-label.",
    behavior:
      "Add your own fill inside Meter and size it with --comp0-meter-value; low, high, and optimum remain available as data attributes.",
    code: '<Meter aria-label="Storage used" value={64} min={0} max={100} low={50} high={85}>\n  <span className="fill" />\n</Meter>;',
  },
  imports: ["Meter"],
  snippet:
    '<Meter aria-label="Storage used" value={64} min={0} max={100}><span className="fill" /></Meter>',
  parts: [
    p(
      "Meter",
      "root",
      "Styleable div with meter semantics and an optional custom fill.",
      true,
      false,
      [
        prop("value", "number", "Current measurement between min and max."),
        prop("min / max", "number", "Range bounds; defaults are 0 and 1."),
        prop(
          "low / high / optimum",
          "number",
          "Thresholds exposed as data-low, data-high, and data-optimum for custom styling.",
        ),
        prop(
          "children",
          "ReactNode | (state: MeterState) => ReactNode",
          "Custom track contents or a render function receiving value, bounds, and percentage.",
        ),
        prop("aria-label", "string", "Names the gauge when it is not labelled by visible text."),
        prop("aria-labelledby", "string", "Points to the visible text that names the gauge."),
        prop(
          "aria-valuetext",
          "string",
          "Explains the value when the number alone is not meaningful, such as “64 GB used”.",
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
      attribute: "--comp0-meter-value",
      on: "Meter",
      meaning: "Normalized 0–1 value for sizing a custom fill.",
    },
    {
      attribute: "[data-low]",
      on: "Meter",
      meaning: "The provided low threshold value.",
    },
    {
      attribute: "[data-high]",
      on: "Meter",
      meaning: "The provided high threshold value.",
    },
    {
      attribute: "[data-optimum]",
      on: "Meter",
      meaning: "The provided optimum value.",
    },
  ],
  form: "No form behavior; a meter reports a measurement and submits nothing.",
  accessibility: [
    "Always name the gauge with a Label or an aria-label.",
    "Show the measurement as visible text, not only as a colored bar.",
    "Use ProgressBar instead when the value represents task completion.",
  ],
  related: ["progress-bar"],
});
