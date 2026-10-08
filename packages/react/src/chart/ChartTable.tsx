import { type ComponentProps } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { dataSlot } from "../internal/shared.js";
import { useChartMeta } from "./chart-meta.js";
import { useChartContext } from "./chart-shared.js";
import { chartTableModel } from "./chart-table-model.js";

export type ChartTableProps = ComponentProps<"table"> & AsProp;

/**
 * The chart's data as a native table. Without children it renders a complete table
 * from the chart's own data and formatters: a caption (the ChartTitle text, else the
 * axis labels), a header row, and one row per value. Pass children to supply your own.
 */
export function ChartTable({ as, children, ...props }: ChartTableProps) {
  const context = useChartContext("ChartTable");
  const meta = useChartMeta("ChartTable");
  let content = children;
  if (children === undefined) {
    const model = chartTableModel(context, meta.histogramBins);
    content = (
      <>
        <caption data-slot="chart-table-caption">{meta.title ?? model.caption}</caption>
        <thead data-slot="chart-table-head">
          <tr>
            {model.columns.map((column, index) => (
              <th key={`${column}-${index}`} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody data-slot="chart-table-body">
          {model.rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.header}</th>
              {row.cells.map((cell, index) => (
                <td key={index}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </>
    );
  }
  const Part = partElement(as, "table");
  return (
    <Part {...props} data-slot={dataSlot(props, "chart-table")}>
      {content}
    </Part>
  );
}
