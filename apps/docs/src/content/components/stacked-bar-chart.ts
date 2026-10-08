import { component, p, prop } from "../define.js";

export default component({
  slug: "stacked-bar-chart",
  title: "Stacked Bar Chart",
  group: "charts",
  summary: "A horizontal category comparison divided into consistently ordered segments.",
  analogy:
    "Like several measuring sticks made from colored sections: length shows totals and sections show composition.",
  whenToUse: "Use it when long category labels and part-to-total comparisons both matter.",
  steps: {
    main: "Start StackedBarChart with categories that share the same ordered segment labels.",
    supporting:
      "Wrap each rendered section in StackedBarChartSegment for two-dimensional arrow navigation.",
    behavior:
      "Keep segment labels visible and include a native ChartTable with segment values and totals.",
    code: '<StackedBarChart values={orders} categoryLabel="Channel" valueLabel="Orders">\n  <ChartTitle>Orders by channel</ChartTitle>\n  <StackedBarChartPlot aria-label="Stacked bar chart of orders">\n    {(segment) => (\n      <StackedBarChartSegment segment={segment}>\n        <rect x={segment.x} y={segment.y} width={segment.width} height={segment.height} />\n      </StackedBarChartSegment>\n    )}\n  </StackedBarChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</StackedBarChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "StackedBarChart",
    "StackedBarChartPlot",
    "StackedBarChartSegment",
  ],
  snippet:
    '<StackedBarChart values={orders} categoryLabel="Channel" valueLabel="Orders"><ChartTitle>Orders by channel</ChartTitle><StackedBarChartPlot aria-label="Stacked bar chart of orders">{(segment) => <StackedBarChartSegment segment={segment}><rect x={segment.x} y={segment.y} width={segment.width} height={segment.height} /></StackedBarChartSegment>}</StackedBarChartPlot><ChartTable /><ChartTooltip /></StackedBarChart>',
  parts: [
    p(
      "StackedBarChart",
      "root",
      "Native figure sharing categories and consistently ordered segments.",
      true,
      false,
      [
        prop(
          "values",
          "readonly StackedChartValue[]",
          "Categories containing the same ordered, non-negative segments.",
        ),
        prop("categoryLabel / valueLabel", "string", "Visible category and numeric axis headings."),
        prop(
          "formatValue",
          "(value: number) => string",
          "Formats ticks, segment names, and table cells.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "StackedBarChartPlot / StackedBarChartSegment",
      "graphic",
      "Horizontal SVG bars divided into keyboard-reachable segments.",
      true,
      false,
      [
        prop(
          "aria-label",
          "string",
          "Concise text alternative naming the comparison and composition.",
        ),
        prop("xMax / xTickCount", "number", "Optional numeric maximum and visible tick count."),
        prop(
          "children",
          "(segment: StackedBarChartSegmentState) => ReactNode",
          "Custom segment renderer receiving category, segment, and geometry.",
        ),
        prop(
          "segment",
          "StackedBarChartSegmentState",
          "Segment state passed from the plot to StackedBarChartSegment.",
        ),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing totals and composition."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional floating segment label shown on hover or focus.",
      true,
      true,
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current segment and leaves with one more Tab.",
    },
    {
      keys: ["ArrowUp", "ArrowDown"],
      action: "Moves between categories while retaining the segment.",
    },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Moves between segments in the current category.",
    },
    { keys: ["Home", "End"], action: "Moves to the first or last segment." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-segment]",
      on: "StackedBarChartSegment",
      meaning: "The segment label represented by this section.",
    },
    {
      attribute: "[data-active]",
      on: "StackedBarChartSegment",
      meaning: "The section currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep segment labels visible next to color or pattern samples.",
    "Wrap every section in StackedBarChartSegment; vertical arrows change category and horizontal arrows change segment.",
    "Announce each section's category, segment label, and formatted value.",
    "Include every segment and total in a native table.",
    "Do not rely on hue alone to distinguish adjacent sections.",
  ],
  related: ["bar-chart", "stacked-column-chart", "table"],
});
