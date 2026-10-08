import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { openToCloseChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type OpenToCloseChartValue } from "../chart/chart-shared.js";

export type OpenToCloseChartProps = ComponentProps<"figure"> &
  AsProp & {
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
}: OpenToCloseChartProps) {
  const context = openToCloseChartContext(
    values,
    xLabel,
    yLabel,
    openLabel,
    closeLabel,
    formatX,
    formatY,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
