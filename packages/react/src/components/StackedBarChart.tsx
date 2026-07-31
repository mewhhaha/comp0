import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure, stackedChartContext } from "./chart-root.js";
import { type StackedChartValue } from "./chart-shared.js";

export type StackedBarChartProps = HTMLAttributes<HTMLElement> & {
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
}: StackedBarChartProps & RefProp<HTMLElement>) {
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
