import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { categoricalChartContext, ChartFigure } from "../chart/chart-root.js";
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
  const context = categoricalChartContext(
    "PieChart",
    "pie",
    values,
    categoryLabel,
    valueLabel,
    formatValue,
  );
  for (const value of values) {
    if (value.value < 0) {
      throw new Error(
        `PieChart value "${value.label}" must not be negative; received ${value.value}.`,
      );
    }
  }
  const total = values.reduce((sum, value) => sum + value.value, 0);
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error(`PieChart values must have a finite positive total; received ${total}.`);
  }
  return <ChartFigure {...props} ref={ref} context={context} />;
}
