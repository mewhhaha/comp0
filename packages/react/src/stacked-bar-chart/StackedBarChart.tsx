import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { ChartFigure, stackedChartContext } from "../chart/chart-root.js";
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
  const context = stackedChartContext(
    "StackedBarChart",
    "stacked-bar",
    values,
    categoryLabel,
    valueLabel,
    formatValue,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
