import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure, stackedChartContext } from "./chart-root.js";
import { type StackedChartValue } from "./chart-shared.js";

export type StackedColumnChartProps = HTMLAttributes<HTMLElement> & {
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
}: StackedColumnChartProps & RefProp<HTMLElement>) {
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
