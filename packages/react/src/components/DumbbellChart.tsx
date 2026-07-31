import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure } from "./chart-root.js";
import { type ChartContextValue, type DumbbellChartValue } from "./chart-shared.js";

export type DumbbellChartProps = HTMLAttributes<HTMLElement> & {
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
}: DumbbellChartProps & RefProp<HTMLElement>) {
  if (!categoryLabel.trim()) throw new Error("DumbbellChart category label must not be empty.");
  if (!valueLabel.trim()) throw new Error("DumbbellChart value label must not be empty.");
  if (!startLabel.trim()) throw new Error("DumbbellChart start label must not be empty.");
  if (!endLabel.trim()) throw new Error("DumbbellChart end label must not be empty.");
  for (const [index, value] of values.entries()) {
    if (!value.label.trim()) {
      throw new Error(`DumbbellChart value at index ${index} has an empty label.`);
    }
    if (!Number.isFinite(value.start) || !Number.isFinite(value.end)) {
      throw new Error(
        `DumbbellChart value "${value.label}" must have finite endpoints; received start=${value.start}, end=${value.end}.`,
      );
    }
  }
  const context: ChartContextValue = {
    kind: "dumbbell",
    values,
    categoryLabel,
    valueLabel,
    startLabel,
    endLabel,
    formatY: formatValue ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
