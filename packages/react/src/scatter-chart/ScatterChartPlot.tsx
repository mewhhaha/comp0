import { Fragment, type ReactNode, type ComponentProps } from "react";
import { ChartAxes, chartPlotBounds } from "../chart/ChartAxes.js";
import { ChartNavigationProvider } from "../chart/chart-navigation.js";
import { ChartValue } from "../chart/ChartValue.js";
import { chartTickCount, createChartScale } from "../chart/chart-scale.js";
import { numberOf, type ScatterChartValue, useChartKind } from "../chart/chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named plot and individually named interactive points. */

export type ScatterChartPointState = {
  value: ScatterChartValue;
  index: number;
  x: number;
  y: number;
};

export type ScatterChartPointProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  point: ScatterChartPointState;
  children: ReactNode;
};

export function ScatterChartPoint({ point, ref, ...props }: ScatterChartPointProps) {
  const context = useChartKind("ScatterChartPoint", "ScatterChart", "scatter");
  const formattedX = context.formatX(point.value.x);
  const formattedY = context.formatY(point.value.y);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "scatter",
        index: point.index,
        label: `${point.value.label}, ${context.xLabel}: ${formattedX}, ${context.yLabel}: ${formattedY}`,
        value: point.value,
        formattedX,
        formattedY,
      }}
      fallbackSlot="scatter-chart-point"
      data-label={point.value.label}
    />
  );
}

export type ScatterChartPlotProps = Omit<
  ComponentProps<"svg">,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  xMin?: number | undefined;
  xMax?: number | undefined;
  yMin?: number | undefined;
  yMax?: number | undefined;
  xTickCount?: number | undefined;
  yTickCount?: number | undefined;
  children?: ((point: ScatterChartPointState) => ReactNode) | undefined;
};

export function ScatterChartPlot({
  children,
  xMax,
  xMin,
  xTickCount,
  yMax,
  yMin,
  yTickCount,
  ref,
  ...props
}: ScatterChartPlotProps) {
  const context = useChartKind("ScatterChartPlot", "ScatterChart", "scatter");
  const xScale = createChartScale(
    "ScatterChartPlot x axis",
    context.values.map((value) => ({ label: value.label, value: numberOf(value.x) })),
    { domain: "extent", min: xMin, max: xMax },
  );
  const yScale = createChartScale(
    "ScatterChartPlot y axis",
    context.values.map((value) => ({ label: value.label, value: value.y })),
    { domain: "extent", min: yMin, max: yMax },
  );
  const resolvedXTickCount = chartTickCount("ScatterChartPlot", xTickCount, "xTickCount");
  const resolvedYTickCount = chartTickCount("ScatterChartPlot", yTickCount);
  const { bottom, left, right, top } = chartPlotBounds;
  const width = right - left;
  const height = bottom - top;
  const points = context.values.map((value, index): ScatterChartPointState => ({
    value,
    index,
    x: left + xScale.position(numberOf(value.x)) * width,
    y: bottom - yScale.position(value.y) * height,
  }));
  const getTargetIndex = (currentIndex: number, key: string) => {
    const current = points[currentIndex];
    if (!current || !key.startsWith("Arrow")) return undefined;
    const candidates = points.filter((point) => {
      if (key === "ArrowLeft") return point.x < current.x;
      if (key === "ArrowRight") return point.x > current.x;
      if (key === "ArrowUp") return point.y < current.y;
      return point.y > current.y;
    });
    candidates.sort((first, second) => {
      const firstDistance = Math.hypot(first.x - current.x, first.y - current.y);
      const secondDistance = Math.hypot(second.x - current.x, second.y - current.y);
      return firstDistance - secondDistance;
    });
    return candidates[0]?.index ?? currentIndex;
  };
  const xTicks = xScale.axisTicks(resolvedXTickCount, context.formatX);
  const yTicks = yScale.axisTicks(resolvedYTickCount, context.formatY);

  return (
    <svg data-slot="scatter-chart-plot" {...props} ref={ref} viewBox="0 0 120 120" role="group">
      <ChartAxes
        xGrid
        xLabel={context.xLabel}
        xTicks={xTicks}
        yLabel={context.yLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider
        count={points.length}
        getTargetIndex={getTargetIndex}
        orientation="both"
      >
        <g role="presentation" data-slot="scatter-chart-points">
          {points.map((point) => {
            if (children)
              return (
                <Fragment key={`${point.value.label}-${point.index}`}>{children(point)}</Fragment>
              );
            return (
              <Fragment key={`${point.value.label}-${point.index}`}>
                <g aria-hidden="true" data-slot="scatter-chart-point">
                  <circle cx={point.x} cy={point.y} r="2" fill="currentColor" />
                </g>
              </Fragment>
            );
          })}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
