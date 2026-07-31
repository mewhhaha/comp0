import { type TableHTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";

export type ChartTableProps = TableHTMLAttributes<HTMLTableElement>;

export function ChartTable({ ref, ...props }: ChartTableProps & RefProp<HTMLTableElement>) {
  return <table {...props} ref={ref} data-slot={dataSlot(props, "chart-table")} />;
}
