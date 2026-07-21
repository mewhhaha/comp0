import { type ReactNode, type TableHTMLAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { useChartContext } from "./chart-shared.js";

export type ChartTableProps = Omit<TableHTMLAttributes<HTMLTableElement>, "children"> & {
  /** Accessible name for the tabular representation. */
  caption: ReactNode;
};

export function ChartTable({
  caption,
  ref,
  ...props
}: ChartTableProps & RefProp<HTMLTableElement>) {
  const context = useChartContext("ChartTable");
  let rows: ReactNode;
  let headings: ReactNode;
  if (context.kind === "candlestick") {
    headings = (
      <>
        <th scope="col">{context.xLabel}</th>
        <th scope="col">{context.openLabel}</th>
        <th scope="col">{context.highLabel}</th>
        <th scope="col">{context.lowLabel}</th>
        <th scope="col">{context.closeLabel}</th>
      </>
    );
    rows = context.values.map((value, index) => (
      <tr key={`${context.formatX(value.x)}-${index}`}>
        <th scope="row">{context.formatX(value.x)}</th>
        <td>{context.formatY(value.open)}</td>
        <td>{context.formatY(value.high)}</td>
        <td>{context.formatY(value.low)}</td>
        <td>{context.formatY(value.close)}</td>
      </tr>
    ));
  } else if ("formatX" in context) {
    headings = (
      <>
        <th scope="col">{context.xLabel}</th>
        <th scope="col">{context.yLabel}</th>
      </>
    );
    rows = context.values.map((value, index) => (
      <tr key={`${context.formatX(value.x)}-${index}`}>
        <th scope="row">{context.formatX(value.x)}</th>
        <td>{context.formatY(value.y)}</td>
      </tr>
    ));
  } else {
    headings = (
      <>
        <th scope="col">{context.categoryLabel}</th>
        <th scope="col">{context.valueLabel}</th>
      </>
    );
    rows = context.values.map((value, index) => (
      <tr key={`${value.label}-${index}`}>
        <th scope="row">{value.label}</th>
        <td>{context.formatY(value.value)}</td>
      </tr>
    ));
  }

  return (
    <table {...props} ref={ref} data-slot={dataSlot(props, "chart-table")}>
      <caption>{caption}</caption>
      <thead>
        <tr>{headings}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}
