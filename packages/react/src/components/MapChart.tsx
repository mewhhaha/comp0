import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { ChartFigure } from "./chart-root.js";
import { type ChartContextValue, type MapChartValue } from "./chart-shared.js";

export type MapChartProps = HTMLAttributes<HTMLElement> & {
  values: readonly MapChartValue[];
  regionLabel: string;
  valueLabel: string;
  formatValue?: ((value: number) => string) | undefined;
};

export function MapChart({
  values,
  regionLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: MapChartProps & RefProp<HTMLElement>) {
  if (!regionLabel.trim()) throw new Error("MapChart region label must not be empty.");
  if (!valueLabel.trim()) throw new Error("MapChart value label must not be empty.");
  const ids = new Set<string>();
  for (const [index, value] of values.entries()) {
    if (!value.id.trim() || !value.label.trim()) {
      throw new Error(`MapChart value at index ${index} must have a non-empty id and label.`);
    }
    if (ids.has(value.id)) throw new Error(`MapChart region id "${value.id}" is duplicated.`);
    if (!Number.isFinite(value.value)) {
      throw new Error(
        `MapChart region "${value.id}" must have a finite value; received ${value.value}.`,
      );
    }
    ids.add(value.id);
  }
  const context: ChartContextValue = {
    kind: "map",
    values,
    regionLabel,
    valueLabel,
    formatY: formatValue ?? String,
  };
  return <ChartFigure {...props} ref={ref} context={context} />;
}
