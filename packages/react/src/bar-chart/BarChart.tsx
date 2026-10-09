import { type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp } from "../internal/polymorphic.js";
import { categoricalChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type CategoricalChartValue } from "../chart/chart-shared.js";

export type BarChartProps = ComponentProps<"figure"> &
  AsProp & {
    /** Values keyed by the category labels shown on the vertical axis. */
    values: readonly CategoricalChartValue[];
    /** Visible label for the category axis. */
    categoryLabel: string;
    /** Visible label for the numeric axis. */
    valueLabel: string;
    /** Formats numeric axis ticks and table cells. */
    formatValue?: ((value: number) => string) | undefined;
  };

export function BarChart({
  values,
  categoryLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: BarChartProps) {
  const warn = useWarnOnce();
  const context = categoricalChartContext(
    warn,
    "BarChart",
    "bar",
    values,
    categoryLabel,
    valueLabel,
    formatValue,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
