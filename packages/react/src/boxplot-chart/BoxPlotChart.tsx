import { type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp } from "../internal/polymorphic.js";
import { boxPlotChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type BoxPlotChartValue } from "../chart/chart-shared.js";

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
  const warn = useWarnOnce();
  const context = boxPlotChartContext(warn, values, categoryLabel, valueLabel, formatValue);
  return <ChartFigure {...props} ref={ref} context={context} />;
}
