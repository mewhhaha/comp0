import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { categoricalChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type CategoricalChartValue } from "../chart/chart-shared.js";

export type ColumnChartProps = ComponentProps<"figure"> &
  AsProp & {
    /** Values keyed by the category labels shown on the horizontal axis. */
    values: readonly CategoricalChartValue[];
    /** Visible label for the category axis. */
    categoryLabel: string;
    /** Visible label for the numeric axis. */
    valueLabel: string;
    /** Formats numeric axis ticks and table cells. */
    formatValue?: ((value: number) => string) | undefined;
  };

export function ColumnChart({
  values,
  categoryLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: ColumnChartProps) {
  const context = categoricalChartContext(
    "ColumnChart",
    "column",
    values,
    categoryLabel,
    valueLabel,
    formatValue,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
