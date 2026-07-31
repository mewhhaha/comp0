import { type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import { type ChartPoint, numberOf, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The inline SVG groups the named plot and individually named interactive points. */

export type LineChartPlotState = {
  path: string;
  points: readonly ChartPoint[];
};

export type LineChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
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

export type LineChartPointProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  point: ChartPoint;
  children: ReactNode;
};

export function LineChartPoint({
  point,
  ref,
  ...props
}: LineChartPointProps & RefProp<SVGGElement>) {
  const context = useChartContext("LineChartPoint", "LineChart");
  if (context.kind !== "line") {
    throw new Error("LineChartPoint must be rendered inside LineChart.");
  }
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

export function LineChartPlot({
  children,
  yMax,
  yMin,
  yTickCount,
  ref,
  ...props
}: LineChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("LineChartPlot", "LineChart");
  if (context.kind !== "line") {
    throw new Error("LineChartPlot must be rendered inside LineChart.");
  }
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
          {children ? (
            children(state)
          ) : (
            <path
              aria-hidden="true"
              d={path}
              fill="none"
              stroke="currentColor"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
