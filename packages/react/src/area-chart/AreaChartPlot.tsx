import { type ReactNode, type ComponentProps } from "react";
import { useWarnOnce } from "../internal/dev.js";
import { ChartAxes, chartPlotBounds } from "../chart/ChartAxes.js";
import { ChartNavigationProvider } from "../chart/chart-navigation.js";
import { ChartValue } from "../chart/ChartValue.js";
import { chartTickCount, createChartScale } from "../chart/chart-scale.js";
import { type ChartPoint, numberOf, useChartKind } from "../chart/chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The inline SVG groups the named plot and individually named interactive points. */

export type AreaChartPlotState = {
  areaPath: string;
  baseline: number;
  linePath: string;
  points: readonly ChartPoint[];
};

export type AreaChartPointProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  point: ChartPoint;
  children: ReactNode;
};

export function AreaChartPoint({ point, ref, ...props }: AreaChartPointProps) {
  const context = useChartKind("AreaChartPoint", "AreaChart", "area");
  const formattedX = context.formatX(point.value.x);
  const formattedY = context.formatY(point.value.y);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "area",
        index: point.index,
        label: `${context.xLabel}: ${formattedX}, ${context.yLabel}: ${formattedY}`,
        value: point.value,
        formattedX,
        formattedY,
      }}
      fallbackSlot="area-chart-point"
    />
  );
}

export type AreaChartPlotProps = Omit<
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
  /** Renders the area and boundary; defaults to an unstyled currentColor path. */
  children?: ((state: AreaChartPlotState) => ReactNode) | undefined;
};

export function AreaChartPlot({
  children,
  yMax,
  yMin,
  yTickCount,
  ref,
  ...props
}: AreaChartPlotProps) {
  const context = useChartKind("AreaChartPlot", "AreaChart", "area");
  const warn = useWarnOnce();
  const xScaleValues = context.values.map((value) => ({
    label: context.formatX(value.x),
    value: numberOf(value.x),
  }));
  const yScaleValues = context.values.map((value) => ({
    label: context.formatX(value.x),
    value: value.y,
  }));
  const xScale = createChartScale(warn, "AreaChartPlot x axis", xScaleValues, { domain: "extent" });
  const yScale = createChartScale(warn, "AreaChartPlot", yScaleValues, {
    domain: "include-zero",
    max: yMax,
    min: yMin,
  });
  const tickCount = chartTickCount(warn, "AreaChartPlot", yTickCount);
  const { bottom, left, right, top } = chartPlotBounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const baseline = bottom - yScale.position(0) * plotHeight;
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
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const firstPoint = points[0];
  const lastPoint = points.at(-1);
  let areaPath = "";
  if (firstPoint && lastPoint) {
    areaPath = `M ${firstPoint.x} ${baseline} ${linePath.replace(/^M /, "L ")} L ${lastPoint.x} ${baseline} Z`;
  }
  const xTicks = context.values.map((value) => ({
    label: context.formatX(value.x),
    position: context.values.length === 1 ? 0.5 : xScale.position(numberOf(value.x)),
  }));
  const yTicks = yScale.axisTicks(tickCount, context.formatY);
  const state = { areaPath, baseline, linePath, points };
  let content: ReactNode = <path aria-hidden="true" d={areaPath} fill="currentColor" />;
  if (children) content = children(state);

  return (
    <svg data-slot="area-chart-plot" {...props} ref={ref} viewBox="0 0 120 120" role="group">
      <ChartAxes xLabel={context.xLabel} xTicks={xTicks} yLabel={context.yLabel} yTicks={yTicks} />
      <ChartNavigationProvider count={points.length} orientation="horizontal">
        <g role="presentation" data-slot="area-chart-area">
          {content}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
