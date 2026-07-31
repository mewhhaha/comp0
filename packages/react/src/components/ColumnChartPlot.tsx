import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import { type CategoricalChartValue, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The inline SVG groups the named plot and individually named interactive columns. */

export type ColumnChartColumnState = {
  value: CategoricalChartValue;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ColumnChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  /** Concise text alternative identifying the graphic and comparison. */
  "aria-label": string;
  /** Lower vertical-axis bound; the derived scale includes zero by default. */
  yMin?: number | undefined;
  /** Upper vertical-axis bound; the derived scale includes zero by default. */
  yMax?: number | undefined;
  /** Number of visible vertical-axis ticks; defaults to 5. */
  yTickCount?: number | undefined;
  /** Renders each column; defaults to an unstyled rect using currentColor. */
  children?: ((column: ColumnChartColumnState) => ReactNode) | undefined;
};

export type ColumnChartColumnProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  column: ColumnChartColumnState;
  children: ReactNode;
};

export function ColumnChartColumn({
  column,
  ref,
  ...props
}: ColumnChartColumnProps & RefProp<SVGGElement>) {
  const context = useChartContext("ColumnChartColumn", "ColumnChart");
  if (context.kind !== "column") {
    throw new Error("ColumnChartColumn must be rendered inside ColumnChart.");
  }
  const formattedValue = context.formatY(column.value.value);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "column",
        index: column.index,
        label: `${context.categoryLabel}: ${column.value.label}, ${context.valueLabel}: ${formattedValue}`,
        value: column.value,
        formattedValue,
      }}
      fallbackSlot="column-chart-column"
      data-label={column.value.label}
      data-value={column.value.value}
    />
  );
}

export function ColumnChartPlot({
  children,
  yMax,
  yMin,
  yTickCount,
  ref,
  ...props
}: ColumnChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("ColumnChartPlot", "ColumnChart");
  if (context.kind !== "column") {
    throw new Error("ColumnChartPlot must be rendered inside ColumnChart.");
  }
  const scaleValues = context.values.map((value) => ({ label: value.label, value: value.value }));
  const scale = createChartScale("ColumnChartPlot", scaleValues, {
    domain: "include-zero",
    max: yMax,
    min: yMin,
  });
  const tickCount = chartTickCount("ColumnChartPlot", yTickCount);
  const { bottom, left, right, top } = chartPlotBounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const baseline = bottom - scale.position(0) * plotHeight;
  const slot = context.values.length === 0 ? plotWidth : plotWidth / context.values.length;
  const columnWidth = slot * 0.68;
  const offset = (slot - columnWidth) / 2;
  const columns = context.values.map((value, index): ColumnChartColumnState => {
    const valueY = bottom - scale.position(value.value) * plotHeight;
    return {
      value,
      index,
      x: left + index * slot + offset,
      y: Math.min(valueY, baseline),
      width: columnWidth,
      height: Math.abs(valueY - baseline),
    };
  });
  const xTicks = context.values.map((value, index) => ({
    label: value.label,
    position: context.values.length === 0 ? 0.5 : (index + 0.5) / context.values.length,
  }));
  const yTicks = scale.ticks(tickCount).map((value) => ({
    label: context.formatY(value),
    position: scale.position(value),
  }));

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 120 120"
      role="group"
      data-slot={dataSlot(props, "column-chart-plot")}
    >
      <ChartAxes
        xLabel={context.categoryLabel}
        xTicks={xTicks}
        yLabel={context.valueLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider count={columns.length} orientation="horizontal">
        <g role="presentation" data-slot="column-chart-columns">
          {columns.map((column) => (
            <Fragment key={`${column.value.label}-${column.index}`}>
              {children ? (
                children(column)
              ) : (
                <g
                  aria-hidden="true"
                  data-label={column.value.label}
                  data-slot="column-chart-column"
                  data-value={column.value.value}
                >
                  <rect
                    x={column.x}
                    y={column.y}
                    width={column.width}
                    height={column.height}
                    fill="currentColor"
                  />
                </g>
              )}
            </Fragment>
          ))}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
