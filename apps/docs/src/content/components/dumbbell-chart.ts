import { component, p, prop } from "../define.js";

export default component({
  slug: "dumbbell-chart",
  title: "Dumbbell Chart",
  group: "charts",
  summary: "A categorical comparison that shows the start and end of every range on one line.",
  analogy:
    "Like two pins joined by a thread: the endpoints show both values and the distance shows the change.",
  whenToUse:
    "Use it to compare before-and-after values or ranges across a small set of categories.",
  steps: {
    main: "Start DumbbellChart with labelled start and end values plus visible axis labels.",
    supporting:
      "Render each range with DumbbellChartDumbbell so its endpoints share one keyboard-reachable mark.",
    behavior:
      "Add a description and native table with both endpoints; use shape and position as well as color to show direction.",
    code: '<DumbbellChart values={delivery} categoryLabel="Service" valueLabel="Hours">\n  <ChartTitle>Delivery-time range</ChartTitle>\n  <DumbbellChartPlot aria-label="Dumbbell chart comparing delivery time ranges">\n    {(dumbbell) => (\n      <DumbbellChartDumbbell dumbbell={dumbbell}>\n        <line x1={dumbbell.startX} x2={dumbbell.endX} y1={dumbbell.y} y2={dumbbell.y} />\n      </DumbbellChartDumbbell>\n    )}\n  </DumbbellChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</DumbbellChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "DumbbellChart",
    "DumbbellChartDumbbell",
    "DumbbellChartPlot",
  ],
  snippet:
    '<DumbbellChart values={delivery} categoryLabel="Service" valueLabel="Hours"><ChartTitle>Delivery-time range</ChartTitle><DumbbellChartPlot aria-label="Dumbbell chart comparing delivery time ranges">{(dumbbell) => <DumbbellChartDumbbell dumbbell={dumbbell}><line x1={dumbbell.startX} x2={dumbbell.endX} y1={dumbbell.y} y2={dumbbell.y} /></DumbbellChartDumbbell>}</DumbbellChartPlot><ChartDescription>Express delivery spans the widest range.</ChartDescription><ChartTable /><ChartTooltip /></DumbbellChart>',
  parts: [
    p(
      "DumbbellChart",
      "root",
      "Native figure sharing categorical ranges, labels, and formatting.",
      true,
      false,
      [
        prop(
          "values",
          "readonly DumbbellChartValue[]",
          "Category labels with finite start and end values.",
        ),
        prop(
          "categoryLabel / valueLabel",
          "string",
          "Visible headings for category and numeric axes.",
        ),
        prop(
          "startLabel / endLabel",
          "string",
          'Accessible endpoint labels; default to "Start" and "End".',
        ),
        prop("formatValue", "(value: number) => string", "Formats endpoint ticks and table cells."),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "DumbbellChartPlot / DumbbellChartDumbbell",
      "graphic",
      "Horizontal SVG ranges with two endpoints and a connecting line.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the comparison."),
        prop("xMin / xMax / xTickCount", "number", "Optional numeric bounds and tick count."),
        prop(
          "children",
          "(dumbbell: DumbbellChartDumbbellState) => ReactNode",
          "Custom range renderer.",
        ),
        prop("dumbbell", "DumbbellChartDumbbellState", "Range state passed to the mark."),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose summarizing the important range."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional floating range label shown on hover or focus.",
      true,
      true,
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the chart at its current range and leaves with one more Tab.",
    },
    { keys: ["ArrowDown"], action: "Moves to the next range without wrapping." },
    { keys: ["ArrowUp"], action: "Moves to the previous range without wrapping." },
    { keys: ["Home"], action: "Moves to the first range." },
    { keys: ["End"], action: "Moves to the last range." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-start] / [data-end]",
      on: "DumbbellChartDumbbell",
      meaning: "The two endpoint values.",
    },
    {
      attribute: "[data-active]",
      on: "DumbbellChartDumbbell",
      meaning: "The range currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Keep category and value axis labels visible and format both endpoints with the same units as the table.",
    "Wrap each range in DumbbellChartDumbbell so its start and end values share one roving tab stop.",
    "Announce both endpoints in the mark name; use endpoint shapes or labels rather than color alone for direction.",
    "Keep ChartTooltip optional and include both exact endpoints in a native table.",
  ],
  related: ["bar-chart", "open-to-close-chart", "table"],
});
