import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure } from "./chart-root.js";
import { type ChartContextValue, numberOf, type ScatterChartValue } from "./chart-shared.js";

export type ScatterChartProps = HTMLAttributes<HTMLElement> & {
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
}: ScatterChartProps & RefProp<HTMLElement>) {
  if (!xLabel.trim()) throw new Error("ScatterChart x-axis label must not be empty.");
  if (!yLabel.trim()) throw new Error("ScatterChart y-axis label must not be empty.");
  for (const [index, value] of values.entries()) {
    if (!value.label.trim()) {
      throw new Error(`ScatterChart value at index ${index} has an empty label.`);
    }
    if (!Number.isFinite(numberOf(value.x)) || !Number.isFinite(value.y)) {
      throw new Error(
        `ScatterChart value "${value.label}" must have finite coordinates; received x=${value.x}, y=${value.y}.`,
      );
    }
  }
  const context: ChartContextValue = {
    kind: "scatter",
    values,
    xLabel,
    yLabel,
    formatX: formatX ?? String,
    formatY: formatY ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
