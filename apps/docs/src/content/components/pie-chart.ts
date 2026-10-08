import { component, p, prop } from "../define.js";

export default component({
  slug: "pie-chart",
  title: "Pie Chart",
  group: "charts",
  summary: "A parts-of-a-whole comparison paired with a persistent legend and exact-value table.",
  analogy:
    "Like cutting one labelled cake: each slice shows its share, and the legend names every piece without requiring a hover.",
  whenToUse: "Use it for a few non-negative categories whose total forms a meaningful whole.",
  steps: {
    main: "Start PieChart with labelled values plus headings for categories and values.",
    supporting:
      "Add ChartTitle, PieChartPlot, and PieChartLegend; wrap each rendered path in PieChartSlice so one slice is tabbable and arrow keys reveal the rest.",
    behavior:
      "Add ChartDescription and ChartTable for persistent context and exact values; optionally add ChartTooltip for pointer and keyboard details.",
    code: '<PieChart values={traffic} categoryLabel="Source" valueLabel="Share">\n  <ChartTitle>Traffic by source</ChartTitle>\n  <PieChartPlot aria-label="Pie chart showing traffic share by source">\n    {(slice) => (\n      <PieChartSlice slice={slice}>\n        <path d={slice.path} />\n      </PieChartSlice>\n    )}\n  </PieChartPlot>\n  <PieChartLegend />\n  <ChartDescription>Direct visits are the largest source.</ChartDescription>\n  <ChartTable />\n  <ChartTooltip />\n</PieChart>;',
  },
  imports: [
    "ChartDescription",
    "PieChartLegend",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "PieChart",
    "PieChartPlot",
    "PieChartSlice",
  ],
  snippet:
    '<PieChart values={traffic} categoryLabel="Source" valueLabel="Share"><ChartTitle>Traffic by source</ChartTitle><PieChartPlot aria-label="Pie chart showing traffic share by source">{(slice) => <PieChartSlice slice={slice}><path d={slice.path} /></PieChartSlice>}</PieChartPlot><PieChartLegend /><ChartDescription>Direct visits are the largest source.</ChartDescription><ChartTable /><ChartTooltip /></PieChart>',
  parts: [
    p(
      "PieChart",
      "root",
      "Native figure sharing non-negative categories, labels, and formatting with every part.",
      true,
      false,
      [
        prop(
          "values",
          "readonly CategoricalChartValue[]",
          "Non-negative category values whose total must be positive.",
        ),
        prop(
          "categoryLabel / valueLabel",
          "string",
          "Visible headings for legend and table values.",
        ),
        prop(
          "formatValue",
          "(value: number) => string",
          "Formatter shared by legend and table values.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "PieChartPlot / PieChartSlice",
      "graphic",
      "SVG slices showing each category as a proportion of the whole.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the graphic and whole."),
        prop(
          "children",
          "(slice: PieChartSliceState) => ReactNode",
          "Custom slice renderer receiving the category, path, angles, and percentage.",
        ),
        prop("slice", "PieChartSliceState", "Slice state passed from the plot to PieChartSlice."),
        prop(
          "PieChartSlice children",
          "ReactNode",
          "SVG shapes grouped into one named, keyboard-reachable slice.",
        ),
      ],
    ),
    p(
      "PieChartLegend",
      "item",
      "Persistent native list pairing every category with its formatted value and percentage.",
      true,
      false,
      [
        prop(
          "children",
          "(item: PieChartLegendItem) => ReactNode",
          "Custom legend entry renderer receiving category, formatted value, and percentage.",
        ),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing the important proportion."),
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
          "Custom content receiving the active slice's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current slice and leaves with one more Tab.",
    },
    {
      keys: ["ArrowRight", "ArrowDown"],
      action: "Moves to the next slice, wrapping from the last slice to the first.",
    },
    {
      keys: ["ArrowLeft", "ArrowUp"],
      action: "Moves to the previous slice, wrapping from the first slice to the last.",
    },
    { keys: ["Home"], action: "Moves to the first slice." },
    { keys: ["End"], action: "Moves to the last slice." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-value]",
      on: "PieChartSlice / PieChartLegend",
      meaning: "The numeric value represented by this slice or legend entry.",
    },
    {
      attribute: "[data-active]",
      on: "PieChartSlice",
      meaning: "The slice currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Give PieChartPlot a concise aria-label that identifies the chart type and whole being divided.",
    "Keep PieChartLegend persistent and adjacent to the graphic so labels and values never depend on hover or focus.",
    "Wrap custom paths in PieChartSlice to expose one roving tab stop; each slice receives its category, formatted value, and percentage as a name.",
    "ChartTooltip is an optional visual enhancement for hover and focus; never make it the only source of a value.",
    "Include ChartTable when exact values matter; its native headers preserve relationships during screen-reader navigation.",
    "Do not use color as the only way to distinguish slices; pair every swatch with its visible category label.",
  ],
  related: ["area-chart", "bar-chart", "table"],
});
