import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useChartContext } from "./chart-shared.js";

export type ChartDescriptionProps = ComponentProps<"p"> & AsProp;

export function ChartDescription({ as, ...props }: ChartDescriptionProps) {
  useChartContext("ChartDescription");
  const Part = partElement(as, "p");
  return <Part {...props} data-slot={dataSlot(props, "chart-description")} />;
}
