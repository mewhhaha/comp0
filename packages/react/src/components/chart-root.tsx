import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartInteractionProvider } from "./chart-interaction.js";
import {
  ChartContext,
  type CartesianChartValue,
  type CategoricalChartValue,
  type ChartContextValue,
  numberOf,
  type StackedChartValue,
} from "./chart-shared.js";

type ChartFigureProps = HTMLAttributes<HTMLElement> &
  RefProp<HTMLElement> & {
    context: ChartContextValue;
  };

export function ChartFigure({ context, ref, ...props }: ChartFigureProps) {
  return (
    <ChartInteractionProvider>
      <ChartContext value={context}>
        <figure {...props} ref={ref} data-slot={dataSlot(props, "chart")} />
      </ChartContext>
    </ChartInteractionProvider>
  );
}

export function stackedChartContext(
  chartName: string,
  kind: "stacked-bar" | "stacked-column",
  values: readonly StackedChartValue[],
  categoryLabel: string,
  valueLabel: string,
  formatY: ((value: number) => string) | undefined,
): ChartContextValue {
  if (!categoryLabel.trim()) throw new Error(`${chartName} category label must not be empty.`);
  if (!valueLabel.trim()) throw new Error(`${chartName} value label must not be empty.`);
  const expectedSegments = values[0]?.segments.map((segment) => segment.label) ?? [];
  for (const [categoryIndex, value] of values.entries()) {
    if (!value.label.trim()) {
      throw new Error(`${chartName} value at index ${categoryIndex} has an empty label.`);
    }
    const segmentLabels = value.segments.map((segment) => segment.label);
    if (
      segmentLabels.length !== expectedSegments.length ||
      segmentLabels.some((label, index) => label !== expectedSegments[index])
    ) {
      throw new Error(
        `${chartName} category "${value.label}" must use the same ordered segments as the first category.`,
      );
    }
    for (const [segmentIndex, segment] of value.segments.entries()) {
      if (!segment.label.trim()) {
        throw new Error(
          `${chartName} segment at category ${categoryIndex}, index ${segmentIndex} has an empty label.`,
        );
      }
      if (!Number.isFinite(segment.value) || segment.value < 0) {
        throw new Error(
          `${chartName} segment "${segment.label}" in "${value.label}" must be a finite non-negative number; received ${segment.value}.`,
        );
      }
    }
  }
  return {
    kind,
    values,
    categoryLabel,
    valueLabel,
    formatY: formatY ?? String,
  };
}

export function categoricalChartContext(
  chartName: string,
  kind: "bar" | "column" | "pie",
  values: readonly CategoricalChartValue[],
  categoryLabel: string,
  valueLabel: string,
  formatY: ((value: number) => string) | undefined,
): ChartContextValue {
  if (!categoryLabel.trim()) throw new Error(`${chartName} category label must not be empty.`);
  if (!valueLabel.trim()) throw new Error(`${chartName} value label must not be empty.`);
  for (const [index, value] of values.entries()) {
    if (!value.label.trim())
      throw new Error(`${chartName} value at index ${index} has an empty label.`);
    if (!Number.isFinite(value.value)) {
      throw new Error(
        `${chartName} value "${value.label}" must be finite; received ${value.value}.`,
      );
    }
  }
  return { kind, values, categoryLabel, valueLabel, formatY: formatY ?? String };
}

export function cartesianChartContext(
  chartName: string,
  kind: "area" | "line",
  values: readonly CartesianChartValue[],
  xLabel: string,
  yLabel: string,
  formatX: ((value: number | Date) => string) | undefined,
  formatY: ((value: number) => string) | undefined,
): ChartContextValue {
  if (!xLabel.trim()) throw new Error(`${chartName} x-axis label must not be empty.`);
  if (!yLabel.trim()) throw new Error(`${chartName} y-axis label must not be empty.`);
  let previousX: number | undefined;
  for (const [index, value] of values.entries()) {
    const x = numberOf(value.x);
    if (!Number.isFinite(x)) {
      throw new Error(
        `${chartName} x value at index ${index} must be finite; received ${value.x}.`,
      );
    }
    if (!Number.isFinite(value.y)) {
      throw new Error(
        `${chartName} y value at index ${index} must be finite; received ${value.y}.`,
      );
    }
    if (previousX !== undefined && x <= previousX) {
      throw new Error(
        `${chartName} x values must increase; index ${index - 1} is ${previousX} and index ${index} is ${x}.`,
      );
    }
    previousX = x;
  }
  return {
    kind,
    values,
    xLabel,
    yLabel,
    formatX: formatX ?? String,
    formatY: formatY ?? String,
  };
}
