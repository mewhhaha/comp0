import { type ComponentProps, type ReactNode } from "react";
import { type AsProp, partElement } from "../internal/polymorphic.js";
import { type CategoricalChartValue, useChartKind } from "../chart/chart-shared.js";

export type PieChartLegendItem = {
  value: CategoricalChartValue;
  index: number;
  formattedValue: string;
  percentage: number;
};

export type PieChartLegendProps = Omit<ComponentProps<"ul">, "children"> &
  AsProp & {
    /** Renders each persistent legend entry. */
    children?: ((item: PieChartLegendItem) => ReactNode) | undefined;
  };

export function PieChartLegend({ as, children, ...props }: PieChartLegendProps) {
  const context = useChartKind("PieChartLegend", "PieChart", "pie");
  const total = context.values.reduce((sum, value) => sum + value.value, 0);

  const Part = partElement(as, "ul");
  return (
    <Part data-slot="pie-chart-legend" {...props}>
      {context.values.map((value, index) => {
        const item = {
          value,
          index,
          formattedValue: context.formatY(value.value),
          percentage: (value.value / total) * 100,
        };
        let content: ReactNode = (
          <>
            <span aria-hidden="true" data-slot="pie-chart-legend-swatch" />
            <span>{value.label}</span>
            <span>{item.formattedValue}</span>
            <span>{item.percentage.toFixed(1)}%</span>
          </>
        );
        if (children) content = children(item);
        return (
          <li
            key={`${value.label}-${index}`}
            data-label={value.label}
            data-slot="pie-chart-legend-item"
            data-value={value.value}
          >
            {content}
          </li>
        );
      })}
    </Part>
  );
}
