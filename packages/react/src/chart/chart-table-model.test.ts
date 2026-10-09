import { describe, expect, it } from "vitest";
import { warnOnce } from "../internal/dev.js";
import { chartTableModel } from "./chart-table-model.js";
import { type HistogramBinOptions } from "./chart-meta.js";
import { type ChartContextValue } from "./chart-shared.js";

const none: HistogramBinOptions = { binCount: undefined, xMin: undefined, xMax: undefined };
const dollars = (value: number) => `$${value}`;
const day = (value: number | Date) => `Day ${String(value)}`;

function model(context: ChartContextValue, options: HistogramBinOptions = none) {
  const { caption, columns, rows } = chartTableModel(warnOnce, context, options);
  return { caption, columns, rows: rows.map((row) => [row.header, ...row.cells]) };
}

describe("chartTableModel", () => {
  it("tabulates categorical charts by category", () => {
    expect(
      model({
        kind: "bar",
        values: [{ label: "North", value: 4 }],
        categoryLabel: "Region",
        valueLabel: "Sales",
        formatY: dollars,
      }),
    ).toEqual({
      caption: "Sales by Region",
      columns: ["Region", "Sales"],
      rows: [["North", "$4"]],
    });
  });

  it("uses the region label for maps", () => {
    expect(
      model({
        kind: "map",
        values: [{ id: "w", label: "West", value: 2 }],
        regionLabel: "State",
        valueLabel: "Votes",
        formatY: String,
      }),
    ).toEqual({ caption: "Votes by State", columns: ["State", "Votes"], rows: [["West", "2"]] });
  });

  it("formats x and y for cartesian and scatter charts", () => {
    const cartesian = { xLabel: "Day", yLabel: "Price", formatX: day, formatY: dollars };
    expect(model({ kind: "line", values: [{ x: 1, y: 5 }], ...cartesian })).toEqual({
      caption: "Price by Day",
      columns: ["Day", "Price"],
      rows: [["Day 1", "$5"]],
    });
    expect(
      model({ kind: "scatter", values: [{ label: "A", x: 1, y: 5 }], ...cartesian }).columns,
    ).toEqual(["Label", "Day", "Price"]);
  });

  it("adds a total column to stacked charts", () => {
    expect(
      model({
        kind: "stacked-bar",
        values: [
          {
            label: "Web",
            segments: [
              { label: "New", value: 1 },
              { label: "Returning", value: 2 },
            ],
          },
        ],
        categoryLabel: "Channel",
        valueLabel: "Orders",
        formatY: String,
      }),
    ).toEqual({
      caption: "Orders by Channel",
      columns: ["Channel", "New", "Returning", "Total"],
      rows: [["Web", "1", "2", "3"]],
    });
  });

  it("bins histogram observations with the plot's options", () => {
    const context: ChartContextValue = {
      kind: "histogram",
      values: [0, 1, 2, 3, 4],
      valueLabel: "Duration",
      frequencyLabel: "Sessions",
      formatY: String,
    };
    expect(model(context, { ...none, binCount: 2 }).rows).toEqual([
      ["0 to 2", "2"],
      ["2 to 4", "3"],
    ]);
  });

  it("lays heatmap values out as a matrix with blanks for missing cells", () => {
    expect(
      model({
        kind: "heatmap",
        values: [
          { x: "AM", y: "Mon", value: 1 },
          { x: "PM", y: "Tue", value: 2 },
        ],
        xLabel: "Time",
        yLabel: "Day",
        valueLabel: "Hits",
        formatY: String,
      }),
    ).toEqual({
      caption: "Hits by Day and Time",
      columns: ["Day", "AM", "PM"],
      rows: [
        ["Mon", "1", ""],
        ["Tue", "", "2"],
      ],
    });
  });

  it("names sankey link endpoints by their node labels", () => {
    expect(
      model({
        kind: "sankey",
        nodes: [
          { id: "a", label: "Visit" },
          { id: "b", label: "Buy" },
        ],
        links: [{ source: "a", target: "b", value: 7 }],
        nodeLabel: "Step",
        valueLabel: "People",
        formatY: String,
      }),
    ).toEqual({
      caption: "People by Step",
      columns: ["From", "To", "People"],
      rows: [["Visit", "Buy", "7"]],
    });
  });

  it("lists every field of the range and summary charts", () => {
    const base = { xLabel: "Day", yLabel: "Price", formatX: day, formatY: dollars };
    expect(
      model({
        kind: "candlestick",
        values: [{ x: 1, open: 1, high: 4, low: 0, close: 3 }],
        openLabel: "Open",
        highLabel: "High",
        lowLabel: "Low",
        closeLabel: "Close",
        ...base,
      }).rows,
    ).toEqual([["Day 1", "$1", "$4", "$0", "$3"]]);
    expect(
      model({
        kind: "open-to-close",
        values: [{ x: 1, open: 1, close: 3 }],
        openLabel: "Open",
        closeLabel: "Close",
        ...base,
      }).columns,
    ).toEqual(["Day", "Open", "Close"]);
    expect(
      model({
        kind: "dumbbell",
        values: [{ label: "A", start: 1, end: 2 }],
        categoryLabel: "Service",
        valueLabel: "Hours",
        startLabel: "From",
        endLabel: "To",
        formatY: dollars,
      }).rows,
    ).toEqual([["A", "$1", "$2"]]);
    expect(
      model({
        kind: "boxplot",
        values: [{ label: "A", min: 1, q1: 2, median: 3, q3: 4, max: 5 }],
        categoryLabel: "Group",
        valueLabel: "Time",
        formatY: String,
      }),
    ).toMatchObject({
      columns: ["Group", "Min", "Q1", "Median", "Q3", "Max"],
      rows: [["A", "1", "2", "3", "4", "5"]],
    });
  });
});
