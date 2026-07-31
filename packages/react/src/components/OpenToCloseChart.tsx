import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure } from "./chart-root.js";
import { type ChartContextValue, numberOf, type OpenToCloseChartValue } from "./chart-shared.js";

export type OpenToCloseChartProps = HTMLAttributes<HTMLElement> & {
  values: readonly OpenToCloseChartValue[];
  xLabel: string;
  yLabel: string;
  openLabel?: string | undefined;
  closeLabel?: string | undefined;
  formatX?: ((value: number | Date) => string) | undefined;
  formatY?: ((value: number) => string) | undefined;
};

export function OpenToCloseChart({
  values,
  xLabel,
  yLabel,
  openLabel = "Open",
  closeLabel = "Close",
  formatX,
  formatY,
  ref,
  ...props
}: OpenToCloseChartProps & RefProp<HTMLElement>) {
  if (!xLabel.trim()) throw new Error("OpenToCloseChart x-axis label must not be empty.");
  if (!yLabel.trim()) throw new Error("OpenToCloseChart y-axis label must not be empty.");
  if (!openLabel.trim()) throw new Error("OpenToCloseChart open label must not be empty.");
  if (!closeLabel.trim()) throw new Error("OpenToCloseChart close label must not be empty.");
  let previousX: number | undefined;
  for (const [index, value] of values.entries()) {
    const x = numberOf(value.x);
    if (!Number.isFinite(x) || !Number.isFinite(value.open) || !Number.isFinite(value.close)) {
      throw new Error(
        `OpenToCloseChart value at index ${index} must have finite coordinates; received x=${value.x}, open=${value.open}, close=${value.close}.`,
      );
    }
    if (previousX !== undefined && x <= previousX) {
      throw new Error(
        `OpenToCloseChart x values must increase; index ${index - 1} is ${previousX} and index ${index} is ${x}.`,
      );
    }
    previousX = x;
  }
  const context: ChartContextValue = {
    kind: "open-to-close",
    values,
    xLabel,
    yLabel,
    openLabel,
    closeLabel,
    formatX: formatX ?? String,
    formatY: formatY ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
