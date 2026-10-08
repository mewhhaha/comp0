import { createRequiredContext } from "../internal/context.js";

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

export type DumbbellChartValue = {
  label: string;
  start: number;
  end: number;
};

export type BoxPlotChartValue = {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
};

export type OpenToCloseChartValue = {
  x: number | Date;
  open: number;
  close: number;
};

export type MapChartValue = {
  id: string;
  label: string;
  value: number;
};

export type MapChartRegionGeometry = {
  id: string;
  d: string;
  centerX: number;
  centerY: number;
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
    }
  | {
      kind: "dumbbell";
      values: readonly DumbbellChartValue[];
      categoryLabel: string;
      valueLabel: string;
      startLabel: string;
      endLabel: string;
      formatY: (value: number) => string;
    }
  | {
      kind: "boxplot";
      values: readonly BoxPlotChartValue[];
      categoryLabel: string;
      valueLabel: string;
      formatY: (value: number) => string;
    }
  | {
      kind: "open-to-close";
      values: readonly OpenToCloseChartValue[];
      xLabel: string;
      yLabel: string;
      openLabel: string;
      closeLabel: string;
      formatX: (value: number | Date) => string;
      formatY: (value: number) => string;
    }
  | {
      kind: "lollipop";
      values: readonly CategoricalChartValue[];
      categoryLabel: string;
      valueLabel: string;
      formatY: (value: number) => string;
    }
  | {
      kind: "map";
      values: readonly MapChartValue[];
      regionLabel: string;
      valueLabel: string;
      formatY: (value: number) => string;
    };

export const [ChartContext, useRequiredChartContext, useOptionalChartContext] =
  createRequiredContext<ChartContextValue>("a chart root");

type ChartKind = ChartContextValue["kind"];

type ChartContextOfKind<TKind extends ChartKind> = ChartContextValue extends infer TContext
  ? TContext extends { kind: infer TContextKind }
    ? TKind extends TContextKind
      ? TContext
      : never
    : never
  : never;

/** Reads the chart context for any chart, from a part that works in every chart. */
export function useChartContext(part: string) {
  return useRequiredChartContext(part);
}

/** Reads the chart context of one chart kind; `root` names the chart for the error message. */
export function useChartKind<TKind extends ChartKind>(
  part: string,
  root: string,
  kind: TKind,
): ChartContextOfKind<TKind> {
  const context = useOptionalChartContext();
  if (context?.kind !== kind) throw new Error(`${part} must be rendered inside ${root}.`);
  return context as ChartContextOfKind<TKind>;
}

export function numberOf(value: number | Date) {
  return value instanceof Date ? value.getTime() : value;
}
