import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure } from "./chart-root.js";
import { type ChartContextValue } from "./chart-shared.js";

export type HistogramProps = HTMLAttributes<HTMLElement> & {
  /** Finite observations grouped into bins by HistogramPlot. */
  values: readonly number[];
  /** Visible label for measured values on the horizontal axis. */
  valueLabel: string;
  /** Visible label for bin counts on the vertical axis. */
  frequencyLabel: string;
  /** Formats bin boundaries and horizontal-axis ticks. */
  formatValue?: ((value: number) => string) | undefined;
};

export function Histogram({
  values,
  valueLabel,
  frequencyLabel,
  formatValue,
  ref,
  ...props
}: HistogramProps & RefProp<HTMLElement>) {
  if (!valueLabel.trim()) throw new Error("Histogram value label must not be empty.");
  if (!frequencyLabel.trim()) throw new Error("Histogram frequency label must not be empty.");
  for (const [index, value] of values.entries()) {
    if (!Number.isFinite(value)) {
      throw new Error(`Histogram value at index ${index} must be finite; received ${value}.`);
    }
  }
  const context: ChartContextValue = {
    kind: "histogram",
    values,
    valueLabel,
    frequencyLabel,
    formatY: formatValue ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
