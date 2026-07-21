import { type HTMLAttributes, type ReactNode } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { type CategoricalChartValue, useChartContext } from "./chart-shared.js";

export type ChartLegendItem = {
  value: CategoricalChartValue;
  index: number;
  formattedValue: string;
  percentage: number;
};

export type ChartLegendProps = Omit<HTMLAttributes<HTMLUListElement>, "children"> & {
  /** Renders each persistent legend entry. */
  children?: ((item: ChartLegendItem) => ReactNode) | undefined;
};

export function ChartLegend({
  children,
  ref,
  ...props
}: ChartLegendProps & RefProp<HTMLUListElement>) {
  const context = useChartContext("ChartLegend", "PieChart");
  if (context.kind !== "pie") throw new Error("ChartLegend must be rendered inside PieChart.");
  const total = context.values.reduce((sum, value) => sum + value.value, 0);

  return (
    <ul {...props} ref={ref} data-slot={dataSlot(props, "chart-legend")}>
      {context.values.map((value, index) => {
        const item = {
          value,
          index,
          formattedValue: context.formatY(value.value),
          percentage: (value.value / total) * 100,
        };
        return (
          <li
            key={`${value.label}-${index}`}
            data-label={value.label}
            data-slot="chart-legend-item"
            data-value={value.value}
          >
            {children ? (
              children(item)
            ) : (
              <>
                <span aria-hidden="true" data-slot="chart-legend-swatch" />
                <span>{value.label}</span>
                <span>{item.formattedValue}</span>
                <span>{item.percentage.toFixed(1)}%</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
