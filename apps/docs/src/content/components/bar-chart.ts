import { component, p, prop } from "../define.js";

export default component({
  slug: "bar-chart",
  title: "Bar Chart",
  group: "charts",
  summary:
    "A categorical comparison with visible axes and the same exact values in a native table.",
  analogy:
    "Like labelled measuring sticks laid in rows: their lengths make differences quick to compare.",
  whenToUse:
    "Use it to compare amounts across categories, especially when labels are long or ranking matters.",
  steps: {
    main: "Start BarChart with labelled values plus visible category and value axis labels.",
    supporting:
      "Add ChartTitle and BarChartPlot; wrap each rendered bar in BarChartBar so one bar is tabbable and arrow keys reveal the rest.",
    behavior:
      "Add ChartDescription and ChartTable for persistent context and exact values; optionally add ChartTooltip for pointer and keyboard details.",
    code: '<BarChart values={performance} categoryLabel="Measure" valueLabel="Target met">\n  <ChartTitle>Performance against target</ChartTitle>\n  <BarChartPlot aria-label="Horizontal bar chart comparing performance against target">\n    {(bar) => (\n      <BarChartBar bar={bar}>\n        <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} />\n      </BarChartBar>\n    )}\n  </BarChartPlot>\n  <ChartDescription>Rendering has the largest gap.</ChartDescription>\n  <ChartTable>\n    <caption>Performance values</caption>\n    <thead>\n      <tr>\n        <th scope="col">Measure</th>\n        <th scope="col">Target met</th>\n      </tr>\n    </thead>\n    <tbody>\n      {performance.map((measure) => (\n        <tr key={measure.label}>\n          <th scope="row">{measure.label}</th>\n          <td>{measure.value}%</td>\n        </tr>\n      ))}\n    </tbody>\n  </ChartTable>\n  <ChartTooltip />\n</BarChart>;',
  },
  imports: [
    "BarChart",
    "BarChartBar",
    "BarChartPlot",
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
  ],
  snippet:
    '<BarChart values={performance} categoryLabel="Measure" valueLabel="Target met"><ChartTitle>Performance against target</ChartTitle><BarChartPlot aria-label="Horizontal bar chart comparing performance against target">{(bar) => <BarChartBar bar={bar}><rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} /></BarChartBar>}</BarChartPlot><ChartDescription>Rendering has the largest gap.</ChartDescription><ChartTable><caption>Performance values</caption><thead><tr><th scope="col">Measure</th><th scope="col">Target met</th></tr></thead><tbody>{performance.map((measure) => <tr key={measure.label}><th scope="row">{measure.label}</th><td>{measure.value}%</td></tr>)}</tbody></ChartTable><ChartTooltip /></BarChart>',
  parts: [
    p(
      "BarChart",
      "root",
      "Native figure sharing categorical values, labels, and formatting with every part.",
      true,
      false,
      [
        prop(
          "values",
          "readonly CategoricalChartValue[]",
          "Category labels and finite numeric values.",
        ),
        prop("categoryLabel", "string", "Visible heading for the vertical category axis."),
        prop("valueLabel", "string", "Visible heading for the horizontal numeric axis."),
        prop(
          "formatValue",
          "(value: number) => string",
          "Formats numeric axis ticks and table cells.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "BarChartPlot / BarChartBar",
      "graphic",
      "Horizontal SVG bars with visible category and numeric axes.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the graphic and subject."),
        prop(
          "xMin / xMax",
          "number",
          "Optional finite horizontal scale bounds that must contain every value and zero.",
        ),
        prop("xTickCount", "number", "Visible numeric-axis tick count; defaults to five."),
        prop(
          "children",
          "(bar: BarChartBarState) => ReactNode",
          "Custom bar renderer receiving the category, value, and SVG geometry.",
        ),
        prop("bar", "BarChartBarState", "Bar state passed from the plot to BarChartBar."),
        prop(
          "BarChartBar children",
          "ReactNode",
          "SVG shapes grouped into one named, keyboard-reachable bar.",
        ),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing the important comparison."),
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
          "Custom content receiving the active bar's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current bar and leaves with one more Tab.",
    },
    { keys: ["ArrowDown"], action: "Moves to the next bar without wrapping." },
    { keys: ["ArrowUp"], action: "Moves to the previous bar without wrapping." },
    { keys: ["Home"], action: "Moves to the first bar." },
    { keys: ["End"], action: "Moves to the last bar." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-value]",
      on: "BarChartBar",
      meaning: "The numeric value represented by this bar group.",
    },
    {
      attribute: "[data-active]",
      on: "BarChartBar",
      meaning: "The bar currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep the category and value axis labels visible; tick labels should use the same units as the table.",
    "Give BarChartPlot a concise aria-label that identifies the chart type and subject.",
    "Wrap custom marks in BarChartBar to expose one roving tab stop; each bar receives a formatted category-and-value name.",
    "ChartTooltip is an optional visual enhancement for hover and focus; never make it the only source of a value.",
    "Include ChartTable when exact values matter; its native headers preserve category and value relationships during screen-reader navigation.",
    "Do not use color as the only way to distinguish bars; the visible category axis must identify each one.",
  ],
  related: ["column-chart", "line-chart", "table"],
});
