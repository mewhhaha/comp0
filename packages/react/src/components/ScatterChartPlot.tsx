import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import { numberOf, type ScatterChartValue, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named plot and individually named interactive points. */

export type ScatterChartPointState = {
  value: ScatterChartValue;
  index: number;
  x: number;
  y: number;
};

export type ScatterChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
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

export type ScatterChartPointProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  point: ScatterChartPointState;
  children: ReactNode;
};

export function ScatterChartPoint({
  point,
  ref,
  ...props
}: ScatterChartPointProps & RefProp<SVGGElement>) {
  const context = useChartContext("ScatterChartPoint", "ScatterChart");
  if (context.kind !== "scatter") {
    throw new Error("ScatterChartPoint must be rendered inside ScatterChart.");
  }
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
}: ScatterChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("ScatterChartPlot", "ScatterChart");
  if (context.kind !== "scatter") {
    throw new Error("ScatterChartPlot must be rendered inside ScatterChart.");
  }
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
  const points = context.values.map(
    (value, index): ScatterChartPointState => ({
      value,
      index,
      x: left + xScale.position(numberOf(value.x)) * width,
      y: bottom - yScale.position(value.y) * height,
    }),
  );
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
  const xTicks = xScale.ticks(resolvedXTickCount).map((value) => ({
    label: context.formatX(value),
    position: xScale.position(value),
  }));
  const yTicks = yScale.ticks(resolvedYTickCount).map((value) => ({
    label: context.formatY(value),
    position: yScale.position(value),
  }));

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 120 120"
      role="group"
      data-slot={dataSlot(props, "scatter-chart-plot")}
    >
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
          {points.map((point) => (
            <Fragment key={`${point.value.label}-${point.index}`}>
              {children ? (
                children(point)
              ) : (
                <g aria-hidden="true" data-slot="scatter-chart-point">
                  <circle cx={point.x} cy={point.y} r="2" fill="currentColor" />
                </g>
              )}
            </Fragment>
          ))}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
