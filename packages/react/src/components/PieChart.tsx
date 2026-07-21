import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { categoricalChartContext, ChartFigure } from "./chart-root.js";
import { type CategoricalChartValue } from "./chart-shared.js";

export type PieChartProps = HTMLAttributes<HTMLElement> & {
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
}: PieChartProps & RefProp<HTMLElement>) {
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
  if (total <= 0) throw new Error(`PieChart values must have a positive total; received ${total}.`);
  return <ChartFigure {...props} ref={ref} context={context} />;
}
