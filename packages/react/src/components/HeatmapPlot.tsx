import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { type HeatmapChartValue, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named matrix and individually named interactive cells. */

export type HeatmapCellState = {
  value: HeatmapChartValue;
  index: number;
  columnIndex: number;
  rowIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HeatmapPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  children?: ((cell: HeatmapCellState) => ReactNode) | undefined;
};

export type HeatmapCellProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  cell: HeatmapCellState;
  children: ReactNode;
};

export function HeatmapCell({ cell, ref, ...props }: HeatmapCellProps & RefProp<SVGGElement>) {
  const context = useChartContext("HeatmapCell", "Heatmap");
  if (context.kind !== "heatmap") throw new Error("HeatmapCell must be rendered inside Heatmap.");
  const formattedValue = context.formatY(cell.value.value);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "heatmap",
        index: cell.index,
        label: `${context.xLabel}: ${cell.value.x}, ${context.yLabel}: ${cell.value.y}, ${context.valueLabel}: ${formattedValue}`,
        value: cell.value,
        formattedValue,
      }}
      fallbackSlot="heatmap-cell"
      data-value={cell.value.value}
      data-x={cell.value.x}
      data-y={cell.value.y}
    />
  );
}

export function HeatmapPlot({
  children,
  ref,
  ...props
}: HeatmapPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("HeatmapPlot", "Heatmap");
  if (context.kind !== "heatmap") throw new Error("HeatmapPlot must be rendered inside Heatmap.");
  const columns = [...new Set(context.values.map((value) => value.x))];
  const rows = [...new Set(context.values.map((value) => value.y))];
  const { bottom, left, right, top } = chartPlotBounds;
  const cellWidth = columns.length === 0 ? right - left : (right - left) / columns.length;
  const cellHeight = rows.length === 0 ? bottom - top : (bottom - top) / rows.length;
  const orderedValues = [...context.values].sort((first, second) => {
    const rowDifference = rows.indexOf(first.y) - rows.indexOf(second.y);
    if (rowDifference !== 0) return rowDifference;
    return columns.indexOf(first.x) - columns.indexOf(second.x);
  });
  const cells = orderedValues.map((value, index): HeatmapCellState => {
    const columnIndex = columns.indexOf(value.x);
    const rowIndex = rows.indexOf(value.y);
    return {
      value,
      index,
      columnIndex,
      rowIndex,
      x: left + columnIndex * cellWidth,
      y: top + rowIndex * cellHeight,
      width: cellWidth,
      height: cellHeight,
    };
  });
  const getTargetIndex = (currentIndex: number, key: string) => {
    const current = cells[currentIndex];
    if (!current || !key.startsWith("Arrow")) return undefined;
    let columnIndex = current.columnIndex;
    let rowIndex = current.rowIndex;
    if (key === "ArrowLeft") columnIndex -= 1;
    if (key === "ArrowRight") columnIndex += 1;
    if (key === "ArrowUp") rowIndex -= 1;
    if (key === "ArrowDown") rowIndex += 1;
    const target = cells.find(
      (cell) => cell.columnIndex === columnIndex && cell.rowIndex === rowIndex,
    );
    return target?.index ?? currentIndex;
  };
  const xTicks = columns.map((label, index) => ({
    label,
    position: (index + 0.5) / columns.length,
  }));
  const yTicks = rows.map((label, index) => ({
    label,
    position: 1 - (index + 0.5) / rows.length,
  }));

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 120 120"
      role="group"
      data-slot={dataSlot(props, "heatmap-plot")}
    >
      <ChartAxes
        xLabel={context.xLabel}
        xTicks={xTicks}
        yGrid={false}
        yLabel={context.yLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider
        count={cells.length}
        getTargetIndex={getTargetIndex}
        orientation="both"
      >
        <g role="presentation" data-slot="heatmap-cells">
          {cells.map((cell) => (
            <Fragment key={`${cell.value.x}-${cell.value.y}`}>
              {children ? (
                children(cell)
              ) : (
                <g aria-hidden="true" data-slot="heatmap-cell">
                  <rect
                    x={cell.x}
                    y={cell.y}
                    width={cell.width}
                    height={cell.height}
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
