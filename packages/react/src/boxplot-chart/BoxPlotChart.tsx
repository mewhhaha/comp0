import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type BoxPlotChartValue, type ChartContextValue } from "../chart/chart-shared.js";

export type BoxPlotChartProps = ComponentProps<"figure"> &
  AsProp & {
    values: readonly BoxPlotChartValue[];
    categoryLabel: string;
    valueLabel: string;
    formatValue?: ((value: number) => string) | undefined;
  };

export function BoxPlotChart({
  values,
  categoryLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: BoxPlotChartProps) {
  if (!categoryLabel.trim()) throw new Error("BoxPlotChart category label must not be empty.");
  if (!valueLabel.trim()) throw new Error("BoxPlotChart value label must not be empty.");
  for (const [index, value] of values.entries()) {
    if (!value.label.trim()) {
      throw new Error(`BoxPlotChart value at index ${index} has an empty label.`);
    }
    const summary = [value.min, value.q1, value.median, value.q3, value.max];
    if (summary.some((part) => !Number.isFinite(part))) {
      throw new Error(
        `BoxPlotChart value "${value.label}" must have finite summary values; received min=${value.min}, q1=${value.q1}, median=${value.median}, q3=${value.q3}, max=${value.max}.`,
      );
    }
    if (
      !(
        value.min <= value.q1 &&
        value.q1 <= value.median &&
        value.median <= value.q3 &&
        value.q3 <= value.max
      )
    ) {
      throw new Error(
        `BoxPlotChart value "${value.label}" must satisfy min ≤ q1 ≤ median ≤ q3 ≤ max; received min=${value.min}, q1=${value.q1}, median=${value.median}, q3=${value.q3}, max=${value.max}.`,
      );
    }
  }
  const context: ChartContextValue = {
    kind: "boxplot",
    values,
    categoryLabel,
    valueLabel,
    formatY: formatValue ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
