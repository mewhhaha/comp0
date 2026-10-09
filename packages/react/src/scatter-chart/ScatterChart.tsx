import { type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { type AsProp } from "../internal/polymorphic.js";
import { scatterChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type ScatterChartValue } from "../chart/chart-shared.js";

export type ScatterChartProps = ComponentProps<"figure"> &
  AsProp & {
    /** Independently positioned, visibly labelled points. */
    values: readonly ScatterChartValue[];
    /** Visible label for the horizontal axis. */
    xLabel: string;
    /** Visible label for the vertical axis. */
    yLabel: string;
    /** Formats horizontal-axis ticks and point coordinates. */
    formatX?: ((value: number | Date) => string) | undefined;
    /** Formats vertical-axis ticks and point coordinates. */
    formatY?: ((value: number) => string) | undefined;
  };

export function ScatterChart({
  values,
  xLabel,
  yLabel,
  formatX,
  formatY,
  ref,
  ...props
}: ScatterChartProps) {
  const warn = useWarnOnce();
  const context = scatterChartContext(warn, values, xLabel, yLabel, formatX, formatY);
  return <ChartFigure {...props} ref={ref} context={context} />;
}
