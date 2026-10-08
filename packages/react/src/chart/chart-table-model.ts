import { binHistogram } from "./chart-histogram.js";
import { type HistogramBinOptions } from "./chart-meta.js";
import { type ChartContextValue } from "./chart-shared.js";

export type ChartTableRow = {
  key: string;
  header: string;
  cells: readonly string[];
};

export type ChartTableModel = {
  /** Fallback caption built from the chart's axis labels. */
  caption: string;
  /** Column headings, starting with the heading of the row-header column. */
  columns: readonly string[];
  rows: readonly ChartTableRow[];
};

/** Describes the accessible data table every chart kind renders by default. */
export function chartTableModel(
  context: ChartContextValue,
  histogramOptions: HistogramBinOptions | null,
): ChartTableModel {
  switch (context.kind) {
    case "bar":
    case "column":
    case "pie":
    case "lollipop":
    case "map": {
      const categoryLabel = context.kind === "map" ? context.regionLabel : context.categoryLabel;
      return {
        caption: `${context.valueLabel} by ${categoryLabel}`,
        columns: [categoryLabel, context.valueLabel],
        rows: context.values.map((value, index) => ({
          key: `${value.label}-${index}`,
          header: value.label,
          cells: [context.formatY(value.value)],
        })),
      };
    }
    case "area":
    case "line":
      return {
        caption: `${context.yLabel} by ${context.xLabel}`,
        columns: [context.xLabel, context.yLabel],
        rows: context.values.map((value, index) => ({
          key: `${String(value.x)}-${index}`,
          header: context.formatX(value.x),
          cells: [context.formatY(value.y)],
        })),
      };
    case "scatter":
      return {
        caption: `${context.yLabel} by ${context.xLabel}`,
        columns: ["Label", context.xLabel, context.yLabel],
        rows: context.values.map((value, index) => ({
          key: `${value.label}-${index}`,
          header: value.label,
          cells: [context.formatX(value.x), context.formatY(value.y)],
        })),
      };
    case "stacked-bar":
    case "stacked-column": {
      const segments = context.values[0]?.segments.map((segment) => segment.label) ?? [];
      return {
        caption: `${context.valueLabel} by ${context.categoryLabel}`,
        columns: [context.categoryLabel, ...segments, "Total"],
        rows: context.values.map((value, index) => ({
          key: `${value.label}-${index}`,
          header: value.label,
          cells: [
            ...value.segments.map((segment) => context.formatY(segment.value)),
            context.formatY(value.segments.reduce((sum, segment) => sum + segment.value, 0)),
          ],
        })),
      };
    }
    case "histogram": {
      const { bins } = binHistogram(
        "ChartTable",
        context.values,
        histogramOptions ?? {
          binCount: undefined,
          xMin: undefined,
          xMax: undefined,
        },
      );
      return {
        caption: `${context.frequencyLabel} by ${context.valueLabel}`,
        columns: [context.valueLabel, context.frequencyLabel],
        rows: bins.map((bin, index) => ({
          key: String(index),
          header: `${context.formatY(bin.min)} to ${context.formatY(bin.max)}`,
          cells: [String(bin.count)],
        })),
      };
    }
    case "heatmap": {
      const columns = [...new Set(context.values.map((value) => value.x))];
      const rows = [...new Set(context.values.map((value) => value.y))];
      const cells = new Map(
        context.values.map((value) => [JSON.stringify([value.x, value.y]), value]),
      );
      return {
        caption: `${context.valueLabel} by ${context.yLabel} and ${context.xLabel}`,
        columns: [context.yLabel, ...columns],
        rows: rows.map((row) => ({
          key: row,
          header: row,
          cells: columns.map((column) => {
            const value = cells.get(JSON.stringify([column, row]));
            return value ? context.formatY(value.value) : "";
          }),
        })),
      };
    }
    case "sankey": {
      const labels = new Map(context.nodes.map((node) => [node.id, node.label]));
      return {
        caption: `${context.valueLabel} by ${context.nodeLabel}`,
        columns: ["From", "To", context.valueLabel],
        rows: context.links.map((link, index) => ({
          key: `${link.source}-${link.target}-${index}`,
          header: labels.get(link.source) ?? link.source,
          cells: [labels.get(link.target) ?? link.target, context.formatY(link.value)],
        })),
      };
    }
    case "candlestick":
      return {
        caption: `${context.yLabel} by ${context.xLabel}`,
        columns: [
          context.xLabel,
          context.openLabel,
          context.highLabel,
          context.lowLabel,
          context.closeLabel,
        ],
        rows: context.values.map((value, index) => ({
          key: `${String(value.x)}-${index}`,
          header: context.formatX(value.x),
          cells: [value.open, value.high, value.low, value.close].map(context.formatY),
        })),
      };
    case "dumbbell":
      return {
        caption: `${context.valueLabel} by ${context.categoryLabel}`,
        columns: [context.categoryLabel, context.startLabel, context.endLabel],
        rows: context.values.map((value, index) => ({
          key: `${value.label}-${index}`,
          header: value.label,
          cells: [context.formatY(value.start), context.formatY(value.end)],
        })),
      };
    case "boxplot":
      return {
        caption: `${context.valueLabel} by ${context.categoryLabel}`,
        columns: [context.categoryLabel, "Min", "Q1", "Median", "Q3", "Max"],
        rows: context.values.map((value, index) => ({
          key: `${value.label}-${index}`,
          header: value.label,
          cells: [value.min, value.q1, value.median, value.q3, value.max].map(context.formatY),
        })),
      };
    case "open-to-close":
      return {
        caption: `${context.yLabel} by ${context.xLabel}`,
        columns: [context.xLabel, context.openLabel, context.closeLabel],
        rows: context.values.map((value, index) => ({
          key: `${String(value.x)}-${index}`,
          header: context.formatX(value.x),
          cells: [context.formatY(value.open), context.formatY(value.close)],
        })),
      };
  }
}
