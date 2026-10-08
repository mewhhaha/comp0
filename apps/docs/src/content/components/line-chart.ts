import { component, p, prop } from "../define.js";

export default component({
  slug: "line-chart",
  title: "Line Chart",
  group: "charts",
  summary:
    "A trend across ordered numeric or date values, with visible axes and an exact-value table.",
  analogy:
    "Like pins on a timeline joined by thread: both position and slope show how a measurement changed.",
  whenToUse:
    "Use it when the spacing and order of measurements are meaningful, especially over time.",
  steps: {
    main: "Start LineChart with strictly increasing x values and labels for both axes.",
    supporting:
      "Add ChartTitle and LineChartPlot; render each point with LineChartPoint so one point is tabbable and horizontal arrow keys reveal the rest.",
    behavior:
      "Add ChartDescription and ChartTable for persistent context and exact values; optionally add ChartTooltip for pointer and keyboard details.",
    code: '<LineChart values={revenue} xLabel="Quarter" yLabel="Revenue">\n  <ChartTitle>Quarterly revenue</ChartTitle>\n  <LineChartPlot aria-label="Line chart showing quarterly revenue">\n    {({ path, points }) => (\n      <>\n        <path d={path} />\n        {points.map((point) => (\n          <LineChartPoint key={point.index} point={point}>\n            <circle cx={point.x} cy={point.y} />\n          </LineChartPoint>\n        ))}\n      </>\n    )}\n  </LineChartPlot>\n  <ChartDescription>Revenue finished at its highest point.</ChartDescription>\n  <ChartTable />\n  <ChartTooltip />\n</LineChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "LineChart",
    "LineChartPlot",
    "LineChartPoint",
  ],
  snippet:
    '<LineChart values={revenue} xLabel="Quarter" yLabel="Revenue"><ChartTitle>Quarterly revenue</ChartTitle><LineChartPlot aria-label="Line chart showing quarterly revenue">{({ path, points }) => <><path d={path} />{points.map((point) => <LineChartPoint key={point.index} point={point}><circle cx={point.x} cy={point.y} /></LineChartPoint>)}</>}</LineChartPlot><ChartDescription>Revenue finished at its highest point.</ChartDescription><ChartTable /><ChartTooltip /></LineChart>',
  parts: [
    p(
      "LineChart",
      "root",
      "Native figure sharing ordered coordinates, axis labels, and formatting with every part.",
      true,
      false,
      [
        prop(
          "values",
          "readonly CartesianChartValue[]",
          "Finite y values paired with strictly increasing numeric or Date x values.",
        ),
        prop("xLabel / yLabel", "string", "Visible headings for the horizontal and vertical axes."),
        prop(
          "formatX / formatY",
          "(value) => string",
          "Formatters shared by axis ticks and table cells.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "LineChartPlot / LineChartPoint",
      "graphic",
      "SVG line and points positioned against visible x and y axes.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the graphic and trend."),
        prop("yMin / yMax", "number", "Optional finite vertical scale bounds."),
        prop("yTickCount", "number", "Visible vertical-axis tick count; defaults to five."),
        prop(
          "children",
          "(state: LineChartPlotState) => ReactNode",
          "Custom renderer receiving the line path and ordered point geometry.",
        ),
        prop("point", "ChartPoint", "Point state passed from the plot to LineChartPoint."),
        prop(
          "LineChartPoint children",
          "ReactNode",
          "SVG shapes grouped into one named, keyboard-reachable point.",
        ),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing the important trend."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
      true,
      false,
      [prop("children", "ReactNode", "Native caption, thead, tbody, and optional tfoot markup.")],
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
          "Custom content receiving the active point's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current point and leaves with one more Tab.",
    },
    { keys: ["ArrowRight"], action: "Moves to the next point without wrapping." },
    { keys: ["ArrowLeft"], action: "Moves to the previous point without wrapping." },
    { keys: ["Home"], action: "Moves to the first point." },
    { keys: ["End"], action: "Moves to the last point." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-active]",
      on: "LineChartPoint",
      meaning: "The point currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep both axis labels visible and format ticks with the same units used in ChartTable.",
    "Give LineChartPlot a concise aria-label that identifies the chart type, subject, and direction of change.",
    "Wrap custom circles in LineChartPoint to expose one roving tab stop; each point receives its formatted x and y coordinates as a name.",
    "ChartTooltip is an optional visual enhancement for hover and focus; never make it the only source of a value.",
    "Include ChartTable when exact coordinates matter so the full series remains available for structured review.",
    "Use visible points, line styles, or direct labels when color alone would not distinguish the series.",
  ],
  related: ["area-chart", "bar-chart", "table"],
});
