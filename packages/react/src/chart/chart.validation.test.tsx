import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "../../test/render.js";
import { AreaChart } from "../area-chart/AreaChart.js";
import { BarChart } from "../bar-chart/BarChart.js";
import { BarChartPlot } from "../bar-chart/BarChartPlot.js";
import { BoxPlotChart } from "../boxplot-chart/BoxPlotChart.js";
import { CandlestickChart } from "../candlestick-chart/CandlestickChart.js";
import { CandlestickChartPlot } from "../candlestick-chart/CandlestickChartPlot.js";
import { ColumnChart } from "../column-chart/ColumnChart.js";
import { ColumnChartPlot } from "../column-chart/ColumnChartPlot.js";
import { HeatmapChart } from "../heatmap-chart/HeatmapChart.js";
import { HistogramChart } from "../histogram-chart/HistogramChart.js";
import { HistogramChartPlot } from "../histogram-chart/HistogramChartPlot.js";
import { LineChart } from "../line-chart/LineChart.js";
import { LineChartPlot } from "../line-chart/LineChartPlot.js";
import { MapChart } from "../map-chart/MapChart.js";
import { MapChartPlot } from "../map-chart/MapChartPlot.js";
import { PieChart } from "../pie-chart/PieChart.js";
import { PieChartLegend } from "../pie-chart/PieChartLegend.js";
import { PieChartPlot } from "../pie-chart/PieChartPlot.js";
import { SankeyChart } from "../sankey-chart/SankeyChart.js";
import { SankeyChartPlot } from "../sankey-chart/SankeyChartPlot.js";
import { ScatterChart } from "../scatter-chart/ScatterChart.js";
import { StackedBarChart } from "../stacked-bar-chart/StackedBarChart.js";
import { ChartTable } from "./ChartTable.js";

// warnOnce remembers each key for the whole file, so every case below uses labels no other case does.

const quarterlyRevenue = [
  { label: "First quarter", value: 40 },
  { label: "Second quarter", value: -20 },
] as const;

const revenueTrend = [
  { x: 1, y: 40 },
  { x: 2, y: -20 },
  { x: 4, y: 10 },
] as const;

function spyOnErrors() {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}

function messages(error: ReturnType<typeof spyOnErrors>) {
  return error.mock.calls.map(([message]) => message);
}

function tableRows(container: Element) {
  return [...container.querySelectorAll("tbody tr")].map((row) => row.textContent);
}

describe("chart data validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips malformed categorical values and falls back for blank labels", () => {
    const error = spyOnErrors();
    const { container } = render(
      <BarChart
        values={[
          { label: "Unknown", value: Number.NaN },
          { label: "", value: 3 },
          { label: "Known", value: 4 },
        ]}
        categoryLabel=""
        valueLabel="Revenue"
      >
        <ChartTable />
      </BarChart>,
    );

    expect(messages(error)).toEqual([
      "BarChart category label must not be empty.",
      'BarChart value "Unknown" must be finite; received NaN. It was skipped.',
      "BarChart value at index 1 has an empty label and was skipped.",
    ]);
    expect(container.querySelector("caption")?.textContent).toBe("Revenue by Category");
    expect(tableRows(container)).toEqual(["Known4"]);
  });

  it("skips cartesian values that are not finite or do not increase in x", () => {
    const error = spyOnErrors();
    const { container } = render(
      <LineChart
        values={[
          { x: 2, y: 10 },
          { x: 1, y: 20 },
          { x: 3, y: Number.NaN },
          { x: 4, y: 40 },
        ]}
        xLabel="Quarter"
        yLabel="Revenue"
      >
        <LineChartPlot aria-label="Unordered line chart" />
        <ChartTable />
      </LineChart>,
    );

    expect(messages(error)).toEqual([
      "LineChart x values must increase; the value before index 1 is 2 and index 1 is 1. It was skipped.",
      "LineChart y value at index 2 must be finite; received NaN. It was skipped.",
    ]);
    expect(tableRows(container)).toEqual(["210", "440"]);
    expect(container.querySelectorAll("[data-slot='line-chart-line']")).toHaveLength(1);
  });

  it("skips candlesticks whose high and low do not bound open and close", () => {
    const error = spyOnErrors();
    const { container } = render(
      <CandlestickChart
        values={[
          { x: 1, open: 100, high: 105, low: 90, close: 110 },
          { x: 2, open: 100, high: 120, low: 95, close: 110 },
        ]}
        xLabel="Day"
        yLabel="Price"
      >
        <ChartTable />
      </CandlestickChart>,
    );

    expect(messages(error)).toEqual([
      "CandlestickChart high at index 0 must not be below open or close; received high=105, open=100, close=110. It was skipped.",
    ]);
    expect(tableRows(container)).toEqual(["210012095110"]);
  });

  it("skips boxplot summaries that are out of order", () => {
    const error = spyOnErrors();
    const { container } = render(
      <BoxPlotChart
        values={[
          { label: "Invalid", min: 3, q1: 2, median: 4, q3: 5, max: 6 },
          { label: "Valid", min: 1, q1: 2, median: 3, q3: 4, max: 5 },
        ]}
        categoryLabel="Group"
        valueLabel="Value"
      >
        <ChartTable />
      </BoxPlotChart>,
    );

    expect(messages(error)).toEqual([
      'BoxPlotChart value "Invalid" must satisfy min ≤ q1 ≤ median ≤ q3 ≤ max; received min=3, q1=2, median=4, q3=5, max=6. It was skipped.',
    ]);
    expect(tableRows(container)).toEqual(["Valid12345"]);
  });

  it("draws no slices when the pie total overflows and skips negative slices", () => {
    const error = spyOnErrors();
    const { container } = render(
      <>
        <PieChart
          values={[
            { label: "First", value: Number.MAX_VALUE },
            { label: "Second", value: Number.MAX_VALUE },
          ]}
          categoryLabel="Category"
          valueLabel="Share"
        >
          <PieChartPlot aria-label="Overflowing pie" />
        </PieChart>
        <PieChart
          values={[
            { label: "Gain", value: 3 },
            { label: "Loss", value: -1 },
          ]}
          categoryLabel="Category"
          valueLabel="Share"
        >
          <PieChartPlot aria-label="Negative pie" />
        </PieChart>
      </>,
    );

    expect(messages(error)).toEqual([
      "PieChart values must have a finite positive total; received Infinity. No slices were drawn.",
      'PieChart value "Loss" must not be negative; received -1. It was skipped.',
    ]);
    const plots = container.querySelectorAll("[data-slot='pie-chart-plot']");
    expect(plots[0]?.querySelectorAll("[data-slot='pie-chart-slice']")).toHaveLength(0);
    expect(plots[1]?.querySelectorAll("[data-slot='pie-chart-slice']")).toHaveLength(1);
  });

  it("skips stacked categories with duplicate or mismatched segments", () => {
    const error = spyOnErrors();
    const { container } = render(
      <StackedBarChart
        values={[
          {
            label: "Web",
            segments: [
              { label: "New", value: 20 },
              { label: "New", value: 10 },
            ],
          },
          {
            label: "Store",
            segments: [
              { label: "New", value: 5 },
              { label: "Returning", value: 10 },
            ],
          },
          { label: "Phone", segments: [{ label: "New", value: 1 }] },
        ]}
        categoryLabel="Channel"
        valueLabel="Orders"
      >
        <ChartTable />
      </StackedBarChart>,
    );

    expect(messages(error)).toEqual([
      'StackedBarChart category "Web" has duplicate segment label "New". It was skipped.',
      'StackedBarChart category "Phone" must use the same ordered segments as the first category. It was skipped.',
    ]);
    expect(tableRows(container)).toEqual(["Store51015"]);
  });

  it("skips scatter points, heatmap duplicates, and histogram observations that cannot be drawn", () => {
    const error = spyOnErrors();
    const { container } = render(
      <>
        <ScatterChart
          values={[
            { label: "Fine", x: 1, y: 1 },
            { label: "Broken", x: Number.POSITIVE_INFINITY, y: 1 },
          ]}
          xLabel="Effort"
          yLabel="Impact"
        >
          <ChartTable />
        </ScatterChart>
        <HeatmapChart
          values={[
            { x: "A", y: "Top", value: 1 },
            { x: "A", y: "Top", value: 2 },
          ]}
          xLabel="Column"
          yLabel="Row"
          valueLabel="Count"
        >
          <ChartTable />
        </HeatmapChart>
        <HistogramChart values={[1, Number.NaN, 3]} valueLabel="Duration" frequencyLabel="Sessions">
          <HistogramChartPlot aria-label="Durations" binCount={1} />
          <ChartTable />
        </HistogramChart>
      </>,
    );

    expect(messages(error)).toEqual([
      'ScatterChart value "Broken" must have finite coordinates; received x=Infinity, y=1. It was skipped.',
      'HeatmapChart contains more than one value at x="A", y="Top"; only the first is kept. It was skipped.',
      "HistogramChart value at index 1 must be finite; received NaN. It was skipped.",
    ]);
    const tables = container.querySelectorAll("table");
    expect(tableRows(tables[0]!)).toEqual(["Fine11"]);
    expect(tableRows(tables[1]!)).toEqual(["Top1"]);
    expect(tableRows(tables[2]!)).toEqual(["1 to 32"]);
  });

  it("skips map values and regions that cannot be matched", () => {
    const error = spyOnErrors();
    const values = [
      { id: "west", label: "West", value: 10 },
      { id: "east", label: "East", value: 12 },
      { id: "west", label: "Duplicate", value: 1 },
    ] as const;
    const regions = [
      { id: "west", d: "M 2 2 H 48 V 48 H 2 Z", centerX: 25, centerY: 25 },
      { id: "nowhere", d: "M 52 2 H 98 V 48 H 52 Z", centerX: 75, centerY: 25 },
    ] as const;
    const { container } = render(
      <MapChart values={values} regionLabel="Region" valueLabel="Votes">
        <MapChartPlot aria-label="Regional votes" viewBox="0 0 0 50" regions={regions} />
      </MapChart>,
    );

    expect(messages(error)).toEqual([
      'MapChart region id "west" is duplicated. It was skipped.',
      'MapChartPlot viewBox must contain x, y, width, and height with positive dimensions; received "0 0 0 50". "0 0 100 100" was used instead.',
      'MapChartPlot region "nowhere" has no matching MapChart value. It was skipped.',
      'MapChart value "east" has no matching MapChartPlot region. It was not drawn.',
    ]);
    const plot = container.querySelector("[data-slot='map-chart-plot']");
    expect(plot?.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(plot?.querySelectorAll("[data-slot='map-chart-region']")).toHaveLength(1);
  });

  it("breaks sankey cycles by skipping the link that closes them", () => {
    const error = spyOnErrors();
    const { container } = render(
      <SankeyChart
        nodes={[
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ]}
        links={[
          { source: "a", target: "b", value: 1 },
          { source: "b", target: "a", value: 1 },
        ]}
        nodeLabel="Step"
        valueLabel="People"
      >
        <SankeyChartPlot aria-label="Cyclic flow" />
        <ChartTable />
      </SankeyChart>,
    );

    expect(messages(error)).toEqual([
      'SankeyChart link from "b" to "a" would close a cycle; links must form an acyclic flow from left to right. It was skipped.',
    ]);
    expect(tableRows(container)).toEqual(["AB1"]);
  });

  it("shrinks crowded sankey layers to fit instead of overflowing", () => {
    const error = spyOnErrors();
    const targets = Array.from({ length: 11 }, (_, index) => ({
      id: `target-${index}`,
      label: `Target ${index}`,
    }));
    const nodes = [{ id: "source", label: "Source" }, ...targets];
    const links = targets.map((target) => ({ source: "source", target: target.id, value: 1 }));
    const { container } = render(
      <SankeyChart nodes={nodes} links={links} nodeLabel="Step" valueLabel="People">
        <SankeyChartPlot aria-label="Crowded Sankey flow" />
      </SankeyChart>,
    );

    expect(messages(error)).toEqual([
      "SankeyChartPlot layer 1 with 11 nodes exceeds the available height of 92. Its nodes and gaps were shrunk to fit.",
    ]);
    const rects = [...container.querySelectorAll("[data-slot='sankey-chart-node'] rect")];
    const bottoms = rects.map(
      (rect) => Number(rect.getAttribute("y")) + Number(rect.getAttribute("height")),
    );
    expect(rects).toHaveLength(12);
    expect(Math.max(...bottoms)).toBeCloseTo(96);
  });

  it("ignores invalid scale bounds and tick counts with a warning", () => {
    const error = spyOnErrors();
    const { container } = render(
      <ColumnChart values={quarterlyRevenue} categoryLabel="Quarter" valueLabel="Revenue">
        <ColumnChartPlot aria-label="Backwards bounds" yMin={50} yMax={10} yTickCount={1} />
      </ColumnChart>,
    );

    expect(messages(error)).toEqual([
      "ColumnChartPlot max must be greater than min; received min=50, max=10. The bounds were derived from the values instead.",
      "ColumnChartPlot yTickCount must be an integer of at least 2; received 1. It was replaced by 5.",
    ]);
    // Five tick labels plus the axis label.
    expect(container.querySelectorAll("[data-slot='chart-y-axis'] text")).toHaveLength(6);
  });

  it("throws when a shared or chart-specific part has no matching root", () => {
    expect(() => render(<BarChartPlot aria-label="Orphaned plot" />)).toThrow(
      "BarChartPlot must be rendered inside BarChart.",
    );
    expect(() => render(<ColumnChartPlot aria-label="Orphaned plot" />)).toThrow(
      "ColumnChartPlot must be rendered inside ColumnChart.",
    );
    expect(() => render(<CandlestickChartPlot aria-label="Orphaned plot" />)).toThrow(
      "CandlestickChartPlot must be rendered inside CandlestickChart.",
    );
    expect(() =>
      render(
        <BarChart values={quarterlyRevenue} categoryLabel="Quarter" valueLabel="Revenue">
          <PieChartLegend />
        </BarChart>,
      ),
    ).toThrow("PieChartLegend must be rendered inside PieChart.");
    expect(() =>
      render(
        <AreaChart values={revenueTrend} xLabel="Quarter" yLabel="Revenue">
          <LineChartPlot aria-label="Wrong plot" />
        </AreaChart>,
      ),
    ).toThrow("LineChartPlot must be rendered inside LineChart.");
  });
});
