import { component, p, prop } from "../define.js";

export default component({
  slug: "heatmap-chart",
  title: "Heatmap Chart",
  group: "charts",
  summary: "A two-dimensional category matrix whose cells encode a numeric magnitude.",
  analogy:
    "Like a timetable shaded by activity: rows and columns locate the period, and intensity shows the amount.",
  whenToUse: "Use it to scan patterns across two categorical dimensions.",
  steps: {
    main: "Start HeatmapChart with unique x and y coordinate pairs and labels for both axes and the measured value.",
    supporting:
      "Wrap every rendered rectangle in HeatmapChartCell so arrow keys follow rows and columns.",
    behavior:
      "Use a labelled color scale, a native matrix table, and an optional ChartTooltip for exact values.",
    code: '<HeatmapChart values={contributions} xLabel="Week" yLabel="Weekday" valueLabel="Contributions">\n  <ChartTitle>Contribution activity</ChartTitle>\n  <HeatmapChartPlot aria-label="Contribution heatmap by weekday and week">\n    {(cell) => (\n      <HeatmapChartCell cell={cell}>\n        <rect x={cell.x} y={cell.y} width={cell.width} height={cell.height} />\n      </HeatmapChartCell>\n    )}\n  </HeatmapChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</HeatmapChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "HeatmapChart",
    "HeatmapChartCell",
    "HeatmapChartPlot",
  ],
  snippet:
    '<HeatmapChart values={contributions} xLabel="Week" yLabel="Weekday" valueLabel="Contributions"><ChartTitle>Contribution activity</ChartTitle><HeatmapChartPlot aria-label="Contribution heatmap by weekday and week">{(cell) => <HeatmapChartCell cell={cell}><rect x={cell.x} y={cell.y} width={cell.width} height={cell.height} /></HeatmapChartCell>}</HeatmapChartPlot><ChartTable /><ChartTooltip /></HeatmapChart>',
  parts: [
    p(
      "HeatmapChart",
      "root",
      "Native figure sharing categorical coordinates, values, labels, and formatting.",
      true,
      false,
      [
        prop(
          "values",
          "readonly HeatmapChartValue[]",
          "Unique x and y label pairs with finite values.",
        ),
        prop(
          "xLabel / yLabel / valueLabel",
          "string",
          "Visible headings for both dimensions and the encoded measure.",
        ),
        prop("formatValue", "(value: number) => string", "Formats cell names and table cells."),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "HeatmapChartPlot / HeatmapChartCell",
      "graphic",
      "SVG matrix with one keyboard-reachable rectangle per supplied coordinate.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the matrix and measure."),
        prop(
          "children",
          "(cell: HeatmapChartCellState) => ReactNode",
          "Custom cell renderer receiving its coordinate, value, and geometry.",
        ),
        prop(
          "cell",
          "HeatmapChartCellState",
          "Cell state passed from the plot to HeatmapChartCell.",
        ),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing the strongest pattern."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional floating cell value shown on hover or focus.",
      true,
      true,
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current cell and leaves with one more Tab.",
    },
    {
      keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
      action: "Moves one available cell in the requested row or column direction.",
    },
    { keys: ["Home", "End"], action: "Moves to the first or last supplied cell." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-value]",
      on: "HeatmapChartCell",
      meaning: "The numeric value encoded by this cell.",
    },
    {
      attribute: "[data-active]",
      on: "HeatmapChartCell",
      meaning: "The cell currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep both category axes visible and explain what the color intensity measures.",
    "Wrap every custom rectangle in HeatmapChartCell for row-and-column arrow navigation.",
    "Use a sequential palette with distinguishable contrast and never rely on color without numeric labels or a table.",
    "Include a native table with real row and column headers.",
    "ChartTooltip may reveal exact values visually but must not replace the table.",
  ],
  related: ["scatter-chart", "histogram-chart", "table"],
});
