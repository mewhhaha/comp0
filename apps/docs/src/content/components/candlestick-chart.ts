import { component, p, prop } from "../define.js";

export default component({
  slug: "candlestick-chart",
  title: "Candlestick Chart",
  group: "charts",
  summary:
    "An open-high-low-close financial series with visible axes and every exact value in a native table.",
  analogy:
    "Like a daily price diary: each wick records the full range while its body connects opening and closing prices.",
  whenToUse:
    "Use it for ordered market prices where both the range and movement within each period matter.",
  steps: {
    main: "Start CandlestickChart with strictly increasing x values and valid open, high, low, and close prices.",
    supporting:
      "Add ChartTitle and CandlestickChartPlot; wrap each rendered candle in CandlestickChartCandle so one candle is tabbable and horizontal arrow keys reveal the rest.",
    behavior:
      "Add ChartDescription and ChartTable for persistent context and exact OHLC values; optionally add ChartTooltip for pointer and keyboard details.",
    code: '<CandlestickChart values={prices} xLabel="Trading day" yLabel="Share price">\n  <ChartTitle>Four-day share price</ChartTitle>\n  <CandlestickChartPlot aria-label="Candlestick chart showing four days of share prices">\n    {(candle) => (\n      <CandlestickChartCandle candle={candle}>\n        <rect\n          x={candle.x - candle.width / 2}\n          y={candle.bodyY}\n          width={candle.width}\n          height={candle.bodyHeight}\n        />\n      </CandlestickChartCandle>\n    )}\n  </CandlestickChartPlot>\n  <ChartDescription>The highest close occurred on day three.</ChartDescription>\n  <ChartTable />\n  <ChartTooltip />\n</CandlestickChart>;',
  },
  imports: [
    "CandlestickChart",
    "CandlestickChartCandle",
    "CandlestickChartPlot",
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
  ],
  snippet:
    '<CandlestickChart values={prices} xLabel="Trading day" yLabel="Share price"><ChartTitle>Four-day share price</ChartTitle><CandlestickChartPlot aria-label="Candlestick chart showing four days of share prices">{(candle) => <CandlestickChartCandle candle={candle}><rect x={candle.x - candle.width / 2} y={candle.bodyY} width={candle.width} height={candle.bodyHeight} /></CandlestickChartCandle>}</CandlestickChartPlot><ChartDescription>The highest close occurred on day three.</ChartDescription><ChartTable /><ChartTooltip /></CandlestickChart>',
  parts: [
    p(
      "CandlestickChart",
      "root",
      "Native figure sharing ordered OHLC values, labels, and formatting with every part.",
      true,
      false,
      [
        prop(
          "values",
          "readonly CandlestickChartValue[]",
          "Strictly increasing x values with finite open, high, low, and close values.",
        ),
        prop("xLabel / yLabel", "string", "Visible headings for the time and value axes."),
        prop(
          "openLabel / highLabel / lowLabel / closeLabel",
          "string",
          "Table headings for each financial value.",
        ),
        prop(
          "formatX / formatY",
          "(value) => string",
          "Formatters shared by axis ticks and table cells.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "CandlestickChartPlot / CandlestickChartCandle",
      "graphic",
      "SVG wicks and bodies positioned against visible time and value axes.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the instrument and period."),
        prop("yMin / yMax", "number", "Optional finite vertical scale bounds."),
        prop("yTickCount", "number", "Visible vertical-axis tick count; defaults to five."),
        prop(
          "children",
          "(candle: CandlestickChartCandleState) => ReactNode",
          "Custom candle renderer receiving its OHLC value, direction, and SVG geometry.",
        ),
        prop(
          "candle",
          "CandlestickChartCandleState",
          "Candle state passed from the plot to CandlestickChartCandle.",
        ),
        prop(
          "CandlestickChartCandle children",
          "ReactNode",
          "SVG shapes grouped into one named, keyboard-reachable candle.",
        ),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing the important movement."),
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
      "Optional floating OHLC label shown on hover or focus.",
      true,
      true,
      [
        prop("placement", "PopoverPlacement", 'Side of the active mark; defaults to "top".'),
        prop("offset", "number", "Distance from the active mark; defaults to eight pixels."),
        prop(
          "children",
          "ReactNode | (details: ChartValueDetails) => ReactNode",
          "Custom content receiving the active candle's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current candle and leaves with one more Tab.",
    },
    { keys: ["ArrowRight"], action: "Moves to the next candle without wrapping." },
    { keys: ["ArrowLeft"], action: "Moves to the previous candle without wrapping." },
    { keys: ["Home"], action: "Moves to the first candle." },
    { keys: ["End"], action: "Moves to the last candle." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-direction]",
      on: "CandlestickChartCandle",
      meaning: 'The candle closed "up", "down", or "unchanged" from its opening value.',
    },
    {
      attribute: "[data-active]",
      on: "CandlestickChartCandle",
      meaning: "The candle currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep both axis labels visible and format ticks with the same units used in ChartTable.",
    "Give CandlestickChartPlot a concise aria-label that identifies the instrument and period.",
    "Wrap custom marks in CandlestickChartCandle to expose one roving tab stop; each candle receives its formatted time and OHLC values as a name.",
    "ChartTooltip is an optional visual enhancement for hover and focus; never make it the only source of a value.",
    "Include ChartTable so every open, high, low, and close value remains directly readable.",
    "Distinguish rising and falling candles with shape or fill treatment as well as color.",
  ],
  related: ["line-chart", "column-chart", "table"],
});
