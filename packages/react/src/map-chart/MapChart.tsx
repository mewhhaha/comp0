import { type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp } from "../internal/polymorphic.js";
import { mapChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type MapChartValue } from "../chart/chart-shared.js";

export type MapChartProps = ComponentProps<"figure"> &
  AsProp & {
    values: readonly MapChartValue[];
    regionLabel: string;
    valueLabel: string;
    formatValue?: ((value: number) => string) | undefined;
  };

export function MapChart({
  values,
  regionLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: MapChartProps) {
  const warn = useWarnOnce();
  const context = mapChartContext(warn, values, regionLabel, valueLabel, formatValue);
  return <ChartFigure {...props} ref={ref} context={context} />;
}
