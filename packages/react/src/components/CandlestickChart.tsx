import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure } from "./chart-root.js";
import { type CandlestickChartValue, type ChartContextValue, numberOf } from "./chart-shared.js";

export type CandlestickChartProps = HTMLAttributes<HTMLElement> & {
  /** Strictly increasing x values paired with valid open, high, low, and close values. */
  values: readonly CandlestickChartValue[];
  /** Visible label for the horizontal axis. */
  xLabel: string;
  /** Visible label for the vertical value axis. */
  yLabel: string;
  /** Table heading for opening values; defaults to Open. */
  openLabel?: string | undefined;
  /** Table heading for highest values; defaults to High. */
  highLabel?: string | undefined;
  /** Table heading for lowest values; defaults to Low. */
  lowLabel?: string | undefined;
  /** Table heading for closing values; defaults to Close. */
  closeLabel?: string | undefined;
  /** Formats horizontal-axis ticks and table row headings. */
  formatX?: ((value: number | Date) => string) | undefined;
  /** Formats vertical-axis ticks and table cells. */
  formatY?: ((value: number) => string) | undefined;
};

export function CandlestickChart({
  values,
  xLabel,
  yLabel,
  openLabel = "Open",
  highLabel = "High",
  lowLabel = "Low",
  closeLabel = "Close",
  formatX,
  formatY,
  ref,
  ...props
}: CandlestickChartProps & RefProp<HTMLElement>) {
  if (!xLabel.trim()) throw new Error("CandlestickChart x-axis label must not be empty.");
  if (!yLabel.trim()) throw new Error("CandlestickChart y-axis label must not be empty.");
  const tableLabels = { openLabel, highLabel, lowLabel, closeLabel };
  for (const [label, value] of Object.entries(tableLabels)) {
    if (!value.trim()) throw new Error(`CandlestickChart ${label} must not be empty.`);
  }
  let previousX: number | undefined;
  for (const [index, value] of values.entries()) {
    const x = numberOf(value.x);
    if (!Number.isFinite(x)) {
      throw new Error(
        `CandlestickChart x value at index ${index} must be finite; received ${value.x}.`,
      );
    }
    for (const field of ["open", "high", "low", "close"] as const) {
      if (!Number.isFinite(value[field])) {
        throw new Error(
          `CandlestickChart ${field} value at index ${index} must be finite; received ${value[field]}.`,
        );
      }
    }
    if (previousX !== undefined && x <= previousX) {
      throw new Error(
        `CandlestickChart x values must increase; index ${index - 1} is ${previousX} and index ${index} is ${x}.`,
      );
    }
    if (value.low > Math.min(value.open, value.close)) {
      throw new Error(
        `CandlestickChart low at index ${index} must not exceed open or close; received low=${value.low}, open=${value.open}, close=${value.close}.`,
      );
    }
    if (value.high < Math.max(value.open, value.close)) {
      throw new Error(
        `CandlestickChart high at index ${index} must not be below open or close; received high=${value.high}, open=${value.open}, close=${value.close}.`,
      );
    }
    previousX = x;
  }
  const context: ChartContextValue = {
    kind: "candlestick",
    values,
    xLabel,
    yLabel,
    ...tableLabels,
    formatX: formatX ?? String,
    formatY: formatY ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
