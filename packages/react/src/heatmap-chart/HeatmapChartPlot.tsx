import { Fragment, type ReactNode, type ComponentProps } from "react";
import { ChartAxes, chartPlotBounds } from "../chart/ChartAxes.js";
import { ChartNavigationProvider } from "../chart/chart-navigation.js";
import { ChartValue } from "../chart/ChartValue.js";
import { type HeatmapChartValue, useChartKind } from "../chart/chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named matrix and individually named interactive cells. */

export type HeatmapChartCellState = {
  value: HeatmapChartValue;
  index: number;
  columnIndex: number;
  rowIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HeatmapChartCellProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  cell: HeatmapChartCellState;
  children: ReactNode;
};

export function HeatmapChartCell({ cell, ref, ...props }: HeatmapChartCellProps) {
  const context = useChartKind("HeatmapChartCell", "HeatmapChart", "heatmap");
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
      fallbackSlot="heatmap-chart-cell"
      data-value={cell.value.value}
      data-x={cell.value.x}
      data-y={cell.value.y}
    />
  );
}

export type HeatmapChartPlotProps = Omit<
  ComponentProps<"svg">,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  children?: ((cell: HeatmapChartCellState) => ReactNode) | undefined;
};

export function HeatmapChartPlot({ children, ref, ...props }: HeatmapChartPlotProps) {
  const context = useChartKind("HeatmapChartPlot", "HeatmapChart", "heatmap");
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
  const cells = orderedValues.map((value, index): HeatmapChartCellState => {
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
    const candidates = cells.filter((cell) => {
      if (key === "ArrowLeft") {
        return cell.rowIndex === current.rowIndex && cell.columnIndex < current.columnIndex;
      }
      if (key === "ArrowRight") {
        return cell.rowIndex === current.rowIndex && cell.columnIndex > current.columnIndex;
      }
      if (key === "ArrowUp") {
        return cell.columnIndex === current.columnIndex && cell.rowIndex < current.rowIndex;
      }
      return cell.columnIndex === current.columnIndex && cell.rowIndex > current.rowIndex;
    });
    candidates.sort((first, second) => {
      const firstDistance =
        Math.abs(first.columnIndex - current.columnIndex) +
        Math.abs(first.rowIndex - current.rowIndex);
      const secondDistance =
        Math.abs(second.columnIndex - current.columnIndex) +
        Math.abs(second.rowIndex - current.rowIndex);
      return firstDistance - secondDistance;
    });
    const target = candidates[0];
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
    <svg data-slot="heatmap-chart-plot" {...props} ref={ref} viewBox="0 0 120 120" role="group">
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
        <g role="presentation" data-slot="heatmap-chart-cells">
          {cells.map((cell) => {
            if (children)
              return (
                <Fragment key={JSON.stringify([cell.value.x, cell.value.y])}>
                  {children(cell)}
                </Fragment>
              );
            return (
              <Fragment key={JSON.stringify([cell.value.x, cell.value.y])}>
                <g aria-hidden="true" data-slot="heatmap-chart-cell">
                  <rect
                    x={cell.x}
                    y={cell.y}
                    width={cell.width}
                    height={cell.height}
                    fill="currentColor"
                  />
                </g>
              </Fragment>
            );
          })}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
