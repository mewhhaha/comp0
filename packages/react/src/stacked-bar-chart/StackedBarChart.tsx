import { type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp } from "../internal/polymorphic.js";
import { stackedChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type StackedChartValue } from "../chart/chart-shared.js";

export type StackedBarChartProps = ComponentProps<"figure"> &
  AsProp & {
    values: readonly StackedChartValue[];
    categoryLabel: string;
    valueLabel: string;
    formatValue?: ((value: number) => string) | undefined;
  };

export function StackedBarChart({
  values,
  categoryLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: StackedBarChartProps) {
  const warn = useWarnOnce();
  const context = stackedChartContext(
    warn,
    "StackedBarChart",
    "stacked-bar",
    values,
    categoryLabel,
    valueLabel,
    formatValue,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
