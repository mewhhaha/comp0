import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { categoricalChartContext, ChartFigure } from "./chart-root.js";
import { type CategoricalChartValue } from "./chart-shared.js";

export type ColumnChartProps = HTMLAttributes<HTMLElement> & {
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
}: ColumnChartProps & RefProp<HTMLElement>) {
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
