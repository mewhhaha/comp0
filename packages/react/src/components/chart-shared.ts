import { createContext, useContext } from "react";

export type CategoricalChartValue = {
  label: string;
  value: number;
};

export type CartesianChartValue = {
  x: number | Date;
  y: number;
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
