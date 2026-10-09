import { type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp } from "../internal/polymorphic.js";
import { histogramChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";

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
  const warn = useWarnOnce();
  const context = histogramChartContext(warn, values, valueLabel, frequencyLabel, formatValue);
  return <ChartFigure {...props} ref={ref} context={context} />;
}
