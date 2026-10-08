import { type ReactNode, type ComponentProps } from "react";
import { dataSlot } from "../internal/shared.js";
import { ChartAxes, chartPlotBounds } from "../chart/ChartAxes.js";
import { ChartNavigationProvider } from "../chart/chart-navigation.js";
import { ChartValue } from "../chart/ChartValue.js";
import { chartTickCount, createChartScale } from "../chart/chart-scale.js";
import { type ChartPoint, numberOf, useChartKind } from "../chart/chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The inline SVG groups the named plot and individually named interactive points. */

export type LineChartPlotState = {
  path: string;
  points: readonly ChartPoint[];
};

export type LineChartPointProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  point: ChartPoint;
  children: ReactNode;
};

export function LineChartPoint({ point, ref, ...props }: LineChartPointProps) {
  const context = useChartKind("LineChartPoint", "LineChart", "line");
  const formattedX = context.formatX(point.value.x);
  const formattedY = context.formatY(point.value.y);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "line",
        index: point.index,
        label: `${context.xLabel}: ${formattedX}, ${context.yLabel}: ${formattedY}`,
        value: point.value,
        formattedX,
        formattedY,
      }}
      fallbackSlot="line-chart-point"
    />
  );
}

export type LineChartPlotProps = Omit<
  ComponentProps<"svg">,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  /** Concise text alternative identifying the graphic and change across both axes. */
  "aria-label": string;
  /** Lower vertical-axis bound; the derived scale includes zero by default. */
  yMin?: number | undefined;
  /** Upper vertical-axis bound; the derived scale includes zero by default. */
  yMax?: number | undefined;
  /** Number of visible vertical-axis ticks; defaults to 5. */
  yTickCount?: number | undefined;
  /** Renders the line and optional points; defaults to an unstyled currentColor path. */
  children?: ((state: LineChartPlotState) => ReactNode) | undefined;
};

export function LineChartPlot({
  children,
  yMax,
  yMin,
  yTickCount,
  ref,
  ...props
}: LineChartPlotProps) {
  const context = useChartKind("LineChartPlot", "LineChart", "line");
  const xScaleValues = context.values.map((value) => ({
    label: context.formatX(value.x),
    value: numberOf(value.x),
  }));
  const yScaleValues = context.values.map((value) => ({
    label: context.formatX(value.x),
    value: value.y,
  }));
  const xScale = createChartScale("LineChartPlot x axis", xScaleValues, { domain: "extent" });
  const yScale = createChartScale("LineChartPlot", yScaleValues, {
    domain: "include-zero",
    max: yMax,
    min: yMin,
  });
  const tickCount = chartTickCount("LineChartPlot", yTickCount);
  const { bottom, left, right, top } = chartPlotBounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const points = context.values.map((value, index): ChartPoint => {
    let x = left + xScale.position(numberOf(value.x)) * plotWidth;
    if (context.values.length === 1) x = left + plotWidth / 2;
    return {
      value,
      index,
      x,
      y: bottom - yScale.position(value.y) * plotHeight,
    };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const xTicks = context.values.map((value) => ({
    label: context.formatX(value.x),
    position: context.values.length === 1 ? 0.5 : xScale.position(numberOf(value.x)),
  }));
  const yTicks = yScale.ticks(tickCount).map((value) => ({
    label: context.formatY(value),
    position: yScale.position(value),
  }));
  const state = { path, points };
  let content: ReactNode = (
    <path
      aria-hidden="true"
      d={path}
      fill="none"
      stroke="currentColor"
      vectorEffect="non-scaling-stroke"
    />
  );
  if (children) content = children(state);

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 120 120"
      role="group"
      data-slot={dataSlot(props, "line-chart-plot")}
    >
      <ChartAxes xLabel={context.xLabel} xTicks={xTicks} yLabel={context.yLabel} yTicks={yTicks} />
      <ChartNavigationProvider count={points.length} orientation="horizontal">
        <g role="presentation" data-slot="line-chart-line">
          {content}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
