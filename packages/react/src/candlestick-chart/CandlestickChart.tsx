import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { candlestickChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type CandlestickChartValue } from "../chart/chart-shared.js";

export type CandlestickChartProps = ComponentProps<"figure"> &
  AsProp & {
    /** Strictly increasing x values paired with valid open, high, low, and close values. */
    values: readonly CandlestickChartValue[];
    /** Visible label for the horizontal axis. */
    xLabel: string;
    /** Visible label for the vertical value axis. */
    yLabel: string;
    /** Table heading for opening values; defaults to Open. */
    openLabel?: string | undefined;
    /** Table heading for highest values; defaults to High. */
    highLabel?: string | undefined;
    /** Table heading for lowest values; defaults to Low. */
    lowLabel?: string | undefined;
    /** Table heading for closing values; defaults to Close. */
    closeLabel?: string | undefined;
    /** Formats horizontal-axis ticks and table row headings. */
    formatX?: ((value: number | Date) => string) | undefined;
    /** Formats vertical-axis ticks and table cells. */
    formatY?: ((value: number) => string) | undefined;
  };

export function CandlestickChart({
  values,
  xLabel,
  yLabel,
  openLabel = "Open",
  highLabel = "High",
  lowLabel = "Low",
  closeLabel = "Close",
  formatX,
  formatY,
  ref,
  ...props
}: CandlestickChartProps) {
  const context = candlestickChartContext(
    values,
    xLabel,
    yLabel,
    { openLabel, highLabel, lowLabel, closeLabel },
    formatX,
    formatY,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
