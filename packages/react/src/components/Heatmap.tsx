import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure } from "./chart-root.js";
import { type ChartContextValue, type HeatmapChartValue } from "./chart-shared.js";

export type HeatmapProps = HTMLAttributes<HTMLElement> & {
  values: readonly HeatmapChartValue[];
  xLabel: string;
  yLabel: string;
  valueLabel: string;
  formatValue?: ((value: number) => string) | undefined;
};

export function Heatmap({
  values,
  xLabel,
  yLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: HeatmapProps & RefProp<HTMLElement>) {
  if (!xLabel.trim()) throw new Error("Heatmap x-axis label must not be empty.");
  if (!yLabel.trim()) throw new Error("Heatmap y-axis label must not be empty.");
  if (!valueLabel.trim()) throw new Error("Heatmap value label must not be empty.");
  const coordinates = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (!value.x.trim() || !value.y.trim()) {
      throw new Error(`Heatmap value at index ${index} must have non-empty x and y labels.`);
    }
    if (!Number.isFinite(value.value)) {
      throw new Error(
        `Heatmap value at x="${value.x}", y="${value.y}" must be finite; received ${value.value}.`,
      );
    }
    const coordinate = `${value.x}\u0000${value.y}`;
    if (coordinates.has(coordinate)) {
      throw new Error(`Heatmap contains more than one value at x="${value.x}", y="${value.y}".`);
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
