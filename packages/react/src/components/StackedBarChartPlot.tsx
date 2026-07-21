import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import {
  type StackedChartSegment,
  type StackedChartValue,
  useChartContext,
} from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named plot and individually named interactive segments. */

export type StackedBarChartSegmentState = {
  value: StackedChartValue;
  segment: StackedChartSegment;
  index: number;
  categoryIndex: number;
  segmentIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StackedBarChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  xMax?: number | undefined;
  xTickCount?: number | undefined;
  children?: ((segment: StackedBarChartSegmentState) => ReactNode) | undefined;
};

export type StackedBarChartSegmentProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  segment: StackedBarChartSegmentState;
  children: ReactNode;
};

export function StackedBarChartSegment({
  segment,
  ref,
  ...props
}: StackedBarChartSegmentProps & RefProp<SVGGElement>) {
  const context = useChartContext("StackedBarChartSegment", "StackedBarChart");
  if (context.kind !== "stacked-bar") {
    throw new Error("StackedBarChartSegment must be rendered inside StackedBarChart.");
  }
  const formattedValue = context.formatY(segment.segment.value);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "stacked-bar",
        index: segment.index,
        label: `${context.categoryLabel}: ${segment.value.label}, Segment: ${segment.segment.label}, ${context.valueLabel}: ${formattedValue}`,
        value: segment.value,
        segment: segment.segment,
        formattedValue,
      }}
      fallbackSlot="stacked-bar-chart-segment"
      data-category={segment.value.label}
      data-segment={segment.segment.label}
      data-value={segment.segment.value}
    />
  );
}

export function StackedBarChartPlot({
  children,
  xMax,
  xTickCount,
  ref,
  ...props
}: StackedBarChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("StackedBarChartPlot", "StackedBarChart");
  if (context.kind !== "stacked-bar") {
    throw new Error("StackedBarChartPlot must be rendered inside StackedBarChart.");
  }
  const totals = context.values.map((value) => ({
    label: value.label,
    value: value.segments.reduce((sum, segment) => sum + segment.value, 0),
  }));
  const scale = createChartScale("StackedBarChartPlot", totals, {
    domain: "include-zero",
    min: 0,
    max: xMax ?? Math.max(1, ...totals.map((total) => total.value)),
  });
  const resolvedTickCount = chartTickCount("StackedBarChartPlot", xTickCount, "xTickCount");
  const bounds = { ...chartPlotBounds, left: 32 };
  const { bottom, left, right, top } = bounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const categorySlot =
    context.values.length === 0 ? plotHeight : plotHeight / context.values.length;
  const height = categorySlot * 0.68;
  const segments: StackedBarChartSegmentState[] = [];
  for (const [categoryIndex, value] of context.values.entries()) {
    let preceding = 0;
    for (const [segmentIndex, segment] of value.segments.entries()) {
      const start = left + scale.position(preceding) * plotWidth;
      preceding += segment.value;
      const end = left + scale.position(preceding) * plotWidth;
      segments.push({
        value,
        segment,
        index: segments.length,
        categoryIndex,
        segmentIndex,
        x: start,
        y: top + categoryIndex * categorySlot + (categorySlot - height) / 2,
        width: end - start,
        height,
      });
    }
  }
  const segmentCount = context.values[0]?.segments.length ?? 0;
  const getTargetIndex = (currentIndex: number, key: string) => {
    const current = segments[currentIndex];
    if (!current || !key.startsWith("Arrow")) return undefined;
    let categoryIndex = current.categoryIndex;
    let segmentIndex = current.segmentIndex;
    if (key === "ArrowLeft") segmentIndex = Math.max(0, segmentIndex - 1);
    if (key === "ArrowRight") segmentIndex = Math.min(segmentCount - 1, segmentIndex + 1);
    if (key === "ArrowUp") categoryIndex = Math.max(0, categoryIndex - 1);
    if (key === "ArrowDown") {
      categoryIndex = Math.min(context.values.length - 1, categoryIndex + 1);
    }
    return categoryIndex * segmentCount + segmentIndex;
  };
  const xTicks = scale.ticks(resolvedTickCount).map((value) => ({
    label: context.formatY(value),
    position: scale.position(value),
  }));
  const yTicks = context.values.map((value, index) => ({
    label: value.label,
    position: context.values.length === 0 ? 0.5 : 1 - (index + 0.5) / context.values.length,
  }));

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 120 120"
      role="group"
      data-slot={dataSlot(props, "stacked-bar-chart-plot")}
    >
      <ChartAxes
        bounds={bounds}
        xGrid
        xLabel={context.valueLabel}
        xTicks={xTicks}
        yGrid={false}
        yLabel={context.categoryLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider
        count={segments.length}
        getTargetIndex={getTargetIndex}
        orientation="both"
      >
        <g role="presentation" data-slot="stacked-bar-chart-segments">
          {segments.map((segment) => (
            <Fragment key={`${segment.value.label}-${segment.segment.label}`}>
              {children ? (
                children(segment)
              ) : (
                <g aria-hidden="true" data-slot="stacked-bar-chart-segment">
                  <rect
                    x={segment.x}
                    y={segment.y}
                    width={segment.width}
                    height={segment.height}
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
