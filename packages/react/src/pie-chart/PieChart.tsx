import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { pieChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type CategoricalChartValue } from "../chart/chart-shared.js";

export type PieChartProps = ComponentProps<"figure"> &
  AsProp & {
    /** Non-negative values represented as parts of the whole. */
    values: readonly CategoricalChartValue[];
    /** Visible heading for legend and table categories. */
    categoryLabel: string;
    /** Visible heading for legend and table values. */
    valueLabel: string;
    /** Formats legend values and table cells. */
    formatValue?: ((value: number) => string) | undefined;
  };

export function PieChart({
  values,
  categoryLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: PieChartProps) {
  const context = pieChartContext(values, categoryLabel, valueLabel, formatValue);
  return <ChartFigure {...props} ref={ref} context={context} />;
}
