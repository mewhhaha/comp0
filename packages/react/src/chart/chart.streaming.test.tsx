import { type ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "../../test/render.js";
import { AreaChart } from "../area-chart/AreaChart.js";
import { AreaChartPlot } from "../area-chart/AreaChartPlot.js";
import { BarChart } from "../bar-chart/BarChart.js";
import { BarChartPlot } from "../bar-chart/BarChartPlot.js";
import { BoxPlotChart } from "../boxplot-chart/BoxPlotChart.js";
import { BoxPlotChartPlot } from "../boxplot-chart/BoxPlotChartPlot.js";
import { BusyRegion } from "../busy-region/BusyRegion.js";
import { CandlestickChart } from "../candlestick-chart/CandlestickChart.js";
import { CandlestickChartPlot } from "../candlestick-chart/CandlestickChartPlot.js";
import { ColumnChart } from "../column-chart/ColumnChart.js";
import { ColumnChartPlot } from "../column-chart/ColumnChartPlot.js";
import { DumbbellChart } from "../dumbbell-chart/DumbbellChart.js";
import { DumbbellChartPlot } from "../dumbbell-chart/DumbbellChartPlot.js";
import { HeatmapChart } from "../heatmap-chart/HeatmapChart.js";
import { HeatmapChartPlot } from "../heatmap-chart/HeatmapChartPlot.js";
import { HistogramChart } from "../histogram-chart/HistogramChart.js";
import { HistogramChartPlot } from "../histogram-chart/HistogramChartPlot.js";
import { LineChart } from "../line-chart/LineChart.js";
import { LineChartPlot } from "../line-chart/LineChartPlot.js";
import { LollipopChart } from "../lollipop-chart/LollipopChart.js";
import { LollipopChartPlot } from "../lollipop-chart/LollipopChartPlot.js";
import { MapChart } from "../map-chart/MapChart.js";
import { MapChartPlot } from "../map-chart/MapChartPlot.js";
import { OpenToCloseChart } from "../open-to-close-chart/OpenToCloseChart.js";
import { OpenToCloseChartPlot } from "../open-to-close-chart/OpenToCloseChartPlot.js";
import { PieChart } from "../pie-chart/PieChart.js";
import { PieChartPlot } from "../pie-chart/PieChartPlot.js";
import { SankeyChart } from "../sankey-chart/SankeyChart.js";
import { SankeyChartPlot } from "../sankey-chart/SankeyChartPlot.js";
import { ScatterChart } from "../scatter-chart/ScatterChart.js";
import { ScatterChartPlot } from "../scatter-chart/ScatterChartPlot.js";
import { StackedBarChart } from "../stacked-bar-chart/StackedBarChart.js";
import { StackedBarChartPlot } from "../stacked-bar-chart/StackedBarChartPlot.js";
import { StackedColumnChart } from "../stacked-column-chart/StackedColumnChart.js";
import { StackedColumnChartPlot } from "../stacked-column-chart/StackedColumnChartPlot.js";
import { ChartTable } from "./ChartTable.js";

/*
 * Charts arrive value by value inside a busy region. Incomplete or transiently
 * invalid data must stay silent and keep the DOM stable; once the region settles,
 * data that is still invalid warns exactly once. warnOnce remembers each key for
 * the whole file, so every case uses chart-specific labels.
 */

type ChartCase = {
  name: string;
  /** Renders the chart with `count` valid values, plus one invalid value when `defect` is set. */
  chart: (count: number, defect: boolean) => ReactElement;
  /** Text every report for the defect contains. */
  defect: string;
};

const category = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ label: `item ${index}`, value: index + 1 }));
const cartesian = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ x: index + 1, y: index + 2 }));
const stacked = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    label: `group ${index}`,
    segments: [
      { label: "first", value: 1 },
      { label: "second", value: 2 },
    ],
  }));

const badStack = {
  label: "bad stack",
  segments: [
    { label: "first", value: 1 },
    { label: "second", value: -4 },
  ],
};

const cases: ChartCase[] = [
  {
    name: "BarChart",
    defect: 'BarChart value "bad bar" must be finite',
    chart: (count, defect) => (
      <BarChart
        values={[...category(count), ...(defect ? [{ label: "bad bar", value: Number.NaN }] : [])]}
        categoryLabel="Measure"
        valueLabel="Score"
      >
        <BarChartPlot aria-label="Bars" />
        <ChartTable />
      </BarChart>
    ),
  },
  {
    name: "ColumnChart",
    defect: 'ColumnChart value "bad column" must be finite',
    chart: (count, defect) => (
      <ColumnChart
        values={[
          ...category(count),
          ...(defect ? [{ label: "bad column", value: Number.NaN }] : []),
        ]}
        categoryLabel="Measure"
        valueLabel="Score"
      >
        <ColumnChartPlot aria-label="Columns" />
        <ChartTable />
      </ColumnChart>
    ),
  },
  {
    name: "LollipopChart",
    defect: 'LollipopChart value "bad lollipop" must be finite',
    chart: (count, defect) => (
      <LollipopChart
        values={[
          ...category(count),
          ...(defect ? [{ label: "bad lollipop", value: Number.NaN }] : []),
        ]}
        categoryLabel="Measure"
        valueLabel="Score"
      >
        <LollipopChartPlot aria-label="Lollipops" />
        <ChartTable />
      </LollipopChart>
    ),
  },
  {
    name: "PieChart",
    defect: 'PieChart value "bad slice" must be finite',
    chart: (count, defect) => (
      <PieChart
        values={[
          ...category(count),
          ...(defect ? [{ label: "bad slice", value: Number.NaN }] : []),
        ]}
        categoryLabel="Share"
        valueLabel="Votes"
      >
        <PieChartPlot aria-label="Slices" />
        <ChartTable />
      </PieChart>
    ),
  },
  {
    name: "LineChart",
    defect: "LineChart y value at index",
    chart: (count, defect) => (
      <LineChart
        values={[...cartesian(count), ...(defect ? [{ x: 50, y: Number.NaN }] : [])]}
        xLabel="Day"
        yLabel="Visits"
      >
        <LineChartPlot aria-label="Line" />
        <ChartTable />
      </LineChart>
    ),
  },
  {
    name: "AreaChart",
    defect: "AreaChart y value at index",
    chart: (count, defect) => (
      <AreaChart
        values={[...cartesian(count), ...(defect ? [{ x: 50, y: Number.NaN }] : [])]}
        xLabel="Day"
        yLabel="Visits"
      >
        <AreaChartPlot aria-label="Area" />
        <ChartTable />
      </AreaChart>
    ),
  },
  {
    name: "ScatterChart",
    defect: 'ScatterChart value "bad dot" must have finite coordinates',
    chart: (count, defect) => (
      <ScatterChart
        values={[
          ...cartesian(count).map((value, index) => ({ ...value, label: `dot ${index}` })),
          ...(defect ? [{ label: "bad dot", x: 3, y: Number.NaN }] : []),
        ]}
        xLabel="Width"
        yLabel="Height"
      >
        <ScatterChartPlot aria-label="Dots" />
        <ChartTable />
      </ScatterChart>
    ),
  },
  {
    name: "StackedBarChart",
    defect: 'StackedBarChart segment "second" in "bad stack"',
    chart: (count, defect) => (
      <StackedBarChart
        values={[...stacked(count), ...(defect ? [badStack] : [])]}
        categoryLabel="Team"
        valueLabel="Hours"
      >
        <StackedBarChartPlot aria-label="Stacked bars" />
        <ChartTable />
      </StackedBarChart>
    ),
  },
  {
    name: "StackedColumnChart",
    defect: 'StackedColumnChart segment "second" in "bad stack"',
    chart: (count, defect) => (
      <StackedColumnChart
        values={[...stacked(count), ...(defect ? [badStack] : [])]}
        categoryLabel="Team"
        valueLabel="Hours"
      >
        <StackedColumnChartPlot aria-label="Stacked columns" />
        <ChartTable />
      </StackedColumnChart>
    ),
  },
  {
    name: "HistogramChart",
    defect: "HistogramChart value at index",
    chart: (count, defect) => (
      <HistogramChart
        values={[...cartesian(count).map((value) => value.y), ...(defect ? [Number.NaN] : [])]}
        valueLabel="Latency"
        frequencyLabel="Requests"
      >
        <HistogramChartPlot aria-label="Histogram" />
        <ChartTable />
      </HistogramChart>
    ),
  },
  {
    name: "HeatmapChart",
    defect: "HeatmapChart value at x=",
    chart: (count, defect) => (
      <HeatmapChart
        values={[
          ...Array.from({ length: count }, (_, index) => ({
            x: `col ${index}`,
            y: "row",
            value: index + 1,
          })),
          ...(defect ? [{ x: "bad col", y: "row", value: Number.NaN }] : []),
        ]}
        xLabel="Hour"
        yLabel="Weekday"
        valueLabel="Events"
      >
        <HeatmapChartPlot aria-label="Heatmap" />
        <ChartTable />
      </HeatmapChart>
    ),
  },
  {
    name: "CandlestickChart",
    defect: "CandlestickChart open value at index",
    chart: (count, defect) => (
      <CandlestickChart
        values={[
          ...Array.from({ length: count }, (_, index) => ({
            x: index + 1,
            open: 10,
            high: 20,
            low: 5,
            close: 15,
          })),
          ...(defect ? [{ x: 50, open: Number.NaN, high: 20, low: 5, close: 15 }] : []),
        ]}
        xLabel="Day"
        yLabel="Price"
      >
        <CandlestickChartPlot aria-label="Candles" />
        <ChartTable />
      </CandlestickChart>
    ),
  },
  {
    name: "DumbbellChart",
    defect: 'DumbbellChart value "bad range" must have finite endpoints',
    chart: (count, defect) => (
      <DumbbellChart
        values={[
          ...Array.from({ length: count }, (_, index) => ({
            label: `range ${index}`,
            start: index,
            end: index + 3,
          })),
          ...(defect ? [{ label: "bad range", start: Number.NaN, end: 4 }] : []),
        ]}
        categoryLabel="Team"
        valueLabel="Score"
      >
        <DumbbellChartPlot aria-label="Ranges" />
        <ChartTable />
      </DumbbellChart>
    ),
  },
  {
    name: "BoxPlotChart",
    defect: 'BoxPlotChart value "bad box" must satisfy',
    chart: (count, defect) => (
      <BoxPlotChart
        values={[
          ...Array.from({ length: count }, (_, index) => ({
            label: `box ${index}`,
            min: 1,
            q1: 2,
            median: 3,
            q3: 4,
            max: 5,
          })),
          ...(defect ? [{ label: "bad box", min: 3, q1: 2, median: 4, q3: 5, max: 6 }] : []),
        ]}
        categoryLabel="Group"
        valueLabel="Value"
      >
        <BoxPlotChartPlot aria-label="Boxes" />
        <ChartTable />
      </BoxPlotChart>
    ),
  },
  {
    name: "OpenToCloseChart",
    defect: "OpenToCloseChart value at index",
    chart: (count, defect) => (
      <OpenToCloseChart
        values={[
          ...Array.from({ length: count }, (_, index) => ({
            x: index + 1,
            open: 10,
            close: 12,
          })),
          ...(defect ? [{ x: 50, open: Number.NaN, close: 12 }] : []),
        ]}
        xLabel="Day"
        yLabel="Price"
      >
        <OpenToCloseChartPlot aria-label="Open to close" />
        <ChartTable />
      </OpenToCloseChart>
    ),
  },
  {
    name: "MapChart",
    defect: 'MapChart region "bad-region" must have a finite value',
    chart: (count, defect) => {
      const values = Array.from({ length: count }, (_, index) => ({
        id: `region-${index}`,
        label: `Region ${index}`,
        value: index + 1,
      }));
      if (defect) values.push({ id: "bad-region", label: "Bad region", value: Number.NaN });
      const regions = values.slice(0, count).map((value) => ({
        id: value.id,
        d: "M0 0h10v10z",
        centerX: 5,
        centerY: 5,
      }));
      return (
        <MapChart values={values} regionLabel="Region" valueLabel="Sales">
          <MapChartPlot aria-label="Map" viewBox="0 0 100 100" regions={regions} />
          <ChartTable />
        </MapChart>
      );
    },
  },
  {
    name: "SankeyChart",
    defect: "SankeyChart link at index",
    chart: (count, defect) => {
      const nodes = Array.from({ length: count + 1 }, (_, index) => ({
        id: `n${index}`,
        label: `Node ${index}`,
      }));
      const links = Array.from({ length: count }, (_, index) => ({
        source: `n${index}`,
        target: `n${index + 1}`,
        value: 3,
      }));
      if (defect) links.push({ source: "ghost", target: "n0", value: 1 });
      return (
        <SankeyChart nodes={nodes} links={links} nodeLabel="Stage" valueLabel="People">
          <SankeyChartPlot aria-label="Flow" />
          <ChartTable />
        </SankeyChart>
      );
    },
  },
];

function busy(chart: ReactElement, isBusy = true) {
  return <BusyRegion busy={isBusy}>{chart}</BusyRegion>;
}

describe("charts inside a busy region", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(cases)(
    "$name stays silent, stable, and unfocused while values stream in",
    ({ chart }) => {
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const outside = document.createElement("button");
      document.body.append(outside);
      const { container, rerender } = render(busy(chart(1, false)));
      outside.focus();
      const firstRow = container.querySelector("tbody tr");
      const initialCells = container.querySelectorAll("tbody td").length;
      const figure = container.querySelector("figure");
      expect(firstRow).not.toBeNull();

      // A value that is transiently invalid while streaming, then replaced by a valid one.
      rerender(busy(chart(2, true)));
      rerender(busy(chart(3, false)));

      expect(container.querySelector("tbody tr")).toBe(firstRow);
      expect(container.querySelector("figure")).toBe(figure);
      expect(container.querySelectorAll("tbody td").length).toBeGreaterThan(initialCells);
      expect(document.activeElement).toBe(outside);
      expect(error).not.toHaveBeenCalled();

      rerender(busy(chart(3, false), false));
      expect(error).not.toHaveBeenCalled();
    },
  );

  it.each(cases)("$name reports data that is still invalid once the region settles", (testCase) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container, rerender } = render(busy(testCase.chart(1, false)));
    const firstRow = container.querySelector("tbody tr");

    rerender(busy(testCase.chart(3, true)));
    expect(error).not.toHaveBeenCalled();

    rerender(busy(testCase.chart(3, true), false));
    const reports = error.mock.calls.map(([message]) => String(message));
    expect(reports).toHaveLength(1);
    expect(reports[0]).toContain(testCase.defect);
    expect(container.querySelector("tbody tr")).toBe(firstRow);

    rerender(busy(testCase.chart(3, true), false));
    expect(error).toHaveBeenCalledTimes(1);
  });
});
