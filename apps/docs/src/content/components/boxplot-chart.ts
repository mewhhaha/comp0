import { component, p, prop } from "../define.js";

export default component({
  slug: "boxplot-chart",
  title: "Box Plot Chart",
  group: "charts",
  summary: "A distribution summary that shows minimum, quartiles, median, and maximum together.",
  analogy:
    "Like a compact measuring case: the box holds the middle half and whiskers show the full spread.",
  whenToUse: "Use it to compare spread, skew, and typical values across several groups.",
  steps: {
    main: "Start BoxPlotChart with ordered five-number summaries and visible category and value labels.",
    supporting:
      "Render each summary with BoxPlotChartBox so the whole five-number summary is one keyboard-reachable mark.",
    behavior:
      "Keep the median and whiskers visibly distinct and include every summary value in a native table.",
    code: '<BoxPlotChart values={responseTimes} categoryLabel="Operation" valueLabel="Response time">\n  <ChartTitle>Response-time spread</ChartTitle>\n  <BoxPlotChartPlot aria-label="Box plot comparing response-time spread">\n    {(box) => (\n      <BoxPlotChartBox box={box}>\n        <rect x={box.x - box.width / 2} y={box.q3Y} width={box.width} height={box.q1Y - box.q3Y} />\n      </BoxPlotChartBox>\n    )}\n  </BoxPlotChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</BoxPlotChart>;',
  },
  imports: [
    "BoxPlotChart",
    "BoxPlotChartBox",
    "BoxPlotChartPlot",
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
  ],
  snippet:
    '<BoxPlotChart values={responseTimes} categoryLabel="Operation" valueLabel="Response time"><ChartTitle>Response-time spread</ChartTitle><BoxPlotChartPlot aria-label="Box plot comparing response-time spread">{(box) => <BoxPlotChartBox box={box}><rect x={box.x - box.width / 2} y={box.q3Y} width={box.width} height={box.q1Y - box.q3Y} /></BoxPlotChartBox>}</BoxPlotChartPlot><ChartDescription>Write operations have the widest spread.</ChartDescription><ChartTable /><ChartTooltip /></BoxPlotChart>',
  parts: [
    p(
      "BoxPlotChart",
      "root",
      "Native figure sharing ordered five-number summaries and formatting.",
      true,
      false,
      [
        prop(
          "values",
          "readonly BoxPlotChartValue[]",
          "Finite min, q1, median, q3, and max values in order.",
        ),
        prop(
          "categoryLabel / valueLabel",
          "string",
          "Visible headings for category and numeric axes.",
        ),
        prop("formatValue", "(value: number) => string", "Formats summary ticks and table cells."),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "BoxPlotChartPlot / BoxPlotChartBox",
      "graphic",
      "Vertical boxes, whiskers, and median marks against visible axes.",
      true,
      false,
      [
        prop(
          "aria-label",
          "string",
          "Concise text alternative naming the distribution comparison.",
        ),
        prop("yMin / yMax / yTickCount", "number", "Optional numeric bounds and tick count."),
        prop("children", "(box: BoxPlotChartBoxState) => ReactNode", "Custom box renderer."),
        prop("box", "BoxPlotChartBoxState", "Five-number summary state passed to the mark."),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing spread and median."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional floating summary label shown on hover or focus.",
      true,
      true,
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current box and leaves with one more Tab.",
    },
    { keys: ["ArrowRight"], action: "Moves to the next box without wrapping." },
    { keys: ["ArrowLeft"], action: "Moves to the previous box without wrapping." },
    { keys: ["Home"], action: "Moves to the first box." },
    { keys: ["End"], action: "Moves to the last box." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-min] / [data-median] / [data-max]",
      on: "BoxPlotChartBox",
      meaning: "The summary endpoints and median.",
    },
    {
      attribute: "[data-active]",
      on: "BoxPlotChartBox",
      meaning: "The box currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep category and value axis labels visible and format all five summary values with the same units as the table.",
    "Wrap each summary in BoxPlotChartBox so minimum, quartiles, median, and maximum are one roving tab stop.",
    "Make whiskers, box, and median visibly distinct without relying on fill color alone.",
    "Include every five-number summary in a native table; ChartTooltip is an optional enhancement.",
  ],
  related: ["candlestick-chart", "dumbbell-chart", "table"],
});
