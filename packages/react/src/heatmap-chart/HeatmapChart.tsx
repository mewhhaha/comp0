import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type ChartContextValue, type HeatmapChartValue } from "../chart/chart-shared.js";

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
  if (!xLabel.trim()) throw new Error("HeatmapChart x-axis label must not be empty.");
  if (!yLabel.trim()) throw new Error("HeatmapChart y-axis label must not be empty.");
  if (!valueLabel.trim()) throw new Error("HeatmapChart value label must not be empty.");
  const coordinates = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (!value.x.trim() || !value.y.trim()) {
      throw new Error(`HeatmapChart value at index ${index} must have non-empty x and y labels.`);
    }
    if (!Number.isFinite(value.value)) {
      throw new Error(
        `HeatmapChart value at x="${value.x}", y="${value.y}" must be finite; received ${value.value}.`,
      );
    }
    const coordinate = JSON.stringify([value.x, value.y]);
    if (coordinates.has(coordinate)) {
      throw new Error(
        `HeatmapChart contains more than one value at x="${value.x}", y="${value.y}".`,
      );
    }
    coordinates.add(coordinate);
  }
  const context: ChartContextValue = {
    kind: "heatmap",
    values,
    xLabel,
    yLabel,
    valueLabel,
    formatY: formatValue ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
