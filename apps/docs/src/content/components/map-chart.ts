import { component, p, prop } from "../define.js";

export default component({
  slug: "map-chart",
  title: "Map Chart",
  group: "charts",
  summary: "A caller-defined SVG map whose state paths carry values and remain keyboard reachable.",
  analogy:
    "Like a paper atlas with a data label on every shape: you own the geography while the chart owns the semantics.",
  whenToUse:
    "Use it for custom boundaries such as countries, states, campuses, or voting regions that do not fit a fixed chart type.",
  steps: {
    main: "Start MapChart with one labelled numeric value for each region id.",
    supporting:
      "Give MapChartPlot matching SVG region paths, a viewBox, and center points in that viewBox; wrap each rendered path in MapChartRegion.",
    behavior:
      "Keep a visible table and non-color region labels so the geography never becomes the only way to read a value.",
    code: '<MapChart values={electionStates} regionLabel="US state" valueLabel="Electoral votes">\n  <ChartTitle>Illustrative electoral map by state</ChartTitle>\n  <MapChartPlot\n    aria-label="Map of state electoral votes by party"\n    viewBox="0 0 959 593"\n    regions={usStateGeometry}\n  >\n    {(region) => (\n      <MapChartRegion region={region}>\n        <path d={region.region.d} />\n      </MapChartRegion>\n    )}\n  </MapChartPlot>\n  <ChartTable />\n  <ChartTooltip />\n</MapChart>;',
  },
  imports: [
    "ChartDescription",
    "ChartTable",
    "ChartTitle",
    "ChartTooltip",
    "MapChart",
    "MapChartPlot",
    "MapChartRegion",
  ],
  snippet:
    '<MapChart values={electionStates} regionLabel="US state" valueLabel="Electoral votes"><ChartTitle>Illustrative electoral map by state</ChartTitle><MapChartPlot aria-label="Map of state electoral votes by party" viewBox="0 0 959 593" regions={usStateGeometry}>{(region) => <MapChartRegion region={region}><path d={region.region.d} /></MapChartRegion>}</MapChartPlot><ChartDescription>Every state has its own SVG path and illustrative party assignment.</ChartDescription><ChartTable /><ChartTooltip /></MapChart>',
  parts: [
    p(
      "MapChart",
      "root",
      "Native figure sharing region values, labels, and formatting with every map part.",
      true,
      false,
      [
        prop(
          "values",
          "readonly MapChartValue[]",
          "Unique region ids, labels, and finite numeric values.",
        ),
        prop(
          "regionLabel / valueLabel",
          "string",
          "Visible names for map regions and measured values.",
        ),
        prop(
          "formatValue",
          "(value: number) => string",
          "Formats region announcements and tooltip values.",
        ),
      ],
    ),
    p("ChartTitle", "label", "Native figcaption that visibly names the figure."),
    p(
      "MapChartPlot / MapChartRegion",
      "graphic",
      "Caller-defined SVG paths with spatially navigable region marks.",
      true,
      false,
      [
        prop("aria-label", "string", "Concise text alternative naming the map and subject."),
        prop("viewBox", "string", "Four finite numbers describing the SVG coordinate system."),
        prop(
          "regions",
          "readonly MapChartRegionGeometry[]",
          "Unique paths and center points in viewBox coordinates matching every MapChart value id.",
        ),
        prop(
          "children",
          "(region: MapChartRegionState) => ReactNode",
          "Custom region renderer receiving geometry and value state.",
        ),
        prop("region", "MapChartRegionState", "Geometry and value state passed to MapChartRegion."),
      ],
    ),
    p("ChartDescription", "feedback", "Visible prose explaining the map's important pattern."),
    p(
      "ChartTable",
      "table",
      "Native table that renders a complete default from the chart data: a caption from the ChartTitle text or axis labels, column headers, and one row per value. Pass children for a custom body.",
    ),
    p(
      "ChartTooltip",
      "content",
      "Optional floating region label shown on hover or focus.",
      true,
      true,
      [
        prop("placement", "PopoverPlacement", 'Side of the active mark; defaults to "top".'),
        prop("offset", "number", "Distance from the active mark; defaults to eight pixels."),
        prop(
          "children",
          "ReactNode | (details: ChartValueDetails) => ReactNode",
          "Custom content receiving the active region's formatted details.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["Tab"],
      action: "Enters the map at its current region and leaves with one more Tab.",
    },
    {
      keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
      action: "Moves to the nearest region in the requested direction.",
    },
    { keys: ["Home"], action: "Moves to the first region." },
    { keys: ["End"], action: "Moves to the last region." },
    { keys: ["Escape"], action: "Dismisses an open ChartTooltip." },
  ],
  stateHooks: [
    {
      attribute: "[data-region-id]",
      on: "MapChartRegion",
      meaning: "The caller-defined region id.",
    },
    {
      attribute: "[data-active]",
      on: "MapChartRegion",
      meaning: "The region currently reached by pointer or keyboard.",
    },
    { attribute: "[data-open]", on: "ChartTooltip", meaning: "A value tooltip is visible." },
  ],
  form: "Charts are descriptive content and do not create form values.",
  accessibility: [
    "Treat the caller-owned paths as visual context, not as the text alternative; keep a native table with every region and value.",
    "Give every region a unique id, path, and center point in the plot so directional arrows can choose the nearest spatial region.",
    "Wrap every custom path in MapChartRegion so it receives a formatted region-and-value name and one roving tab stop.",
    "Pair party or category colors with visible labels, patterns, or text inside the regions; never rely on color alone.",
    "Use ChartTooltip as an enhancement while retaining the visible table and description.",
  ],
  related: ["heatmap-chart", "scatter-chart", "table"],
});
