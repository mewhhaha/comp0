import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { cartesianChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type CartesianChartValue } from "../chart/chart-shared.js";

export type AreaChartProps = ComponentProps<"figure"> &
  AsProp & {
    /** Strictly increasing x values paired with finite y values. */
    values: readonly CartesianChartValue[];
    /** Visible label for the horizontal axis. */
    xLabel: string;
    /** Visible label for the vertical axis. */
    yLabel: string;
    /** Formats horizontal-axis ticks and table cells. */
    formatX?: ((value: number | Date) => string) | undefined;
    /** Formats vertical-axis ticks and table cells. */
    formatY?: ((value: number) => string) | undefined;
  };

export function AreaChart({
  values,
  xLabel,
  yLabel,
  formatX,
  formatY,
  ref,
  ...props
}: AreaChartProps) {
  const context = cartesianChartContext(
    "AreaChart",
    "area",
    values,
    xLabel,
    yLabel,
    formatX,
    formatY,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
