import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { categoricalChartContext, ChartFigure } from "./chart-root.js";
import { type CategoricalChartValue } from "./chart-shared.js";

export type BarChartProps = HTMLAttributes<HTMLElement> & {
  /** Values keyed by the category labels shown on the vertical axis. */
  values: readonly CategoricalChartValue[];
  /** Visible label for the category axis. */
  categoryLabel: string;
  /** Visible label for the numeric axis. */
  valueLabel: string;
  /** Formats numeric axis ticks and table cells. */
  formatValue?: ((value: number) => string) | undefined;
};

export function BarChart({
  values,
  categoryLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: BarChartProps & RefProp<HTMLElement>) {
  const context = categoricalChartContext(
    "BarChart",
    "bar",
    values,
    categoryLabel,
    valueLabel,
    formatValue,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
