import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type ChartContextValue } from "../chart/chart-shared.js";

export type HistogramChartProps = ComponentProps<"figure"> &
  AsProp & {
    /** Finite observations grouped into bins by HistogramChartPlot. */
    values: readonly number[];
    /** Visible label for measured values on the horizontal axis. */
    valueLabel: string;
    /** Visible label for bin counts on the vertical axis. */
    frequencyLabel: string;
    /** Formats bin boundaries and horizontal-axis ticks. */
    formatValue?: ((value: number) => string) | undefined;
  };

export function HistogramChart({
  values,
  valueLabel,
  frequencyLabel,
  formatValue,
  ref,
  ...props
}: HistogramChartProps) {
  if (!valueLabel.trim()) throw new Error("HistogramChart value label must not be empty.");
  if (!frequencyLabel.trim()) throw new Error("HistogramChart frequency label must not be empty.");
  for (const [index, value] of values.entries()) {
    if (!Number.isFinite(value)) {
      throw new Error(`HistogramChart value at index ${index} must be finite; received ${value}.`);
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
