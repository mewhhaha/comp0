import { component, p, prop } from "../define.js";

export default component({
  slug: "histogram-chart",
  title: "Histogram Chart",
  group: "charts",
  summary: "A numeric distribution grouped into adjacent equal-width ranges.",
  analogy:
    "Like sorting measurements into neighbouring buckets: each bucket height shows how often its range occurred.",
  whenToUse:
    "Use it to show shape, concentration, spread, and outliers in continuous observations.",
  steps: {
    main: "Start HistogramChart with finite observations and visible value and frequency labels.",
    supporting: "Choose a meaningful binCount and wrap each rendered range in HistogramChartBin.",
    behavior:
      "Describe the distribution and keep the underlying observations or bin counts in a native ChartTable.",
    code: '<HistogramChart values={responseTimes} valueLabel="Response time" frequencyLabel="Requests">\n  <ChartTitle>Response-time distribution</ChartTitle>\n  <HistogramChartPlot aria-label="Histogram of response times">\n    {(bin) => (\n      <HistogramChartBin bin={bin}>\n        <rect x={bin.x} y={bin.y} width={bin.width} height={bin.height} />\n      </HistogramChartBin>\n    )}\n  </HistogramChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</HistogramChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "HistogramChart",
    "HistogramChartBin",
    "HistogramChartPlot",
  ],
  snippet:
    '<HistogramChart values={responseTimes} valueLabel="Response time" frequencyLabel="Requests"><ChartTitle>Response-time distribution</ChartTitle><HistogramChartPlot aria-label="Histogram of response times">{(bin) => <HistogramChartBin bin={bin}><rect x={bin.x} y={bin.y} width={bin.width} height={bin.height} /></HistogramChartBin>}</HistogramChartPlot><ChartTable /><ChartTooltip /></HistogramChart>',
  parts: [
    p(
      "HistogramChart",
      "root",
      "Native figure sharing observations, labels, and value formatting.",
      true,
      false,
      [
        prop(
          "values",
          "readonly number[]",
          "Finite observations grouped into ranges by HistogramChartPlot.",
        ),
        prop("valueLabel / frequencyLabel", "string", "Visible headings for values and counts."),
        prop(
          "formatValue",
          "(value: number) => string",
          "Formats range boundaries and horizontal ticks.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "HistogramChartPlot / HistogramChartBin",
      "graphic",
      "Adjacent SVG bins positioned against value and frequency axes.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the distribution."),
        prop(
          "binCount",
          "number",
          "Positive number of equal-width bins; defaults from the observation count.",
        ),
        prop(
          "xMin / xMax / xTickCount / yTickCount",
          "number",
          "Optional value bounds and visible tick counts.",
        ),
        prop(
          "children",
          "(bin: HistogramChartBinState) => ReactNode",
          "Custom bin renderer receiving its range, count, and geometry.",
        ),
        prop(
          "bin",
          "HistogramChartBinState",
          "Bin state passed from the plot to HistogramChartBin.",
        ),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing shape and outliers."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional floating range and count shown on hover or focus.",
      true,
      true,
      [
        prop("placement", "PopoverPlacement", 'Side of the active mark; defaults to "top".'),
        prop("offset", "number", "Distance from the active mark; defaults to eight pixels."),
        prop(
          "children",
          "ReactNode | (details: ChartValueDetails) => ReactNode",
          "Custom content receiving the active bin's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current bin and leaves with one more Tab.",
    },
    { keys: ["ArrowLeft", "ArrowRight"], action: "Moves between adjacent bins." },
    { keys: ["Home", "End"], action: "Moves to the first or last bin." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-min]",
      on: "HistogramChartBin",
      meaning: "The inclusive lower bound of this bin.",
    },
    {
      attribute: "[data-max]",
      on: "HistogramChartBin",
      meaning: "The upper bound of this bin.",
    },
    {
      attribute: "[data-count]",
      on: "HistogramChartBin",
      meaning: "The number of observations in this bin.",
    },
    {
      attribute: "[data-active]",
      on: "HistogramChartBin",
      meaning: "The bin currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Name both the measured value axis and the frequency axis.",
    "Choose bins that communicate the distribution honestly; changing bin count can materially change its appearance.",
    "Wrap each custom bar in HistogramChartBin so its range and count are keyboard reachable.",
    "Keep the underlying observations or exact bin counts available in a native table.",
    "Adjacent bins should remain visibly separable in every color scheme.",
  ],
  related: ["bar-chart", "scatter-chart", "table"],
});
