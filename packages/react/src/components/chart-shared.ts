import { createContext, useContext } from "react";

export type CategoricalChartValue = {
  label: string;
  value: number;
};

export type CartesianChartValue = {
  x: number | Date;
  y: number;
};

export type ScatterChartValue = CartesianChartValue & {
  label: string;
};

export type StackedChartSegment = {
  label: string;
  value: number;
};

export type StackedChartValue = {
  label: string;
  segments: readonly StackedChartSegment[];
};

export type HeatmapChartValue = {
  x: string;
  y: string;
  value: number;
};

export type HistogramBinValue = {
  min: number;
  max: number;
  count: number;
};

export type SankeyChartNodeValue = {
  id: string;
  label: string;
};

export type SankeyChartLinkValue = {
  source: string;
  target: string;
  value: number;
};

export type CandlestickChartValue = {
  x: number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartPoint = {
  value: CartesianChartValue;
  index: number;
  x: number;
  y: number;
};

export type ChartContextValue =
  | {
      kind: "bar" | "column" | "pie";
      values: readonly CategoricalChartValue[];
      categoryLabel: string;
      valueLabel: string;
      formatY: (value: number) => string;
    }
  | {
      kind: "area" | "line";
      values: readonly CartesianChartValue[];
      xLabel: string;
      yLabel: string;
      formatX: (value: number | Date) => string;
      formatY: (value: number) => string;
    }
  | {
      kind: "scatter";
      values: readonly ScatterChartValue[];
      xLabel: string;
      yLabel: string;
      formatX: (value: number | Date) => string;
      formatY: (value: number) => string;
    }
  | {
      kind: "stacked-bar" | "stacked-column";
      values: readonly StackedChartValue[];
      categoryLabel: string;
      valueLabel: string;
      formatY: (value: number) => string;
    }
  | {
      kind: "histogram";
      values: readonly number[];
      valueLabel: string;
      frequencyLabel: string;
      formatY: (value: number) => string;
    }
  | {
      kind: "heatmap";
      values: readonly HeatmapChartValue[];
      xLabel: string;
      yLabel: string;
      valueLabel: string;
      formatY: (value: number) => string;
    }
  | {
      kind: "sankey";
      nodes: readonly SankeyChartNodeValue[];
      links: readonly SankeyChartLinkValue[];
      nodeLabel: string;
      valueLabel: string;
      formatY: (value: number) => string;
    }
  | {
      kind: "candlestick";
      values: readonly CandlestickChartValue[];
      xLabel: string;
      yLabel: string;
      openLabel: string;
      highLabel: string;
      lowLabel: string;
      closeLabel: string;
      formatX: (value: number | Date) => string;
      formatY: (value: number) => string;
    };

export const ChartContext = createContext<ChartContextValue | null>(null);

export function useChartContext(part: string, root = "a chart root") {
  const context = useContext(ChartContext);
  if (!context) throw new Error(`${part} must be rendered inside ${root}.`);
  return context;
}

export function numberOf(value: number | Date) {
  return value instanceof Date ? value.getTime() : value;
}
