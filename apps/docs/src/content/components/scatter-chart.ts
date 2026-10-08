import { component, p, prop } from "../define.js";

export default component({
  slug: "scatter-chart",
  title: "Scatter Chart",
  group: "charts",
  summary:
    "A relationship between two numeric measures, with every point independently named and positioned.",
  analogy: "Like pins on a map of effort and impact: nearby points share similar tradeoffs.",
  whenToUse: "Use it to reveal correlation, clusters, and outliers across two measurements.",
  steps: {
    main: "Start ScatterChart with labelled x and y coordinates and visible axis labels.",
    supporting:
      "Render ScatterChartPoint inside ScatterChartPlot so arrow keys move spatially between points.",
    behavior:
      "Add ChartDescription, a native ChartTable, and an optional ChartTooltip for exact values.",
    code: '<ScatterChart values={initiatives} xLabel="Effort" yLabel="Impact">\n  <ChartTitle>Initiative impact and effort</ChartTitle>\n  <ScatterChartPlot aria-label="Scatter chart comparing impact and effort">\n    {(point) => (\n      <ScatterChartPoint point={point}>\n        <circle cx={point.x} cy={point.y} />\n      </ScatterChartPoint>\n    )}\n  </ScatterChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</ScatterChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "ScatterChart",
    "ScatterChartPlot",
    "ScatterChartPoint",
  ],
  snippet:
    '<ScatterChart values={initiatives} xLabel="Effort" yLabel="Impact"><ChartTitle>Initiative impact and effort</ChartTitle><ScatterChartPlot aria-label="Scatter chart comparing initiative impact and effort">{(point) => <ScatterChartPoint point={point}><circle cx={point.x} cy={point.y} /></ScatterChartPoint>}</ScatterChartPlot><ChartDescription>Search offers high impact for low effort.</ChartDescription><ChartTable /><ChartTooltip /></ScatterChart>',
  parts: [
    p(
      "ScatterChart",
      "root",
      "Native figure sharing labelled coordinates, axis labels, and formatting with every part.",
      true,
      false,
      [
        prop(
          "values",
          "readonly ScatterChartValue[]",
          "Finite x and y coordinates with non-empty point labels.",
        ),
        prop("xLabel / yLabel", "string", "Visible headings for both numeric axes."),
        prop(
          "formatX / formatY",
          "(value) => string",
          "Formatters shared by ticks, point names, and table cells.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "ScatterChartPlot / ScatterChartPoint",
      "graphic",
      "Independently positioned SVG points against two visible numeric axes.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the relationship."),
        prop(
          "xMin / xMax / yMin / yMax",
          "number",
          "Optional finite bounds that contain every point.",
        ),
        prop("xTickCount / yTickCount", "number", "Visible tick counts; each defaults to five."),
        prop(
          "children",
          "(point: ScatterChartPointState) => ReactNode",
          "Custom point renderer receiving its value and SVG position.",
        ),
        prop(
          "point",
          "ScatterChartPointState",
          "Point state passed from the plot to ScatterChartPoint.",
        ),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing the important relationship."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional floating point label shown on hover or focus.",
      true,
      true,
      [
        prop("placement", "PopoverPlacement", 'Side of the active mark; defaults to "top".'),
        prop("offset", "number", "Distance from the active mark; defaults to eight pixels."),
        prop(
          "children",
          "ReactNode | (details: ChartValueDetails) => ReactNode",
          "Custom content receiving the active point's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the plot at its current point and leaves with one more Tab.",
    },
    {
      keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
      action: "Moves to the nearest point in the requested visual direction.",
    },
    { keys: ["Home"], action: "Moves to the first point." },
    { keys: ["End"], action: "Moves to the last point." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-active]",
      on: "ScatterChartPoint",
      meaning: "The point currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep both numeric axis labels visible and use the same formatters in the table.",
    "Wrap every custom mark in ScatterChartPoint so it receives a formatted accessible name.",
    "Arrow keys move to the nearest point in the requested visual direction.",
    "Do not use point color as the only series or category distinction.",
    "Use ChartTooltip as an enhancement while retaining the native exact-value table.",
  ],
  related: ["line-chart", "heatmap-chart", "table"],
});
