import { component, p, prop } from "../define.js";

export default component({
  slug: "open-to-close-chart",
  title: "Open-to-close Chart",
  group: "charts",
  summary:
    "An ordered series that highlights the movement from each opening value to its closing value.",
  analogy:
    "Like a daily hinge: one endpoint is where the period opened and the other is where it closed.",
  whenToUse:
    "Use it for compact open-versus-close comparisons when high and low values are not part of the story.",
  steps: {
    main: "Start OpenToCloseChart with strictly increasing x values and explicit open and close labels.",
    supporting:
      "Render each range with OpenToCloseChartRange so the direction and both endpoints are keyboard reachable.",
    behavior:
      "Describe upward and downward movement with shape or position as well as color, and list both values in a native table.",
    code: '<OpenToCloseChart values={prices} xLabel="Trading day" yLabel="Share price">\n  <ChartTitle>Opening to closing price</ChartTitle>\n  <OpenToCloseChartPlot aria-label="Open-to-close chart showing trading days">\n    {(range) => (\n      <OpenToCloseChartRange range={range}>\n        <line x1={range.x} x2={range.x} y1={range.openY} y2={range.closeY} />\n      </OpenToCloseChartRange>\n    )}\n  </OpenToCloseChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</OpenToCloseChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "OpenToCloseChart",
    "OpenToCloseChartPlot",
    "OpenToCloseChartRange",
  ],
  snippet:
    '<OpenToCloseChart values={prices} xLabel="Trading day" yLabel="Share price"><ChartTitle>Opening to closing price</ChartTitle><OpenToCloseChartPlot aria-label="Open-to-close chart showing trading days">{(range) => <OpenToCloseChartRange range={range}><line x1={range.x} x2={range.x} y1={range.openY} y2={range.closeY} /></OpenToCloseChartRange>}</OpenToCloseChartPlot><ChartDescription>Day three produced the strongest upward move.</ChartDescription><ChartTable /><ChartTooltip /></OpenToCloseChart>',
  parts: [
    p(
      "OpenToCloseChart",
      "root",
      "Native figure sharing ordered opening and closing values with every part.",
      true,
      false,
      [
        prop(
          "values",
          "readonly OpenToCloseChartValue[]",
          "Strictly increasing x values with finite open and close values.",
        ),
        prop("xLabel / yLabel", "string", "Visible headings for time and value axes."),
        prop("openLabel / closeLabel", "string", "Accessible and table labels for each endpoint."),
        prop(
          "formatX / formatY",
          "(value) => string",
          "Formatters shared by ticks and table cells.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "OpenToCloseChartPlot / OpenToCloseChartRange",
      "graphic",
      "Ordered SVG ranges with explicit open and close endpoints.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the series and period."),
        prop("yMin / yMax / yTickCount", "number", "Optional vertical bounds and tick count."),
        prop(
          "children",
          "(range: OpenToCloseChartRangeState) => ReactNode",
          "Custom range renderer.",
        ),
        prop("range", "OpenToCloseChartRangeState", "Range state passed to the mark."),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing the movement."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional floating open/close pair label shown on hover or focus.",
      true,
      true,
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current range and leaves with one more Tab.",
    },
    { keys: ["ArrowRight"], action: "Moves to the next range without wrapping." },
    { keys: ["ArrowLeft"], action: "Moves to the previous range without wrapping." },
    { keys: ["Home"], action: "Moves to the first range." },
    { keys: ["End"], action: "Moves to the last range." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-direction]",
      on: "OpenToCloseChartRange",
      meaning: "Whether close is up, down, or unchanged from open.",
    },
    {
      attribute: "[data-active]",
      on: "OpenToCloseChartRange",
      meaning: "The range currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep both axis labels visible and use the same formatters for x values, open values, close values, and the table.",
    "Wrap each range in OpenToCloseChartRange so its open and close values are one roving tab stop.",
    "Announce the explicit open and close labels and use shape or position as well as color for direction.",
    "Include both endpoints in a native table; ChartTooltip must not be the only source of exact values.",
  ],
  related: ["candlestick-chart", "dumbbell-chart", "table"],
});
