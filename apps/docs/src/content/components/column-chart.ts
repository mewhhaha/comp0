import { component, p, prop } from "../define.js";

export default component({
  slug: "column-chart",
  title: "Column Chart",
  group: "charts",
  summary:
    "A vertical categorical comparison with visible axes and the same exact values in a native table.",
  analogy:
    "Like labelled measuring sticks standing side by side: their heights make differences quick to compare.",
  whenToUse:
    "Use it to compare a small set of short-labelled categories or emphasize change in magnitude.",
  steps: {
    main: "Start ColumnChart with labelled values plus visible category and value axis labels.",
    supporting:
      "Add ChartTitle and ColumnChartPlot; wrap each rendered column in ColumnChartColumn so one column is tabbable and arrow keys reveal the rest.",
    behavior:
      "Add ChartDescription and ChartTable for persistent context and exact values; optionally add ChartTooltip for pointer and keyboard details.",
    code: '<ColumnChart values={traffic} categoryLabel="Source" valueLabel="Share">\n  <ChartTitle>Traffic by source</ChartTitle>\n  <ColumnChartPlot aria-label="Column chart comparing traffic share by source">\n    {(column) => (\n      <ColumnChartColumn column={column}>\n        <rect x={column.x} y={column.y} width={column.width} height={column.height} />\n      </ColumnChartColumn>\n    )}\n  </ColumnChartPlot>\n  <ChartDescription>Direct visits are the largest source.</ChartDescription>\n  <ChartTable />\n  <ChartTooltip />\n</ColumnChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "ColumnChart",
    "ColumnChartColumn",
    "ColumnChartPlot",
  ],
  snippet:
    '<ColumnChart values={traffic} categoryLabel="Source" valueLabel="Share"><ChartTitle>Traffic by source</ChartTitle><ColumnChartPlot aria-label="Column chart comparing traffic share by source">{(column) => <ColumnChartColumn column={column}><rect x={column.x} y={column.y} width={column.width} height={column.height} /></ColumnChartColumn>}</ColumnChartPlot><ChartDescription>Direct visits are the largest source.</ChartDescription><ChartTable /><ChartTooltip /></ColumnChart>',
  parts: [
    p(
      "ColumnChart",
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
        prop("categoryLabel", "string", "Visible heading for the horizontal category axis."),
        prop("valueLabel", "string", "Visible heading for the vertical numeric axis."),
        prop(
          "formatValue",
          "(value: number) => string",
          "Formats numeric axis ticks and table cells.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "ColumnChartPlot / ColumnChartColumn",
      "graphic",
      "Vertical SVG columns with visible category and numeric axes.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the graphic and subject."),
        prop(
          "yMin / yMax",
          "number",
          "Optional finite vertical scale bounds that must contain every value and zero.",
        ),
        prop("yTickCount", "number", "Visible numeric-axis tick count; defaults to five."),
        prop(
          "children",
          "(column: ColumnChartColumnState) => ReactNode",
          "Custom column renderer receiving the category, value, and SVG geometry.",
        ),
        prop(
          "column",
          "ColumnChartColumnState",
          "Column state passed from the plot to ColumnChartColumn.",
        ),
        prop(
          "ColumnChartColumn children",
          "ReactNode",
          "SVG shapes grouped into one named, keyboard-reachable column.",
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
          "Custom content receiving the active column's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current column and leaves with one more Tab.",
    },
    { keys: ["ArrowRight"], action: "Moves to the next column without wrapping." },
    { keys: ["ArrowLeft"], action: "Moves to the previous column without wrapping." },
    { keys: ["Home"], action: "Moves to the first column." },
    { keys: ["End"], action: "Moves to the last column." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-value]",
      on: "ColumnChartColumn",
      meaning: "The numeric value represented by this column group.",
    },
    {
      attribute: "[data-active]",
      on: "ColumnChartColumn",
      meaning: "The column currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep the category and value axis labels visible; tick labels should use the same units as the table.",
    "Give ColumnChartPlot a concise aria-label that identifies the chart type and subject.",
    "Wrap custom marks in ColumnChartColumn to expose one roving tab stop; each column receives a formatted category-and-value name.",
    "ChartTooltip is an optional visual enhancement for hover and focus; never make it the only source of a value.",
    "Include ChartTable when exact values matter; its native headers preserve category and value relationships during screen-reader navigation.",
    "Do not use color as the only way to distinguish columns; the visible category axis must identify each one.",
  ],
  related: ["bar-chart", "line-chart", "table"],
});
