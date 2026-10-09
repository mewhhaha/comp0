import { type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp } from "../internal/polymorphic.js";
import { heatmapChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type HeatmapChartValue } from "../chart/chart-shared.js";

export type HeatmapChartProps = ComponentProps<"figure"> &
  AsProp & {
    values: readonly HeatmapChartValue[];
    xLabel: string;
    yLabel: string;
    valueLabel: string;
    formatValue?: ((value: number) => string) | undefined;
  };

export function HeatmapChart({
  values,
  xLabel,
  yLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: HeatmapChartProps) {
  const warn = useWarnOnce();
  const context = heatmapChartContext(warn, values, xLabel, yLabel, valueLabel, formatValue);
  return <ChartFigure {...props} ref={ref} context={context} />;
}
