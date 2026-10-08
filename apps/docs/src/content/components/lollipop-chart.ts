import { component, p, prop } from "../define.js";

export default component({
  slug: "lollipop-chart",
  title: "Lollipop Chart",
  group: "charts",
  summary: "A categorical comparison that pairs a thin value stem with a prominent endpoint.",
  analogy:
    "Like a row of pins on a measuring line: the stem gives context and the dot makes the value easy to find.",
  whenToUse:
    "Use it for ranked comparisons where bars feel too heavy and the endpoint deserves emphasis.",
  steps: {
    main: "Start LollipopChart with labelled values and visible category and value axis labels.",
    supporting:
      "Render each endpoint with LollipopChartLollipop so the value and category share one keyboard-reachable mark.",
    behavior:
      "Keep the baseline and category labels visible, and include the exact values in a native table.",
    code: '<LollipopChart values={adoption} categoryLabel="Feature" valueLabel="Adoption">\n  <ChartTitle>Feature adoption</ChartTitle>\n  <LollipopChartPlot aria-label="Lollipop chart comparing feature adoption">\n    {(lollipop) => (\n      <LollipopChartLollipop lollipop={lollipop}>\n        <circle cx={lollipop.x} cy={lollipop.y} r="2" />\n      </LollipopChartLollipop>\n    )}\n  </LollipopChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</LollipopChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "LollipopChart",
    "LollipopChartLollipop",
    "LollipopChartPlot",
  ],
  snippet:
    '<LollipopChart values={adoption} categoryLabel="Feature" valueLabel="Adoption"><ChartTitle>Feature adoption</ChartTitle><LollipopChartPlot aria-label="Lollipop chart comparing feature adoption">{(lollipop) => <LollipopChartLollipop lollipop={lollipop}><circle cx={lollipop.x} cy={lollipop.y} r="2" /></LollipopChartLollipop>}</LollipopChartPlot><ChartDescription>Email is the most adopted feature.</ChartDescription><ChartTable /><ChartTooltip /></LollipopChart>',
  parts: [
    p(
      "LollipopChart",
      "root",
      "Native figure sharing categorical values, labels, and formatting.",
      true,
      false,
      [
        prop(
          "values",
          "readonly CategoricalChartValue[]",
          "Category labels and finite numeric values.",
        ),
        prop(
          "categoryLabel / valueLabel",
          "string",
          "Visible headings for category and numeric axes.",
        ),
        prop("formatValue", "(value: number) => string", "Formats numeric ticks and table cells."),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "LollipopChartPlot / LollipopChartLollipop",
      "graphic",
      "Horizontal stems and endpoint circles against visible axes.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the comparison."),
        prop("xMin / xMax / xTickCount", "number", "Optional numeric bounds and tick count."),
        prop(
          "children",
          "(lollipop: LollipopChartLollipopState) => ReactNode",
          "Custom endpoint renderer.",
        ),
        prop("lollipop", "LollipopChartLollipopState", "Endpoint state passed to the mark."),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing the comparison."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional floating value label shown on hover or focus.",
      true,
      true,
      [
        prop("placement", "PopoverPlacement", 'Side of the active mark; defaults to "top".'),
        prop("offset", "number", "Distance from the active mark; defaults to eight pixels."),
        prop(
          "children",
          "ReactNode | (details: ChartValueDetails) => ReactNode",
          "Custom content receiving the active lollipop's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current lollipop and leaves with one more Tab.",
    },
    { keys: ["ArrowDown"], action: "Moves to the next lollipop without wrapping." },
    { keys: ["ArrowUp"], action: "Moves to the previous lollipop without wrapping." },
    { keys: ["Home"], action: "Moves to the first lollipop." },
    { keys: ["End"], action: "Moves to the last lollipop." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-value]",
      on: "LollipopChartLollipop",
      meaning: "The numeric value represented by the endpoint.",
    },
    {
      attribute: "[data-active]",
      on: "LollipopChartLollipop",
      meaning: "The endpoint currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep category and value axis labels visible and format ticks with the same units as the table.",
    "Wrap each endpoint in LollipopChartLollipop so its category and value are keyboard reachable.",
    "Keep the stem and endpoint visible in every color scheme; do not encode ranking through color alone.",
    "Include exact values in a native table and use ChartTooltip only as an enhancement.",
  ],
  related: ["bar-chart", "dumbbell-chart", "table"],
});
