import { type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { AreaChart } from "../area-chart/AreaChart.js";
import { BarChart } from "../bar-chart/BarChart.js";
import { BoxPlotChart } from "../boxplot-chart/BoxPlotChart.js";
import { CandlestickChart } from "../candlestick-chart/CandlestickChart.js";
import { ColumnChart } from "../column-chart/ColumnChart.js";
import { DumbbellChart } from "../dumbbell-chart/DumbbellChart.js";
import { HeatmapChart } from "../heatmap-chart/HeatmapChart.js";
import { HistogramChart } from "../histogram-chart/HistogramChart.js";
import { HistogramChartPlot } from "../histogram-chart/HistogramChartPlot.js";
import { LineChart } from "../line-chart/LineChart.js";
import { LollipopChart } from "../lollipop-chart/LollipopChart.js";
import { MapChart } from "../map-chart/MapChart.js";
import { OpenToCloseChart } from "../open-to-close-chart/OpenToCloseChart.js";
import { PieChart } from "../pie-chart/PieChart.js";
import { SankeyChart } from "../sankey-chart/SankeyChart.js";
import { ScatterChart } from "../scatter-chart/ScatterChart.js";
import { StackedBarChart } from "../stacked-bar-chart/StackedBarChart.js";
import { StackedColumnChart } from "../stacked-column-chart/StackedColumnChart.js";
import { ChartTable } from "./ChartTable.js";
import { ChartTitle } from "./ChartTitle.js";

const categories = [
  { label: "North", value: 4 },
  { label: "South", value: 6 },
] as const;
const points = [
  { x: 1, y: 10 },
  { x: 2, y: 20 },
] as const;
const stacked = [
  {
    label: "Q1",
    segments: [
      { label: "Free", value: 1 },
      { label: "Pro", value: 2 },
    ],
  },
  {
    label: "Q2",
    segments: [
      { label: "Free", value: 3 },
      { label: "Pro", value: 4 },
    ],
  },
] as const;

type TableCase = {
  name: string;
  chart: (table: ReactElement) => ReactElement;
  caption: string;
  head: string[];
  rows: string[][];
};

const cases: TableCase[] = [
  {
    name: "BarChart",
    chart: (table) => (
      <BarChart
        values={categories}
        categoryLabel="Region"
        valueLabel="Sales"
        formatValue={(v) => `${v}k`}
      >
        {table}
      </BarChart>
    ),
    caption: "Sales by Region",
    head: ["Region", "Sales"],
    rows: [
      ["North", "4k"],
      ["South", "6k"],
    ],
  },
  {
    name: "ColumnChart",
    chart: (table) => (
      <ColumnChart values={categories} categoryLabel="Region" valueLabel="Sales">
        {table}
      </ColumnChart>
    ),
    caption: "Sales by Region",
    head: ["Region", "Sales"],
    rows: [
      ["North", "4"],
      ["South", "6"],
    ],
  },
  {
    name: "PieChart",
    chart: (table) => (
      <PieChart values={categories} categoryLabel="Region" valueLabel="Share">
        {table}
      </PieChart>
    ),
    caption: "Share by Region",
    head: ["Region", "Share"],
    rows: [
      ["North", "4"],
      ["South", "6"],
    ],
  },
  {
    name: "LollipopChart",
    chart: (table) => (
      <LollipopChart values={categories} categoryLabel="Region" valueLabel="Sales">
        {table}
      </LollipopChart>
    ),
    caption: "Sales by Region",
    head: ["Region", "Sales"],
    rows: [
      ["North", "4"],
      ["South", "6"],
    ],
  },
  {
    name: "LineChart",
    chart: (table) => (
      <LineChart values={points} xLabel="Day" yLabel="Visits" formatX={(v) => `Day ${v}`}>
        {table}
      </LineChart>
    ),
    caption: "Visits by Day",
    head: ["Day", "Visits"],
    rows: [
      ["Day 1", "10"],
      ["Day 2", "20"],
    ],
  },
  {
    name: "AreaChart",
    chart: (table) => (
      <AreaChart values={points} xLabel="Day" yLabel="Visits">
        {table}
      </AreaChart>
    ),
    caption: "Visits by Day",
    head: ["Day", "Visits"],
    rows: [
      ["1", "10"],
      ["2", "20"],
    ],
  },
  {
    name: "ScatterChart",
    chart: (table) => (
      <ScatterChart
        values={[
          { label: "Alpha", x: 1, y: 2 },
          { label: "Beta", x: 3, y: 4 },
        ]}
        xLabel="Effort"
        yLabel="Impact"
      >
        {table}
      </ScatterChart>
    ),
    caption: "Impact by Effort",
    head: ["Label", "Effort", "Impact"],
    rows: [
      ["Alpha", "1", "2"],
      ["Beta", "3", "4"],
    ],
  },
  {
    name: "StackedBarChart",
    chart: (table) => (
      <StackedBarChart values={stacked} categoryLabel="Quarter" valueLabel="Signups">
        {table}
      </StackedBarChart>
    ),
    caption: "Signups by Quarter",
    head: ["Quarter", "Free", "Pro", "Total"],
    rows: [
      ["Q1", "1", "2", "3"],
      ["Q2", "3", "4", "7"],
    ],
  },
  {
    name: "StackedColumnChart",
    chart: (table) => (
      <StackedColumnChart values={stacked} categoryLabel="Quarter" valueLabel="Signups">
        {table}
      </StackedColumnChart>
    ),
    caption: "Signups by Quarter",
    head: ["Quarter", "Free", "Pro", "Total"],
    rows: [
      ["Q1", "1", "2", "3"],
      ["Q2", "3", "4", "7"],
    ],
  },
  {
    name: "CandlestickChart",
    chart: (table) => (
      <CandlestickChart
        values={[
          { x: 1, open: 2, high: 4, low: 1, close: 3 },
          { x: 2, open: 3, high: 5, low: 2, close: 4 },
        ]}
        xLabel="Day"
        yLabel="Price"
      >
        {table}
      </CandlestickChart>
    ),
    caption: "Price by Day",
    head: ["Day", "Open", "High", "Low", "Close"],
    rows: [
      ["1", "2", "4", "1", "3"],
      ["2", "3", "5", "2", "4"],
    ],
  },
  {
    name: "DumbbellChart",
    chart: (table) => (
      <DumbbellChart
        values={[
          { label: "Ship", start: 1, end: 3 },
          { label: "Pack", start: 2, end: 5 },
        ]}
        categoryLabel="Step"
        valueLabel="Hours"
      >
        {table}
      </DumbbellChart>
    ),
    caption: "Hours by Step",
    head: ["Step", "Start", "End"],
    rows: [
      ["Ship", "1", "3"],
      ["Pack", "2", "5"],
    ],
  },
  {
    name: "BoxPlotChart",
    chart: (table) => (
      <BoxPlotChart
        values={[{ label: "Read", min: 1, q1: 2, median: 3, q3: 4, max: 5 }]}
        categoryLabel="Operation"
        valueLabel="Latency"
      >
        {table}
      </BoxPlotChart>
    ),
    caption: "Latency by Operation",
    head: ["Operation", "Min", "Q1", "Median", "Q3", "Max"],
    rows: [["Read", "1", "2", "3", "4", "5"]],
  },
  {
    name: "OpenToCloseChart",
    chart: (table) => (
      <OpenToCloseChart
        values={[
          { x: 1, open: 2, close: 3 },
          { x: 2, open: 3, close: 1 },
        ]}
        xLabel="Day"
        yLabel="Price"
      >
        {table}
      </OpenToCloseChart>
    ),
    caption: "Price by Day",
    head: ["Day", "Open", "Close"],
    rows: [
      ["1", "2", "3"],
      ["2", "3", "1"],
    ],
  },
  {
    name: "HistogramChart",
    chart: (table) => (
      <HistogramChart values={[0, 1, 2, 3, 4]} valueLabel="Duration" frequencyLabel="Sessions">
        {table}
      </HistogramChart>
    ),
    caption: "Sessions by Duration",
    head: ["Duration", "Sessions"],
    rows: [
      ["0 to 1.3333333333333333", "2"],
      ["1.3333333333333333 to 2.6666666666666665", "1"],
      ["2.6666666666666665 to 4", "2"],
    ],
  },
  {
    name: "HeatmapChart",
    chart: (table) => (
      <HeatmapChart
        values={[
          { x: "AM", y: "Mon", value: 1 },
          { x: "PM", y: "Mon", value: 2 },
          { x: "AM", y: "Tue", value: 3 },
        ]}
        xLabel="Time"
        yLabel="Day"
        valueLabel="Requests"
      >
        {table}
      </HeatmapChart>
    ),
    caption: "Requests by Day and Time",
    head: ["Day", "AM", "PM"],
    rows: [
      ["Mon", "1", "2"],
      ["Tue", "3", ""],
    ],
  },
  {
    name: "SankeyChart",
    chart: (table) => (
      <SankeyChart
        nodes={[
          { id: "a", label: "Visit" },
          { id: "b", label: "Buy" },
        ]}
        links={[{ source: "a", target: "b", value: 5 }]}
        nodeLabel="Step"
        valueLabel="People"
      >
        {table}
      </SankeyChart>
    ),
    caption: "People by Step",
    head: ["From", "To", "People"],
    rows: [["Visit", "Buy", "5"]],
  },
  {
    name: "MapChart",
    chart: (table) => (
      <MapChart
        values={[
          { id: "se", label: "Sweden", value: 3 },
          { id: "no", label: "Norway", value: 5 },
        ]}
        regionLabel="Country"
        valueLabel="Votes"
      >
        {table}
      </MapChart>
    ),
    caption: "Votes by Country",
    head: ["Country", "Votes"],
    rows: [
      ["Sweden", "3"],
      ["Norway", "5"],
    ],
  },
];

function readTable(container: HTMLElement) {
  const table = container.querySelector("table");
  return {
    table,
    caption: table?.querySelector("caption")?.textContent,
    head: [...(table?.querySelectorAll("thead th") ?? [])].map((cell) => cell.textContent),
    rows: [...(table?.querySelectorAll("tbody tr") ?? [])].map((row) =>
      [...row.children].map((cell) => cell.textContent),
    ),
  };
}

describe("ChartTable default content", () => {
  it.each(cases)("renders a complete table for $name", ({ chart, caption, head, rows }) => {
    const { container } = render(chart(<ChartTable />));
    const result = readTable(container);
    expect(result.caption).toBe(caption);
    expect(result.head).toEqual(head);
    expect(result.rows).toEqual(rows.map(([header, ...cells]) => [header, ...cells]));
    expect(result.table?.querySelectorAll("tbody th[scope='row']")).toHaveLength(rows.length);
    expect(result.table?.querySelectorAll("thead th[scope='col']")).toHaveLength(head.length);
  });

  it("prefers the ChartTitle text for the caption", () => {
    const { container } = render(
      <BarChart values={categories} categoryLabel="Region" valueLabel="Sales">
        <ChartTitle>Regional sales</ChartTitle>
        <ChartTable />
      </BarChart>,
    );
    expect(readTable(container).caption).toBe("Regional sales");
  });

  it("follows a custom histogram bin count", () => {
    const { container } = render(
      <HistogramChart values={[0, 1, 2, 3, 4]} valueLabel="Duration" frequencyLabel="Sessions">
        <HistogramChartPlot aria-label="Durations" binCount={2} />
        <ChartTable />
      </HistogramChart>,
    );
    expect(readTable(container).rows).toEqual([
      ["0 to 2", "2"],
      ["2 to 4", "3"],
    ]);
  });

  it("renders custom children instead of the default", () => {
    const { container } = render(
      <BarChart values={categories} categoryLabel="Region" valueLabel="Sales">
        <ChartTable>
          <caption>Mine</caption>
          <tbody>
            <tr>
              <td>custom</td>
            </tr>
          </tbody>
        </ChartTable>
      </BarChart>,
    );
    const result = readTable(container);
    expect(result.caption).toBe("Mine");
    expect(result.head).toEqual([]);
    expect(result.rows).toEqual([["custom"]]);
  });

  it("renders chart roots and parts as another element with as", () => {
    const { container } = render(
      <BarChart as="section" values={categories} categoryLabel="Region" valueLabel="Sales">
        <ChartTitle as="h2">Regional sales</ChartTitle>
        <ChartTable as="table" />
      </BarChart>,
    );
    expect(container.querySelector("section[data-slot='chart']")).not.toBeNull();
    expect(container.querySelector("h2[data-slot='chart-title']")).not.toBeNull();
  });
});
