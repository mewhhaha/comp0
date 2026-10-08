import { component, p, prop } from "../define.js";

export default component({
  slug: "area-chart",
  title: "Area Chart",
  group: "charts",
  summary:
    "A trend whose filled area emphasizes magnitude, with visible axes and an exact-value table.",
  analogy:
    "Like a rising waterline: the boundary shows change while the filled space makes accumulated scale feel prominent.",
  whenToUse:
    "Use it for an ordered series when the amount beneath the line matters as much as its direction.",
  steps: {
    main: "Start AreaChart with strictly increasing x values and labels for both axes.",
    supporting:
      "Add ChartTitle and AreaChartPlot; render each point with AreaChartPoint so one point is tabbable and horizontal arrow keys reveal the rest.",
    behavior:
      "Add ChartDescription and ChartTable for persistent context and exact values; optionally add ChartTooltip for pointer and keyboard details.",
    code: '<AreaChart values={accounts} xLabel="Quarter" yLabel="Active accounts">\n  <ChartTitle>Active accounts</ChartTitle>\n  <AreaChartPlot aria-label="Area chart showing active accounts by quarter">\n    {({ areaPath, points }) => (\n      <>\n        <path d={areaPath} />\n        {points.map((point) => (\n          <AreaChartPoint key={point.index} point={point}>\n            <circle cx={point.x} cy={point.y} />\n          </AreaChartPoint>\n        ))}\n      </>\n    )}\n  </AreaChartPlot>\n  <ChartDescription>Active accounts grew every quarter.</ChartDescription>\n  <ChartTable />\n  <ChartTooltip />\n</AreaChart>;',
  },
  imports: [
    "AreaChart",
    "AreaChartPlot",
    "AreaChartPoint",
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
  ],
  snippet:
    '<AreaChart values={accounts} xLabel="Quarter" yLabel="Active accounts"><ChartTitle>Active accounts</ChartTitle><AreaChartPlot aria-label="Area chart showing active accounts by quarter">{({ areaPath, points }) => <><path d={areaPath} />{points.map((point) => <AreaChartPoint key={point.index} point={point}><circle cx={point.x} cy={point.y} /></AreaChartPoint>)}</>}</AreaChartPlot><ChartDescription>Active accounts grew every quarter.</ChartDescription><ChartTable /><ChartTooltip /></AreaChart>',
  parts: [
    p(
      "AreaChart",
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
      "AreaChartPlot / AreaChartPoint",
      "graphic",
      "SVG filled area and boundary positioned against visible x and y axes.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the graphic and trend."),
        prop("yMin / yMax", "number", "Optional finite vertical scale bounds."),
        prop("yTickCount", "number", "Visible vertical-axis tick count; defaults to five."),
        prop(
          "children",
          "(state: AreaChartPlotState) => ReactNode",
          "Custom renderer receiving area and line paths, the baseline, and ordered points.",
        ),
        prop("point", "ChartPoint", "Point state passed from the plot to AreaChartPoint."),
        prop(
          "AreaChartPoint children",
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
      on: "AreaChartPoint",
      meaning: "The point currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep both axis labels visible and format ticks with the same units used in ChartTable.",
    "Give AreaChartPlot a concise aria-label that identifies the chart type, subject, and direction of change.",
    "Wrap custom circles in AreaChartPoint to expose one roving tab stop; each point receives its formatted x and y coordinates as a name.",
    "ChartTooltip is an optional visual enhancement for hover and focus; never make it the only source of a value.",
    "Include ChartTable when exact coordinates matter so the full series remains available for structured review.",
    "Use sufficient contrast for the boundary line and do not rely on fill color alone to communicate the series.",
  ],
  related: ["line-chart", "pie-chart", "table"],
});
