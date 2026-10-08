import { type ComponentProps } from "react";
import { type AsProp } from "../internal/polymorphic.js";
import { dumbbellChartContext } from "../chart/chart-context.js";
import { ChartFigure } from "../chart/chart-root.js";
import { type DumbbellChartValue } from "../chart/chart-shared.js";

export type DumbbellChartProps = ComponentProps<"figure"> &
  AsProp & {
    values: readonly DumbbellChartValue[];
    categoryLabel: string;
    valueLabel: string;
    startLabel?: string | undefined;
    endLabel?: string | undefined;
    formatValue?: ((value: number) => string) | undefined;
  };

export function DumbbellChart({
  values,
  categoryLabel,
  valueLabel,
  startLabel = "Start",
  endLabel = "End",
  formatValue,
  ref,
  ...props
}: DumbbellChartProps) {
  const context = dumbbellChartContext(
    values,
    categoryLabel,
    valueLabel,
    startLabel,
    endLabel,
    formatValue,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
