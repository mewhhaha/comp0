import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { cartesianChartContext, ChartFigure } from "./chart-root.js";
import { type CartesianChartValue } from "./chart-shared.js";

export type LineChartProps = HTMLAttributes<HTMLElement> & {
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

export function LineChart({
  values,
  xLabel,
  yLabel,
  formatX,
  formatY,
  ref,
  ...props
}: LineChartProps & RefProp<HTMLElement>) {
  const context = cartesianChartContext(
    "LineChart",
    "line",
    values,
    xLabel,
    yLabel,
    formatX,
    formatY,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
