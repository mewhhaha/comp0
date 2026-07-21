import { type HTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { useChartContext } from "./chart-shared.js";

export type ChartTitleProps = HTMLAttributes<HTMLElement>;

export function ChartTitle({ ref, ...props }: ChartTitleProps & RefProp<HTMLElement>) {
  useChartContext("ChartTitle");
  return <figcaption {...props} ref={ref} data-slot={dataSlot(props, "chart-title")} />;
}
