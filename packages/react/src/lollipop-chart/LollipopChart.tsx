import { type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp } from "../internal/polymorphic.js";
import { categoricalChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type CategoricalChartValue } from "../chart/chart-shared.js";

export type LollipopChartProps = ComponentProps<"figure"> &
  AsProp & {
    values: readonly CategoricalChartValue[];
    categoryLabel: string;
    valueLabel: string;
    formatValue?: ((value: number) => string) | undefined;
  };

export function LollipopChart({
  values,
  categoryLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: LollipopChartProps) {
  const warn = useWarnOnce();
  const context = categoricalChartContext(
    warn,
    "LollipopChart",
    "lollipop",
    values,
    categoryLabel,
    valueLabel,
    formatValue,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
