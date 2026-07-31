import { type HTMLAttributes } from "react";
import { type RefProp } from "../shared.js";
import { categoricalChartContext, ChartFigure } from "./chart-root.js";
import { type CategoricalChartValue } from "./chart-shared.js";

export type LollipopChartProps = HTMLAttributes<HTMLElement> & {
  values: readonly CategoricalChartValue[];
  categoryLabel: string;
  valueLabel: string;
  formatValue?: ((value: number) => string) | undefined;
};

export function LollipopChart({
  values,
  categoryLabel,
  valueLabel,
  formatValue,
  ref,
  ...props
}: LollipopChartProps & RefProp<HTMLElement>) {
  const context = categoricalChartContext(
    "LollipopChart",
    "lollipop",
    values,
    categoryLabel,
    valueLabel,
    formatValue,
  );
  return <ChartFigure {...props} ref={ref} context={context} />;
}
