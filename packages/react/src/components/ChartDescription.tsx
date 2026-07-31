import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { useChartContext } from "./chart-shared.js";

export type ChartDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function ChartDescription({
  ref,
  ...props
}: ChartDescriptionProps & RefProp<HTMLParagraphElement>) {
  useChartContext("ChartDescription");
  return <p {...props} ref={ref} data-slot={dataSlot(props, "chart-description")} />;
}
