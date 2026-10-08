import { component, p, prop } from "../define.js";

export default component({
  slug: "stacked-column-chart",
  title: "Stacked Column Chart",
  group: "charts",
  summary: "A vertical category comparison divided into consistently ordered segments.",
  analogy:
    "Like towers built from labelled blocks: height shows totals while each block shows its contribution.",
  whenToUse:
    "Use it for a small ordered set of categories where both totals and composition change.",
  steps: {
    main: "Start StackedColumnChart with categories that share the same ordered segment labels.",
    supporting:
      "Wrap each rendered section in StackedColumnChartSegment for category and segment navigation.",
    behavior:
      "Keep segment labels visible and include a native ChartTable with segment values and totals.",
    code: '<StackedColumnChart values={signups} categoryLabel="Quarter" valueLabel="Signups">\n  <ChartTitle>Signups by plan</ChartTitle>\n  <StackedColumnChartPlot aria-label="Stacked column chart of signups">\n    {(segment) => (\n      <StackedColumnChartSegment segment={segment}>\n        <rect x={segment.x} y={segment.y} width={segment.width} height={segment.height} />\n      </StackedColumnChartSegment>\n    )}\n  </StackedColumnChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</StackedColumnChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "StackedColumnChart",
    "StackedColumnChartPlot",
    "StackedColumnChartSegment",
  ],
  snippet:
    '<StackedColumnChart values={signups} categoryLabel="Quarter" valueLabel="Signups"><ChartTitle>Signups by plan</ChartTitle><StackedColumnChartPlot aria-label="Stacked column chart of signups">{(segment) => <StackedColumnChartSegment segment={segment}><rect x={segment.x} y={segment.y} width={segment.width} height={segment.height} /></StackedColumnChartSegment>}</StackedColumnChartPlot><ChartTable /><ChartTooltip /></StackedColumnChart>',
  parts: [
    p(
      "StackedColumnChart",
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
      "StackedColumnChartPlot / StackedColumnChartSegment",
      "graphic",
      "Vertical SVG columns divided into keyboard-reachable segments.",
      true,
      false,
      [
        prop(
          "aria-label",
          "string",
          "Concise text alternative naming the comparison and composition.",
        ),
        prop("yMax / yTickCount", "number", "Optional numeric maximum and visible tick count."),
        prop(
          "children",
          "(segment: StackedColumnChartSegmentState) => ReactNode",
          "Custom segment renderer receiving category, segment, and geometry.",
        ),
        prop(
          "segment",
          "StackedColumnChartSegmentState",
          "Segment state passed from the plot to StackedColumnChartSegment.",
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
      [
        prop("placement", "PopoverPlacement", 'Side of the active mark; defaults to "top".'),
        prop("offset", "number", "Distance from the active mark; defaults to eight pixels."),
        prop(
          "children",
          "ReactNode | (details: ChartValueDetails) => ReactNode",
          "Custom content receiving the active segment's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current segment and leaves with one more Tab.",
    },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Moves between categories while retaining the segment.",
    },
    { keys: ["ArrowUp", "ArrowDown"], action: "Moves between segments in the current category." },
    { keys: ["Home", "End"], action: "Moves to the first or last segment." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-category]",
      on: "StackedColumnChartSegment",
      meaning: "The category label of the column this segment belongs to.",
    },
    {
      attribute: "[data-segment]",
      on: "StackedColumnChartSegment",
      meaning: "The segment label represented by this section.",
    },
    {
      attribute: "[data-active]",
      on: "StackedColumnChartSegment",
      meaning: "The section currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep segment labels visible next to color or pattern samples.",
    "Wrap every section in StackedColumnChartSegment; horizontal arrows change category and vertical arrows change segment.",
    "Announce each section's category, segment label, and formatted value.",
    "Include every segment and total in a native table.",
    "Do not rely on hue alone to distinguish adjacent sections.",
  ],
  related: ["column-chart", "stacked-bar-chart", "table"],
});
