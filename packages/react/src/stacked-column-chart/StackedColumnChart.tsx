import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { stackedChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type StackedChartValue } from "../chart/chart-shared.js";

export type StackedColumnChartProps = ComponentProps<"figure"> &
  AsProp & {
    values: readonly StackedChartValue[];
    categoryLabel: string;
    valueLabel: string;
    formatValue?: ((value: number) => string) | undefined;
  };

export function StackedColumnChart({
  values,
  categoryLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: StackedColumnChartProps) {
  const context = stackedChartContext(
    "StackedColumnChart",
    "stacked-column",
    values,
    categoryLabel,
    valueLabel,
    formatValue,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
