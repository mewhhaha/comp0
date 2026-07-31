import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure } from "./chart-root.js";
import { type ChartContextValue } from "./chart-shared.js";

export type CumulativeHistogramProps = HTMLAttributes<HTMLElement> & {
  values: readonly number[];
  valueLabel: string;
  frequencyLabel: string;
  formatValue?: ((value: number) => string) | undefined;
};

export function CumulativeHistogram({
  values,
  valueLabel,
  frequencyLabel,
  formatValue,
  ref,
  ...props
}: CumulativeHistogramProps & RefProp<HTMLElement>) {
  if (!valueLabel.trim()) throw new Error("CumulativeHistogram value label must not be empty.");
  if (!frequencyLabel.trim()) {
    throw new Error("CumulativeHistogram frequency label must not be empty.");
  }
  for (const [index, value] of values.entries()) {
    if (!Number.isFinite(value)) {
      throw new Error(
        `CumulativeHistogram value at index ${index} must be finite; received ${value}.`,
      );
    }
  }
  const context: ChartContextValue = {
    kind: "cumulative-histogram",
    values,
    valueLabel,
    frequencyLabel,
    formatY: formatValue ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
