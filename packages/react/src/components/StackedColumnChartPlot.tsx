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

export type StackedColumnChartSegmentState = {
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

export type StackedColumnChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  yMax?: number | undefined;
  yTickCount?: number | undefined;
  children?: ((segment: StackedColumnChartSegmentState) => ReactNode) | undefined;
};

export type StackedColumnChartSegmentProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  segment: StackedColumnChartSegmentState;
  children: ReactNode;
};

export function StackedColumnChartSegment({
  segment,
  ref,
  ...props
}: StackedColumnChartSegmentProps & RefProp<SVGGElement>) {
  const context = useChartContext("StackedColumnChartSegment", "StackedColumnChart");
  if (context.kind !== "stacked-column") {
    throw new Error("StackedColumnChartSegment must be rendered inside StackedColumnChart.");
  }
  const formattedValue = context.formatY(segment.segment.value);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "stacked-column",
        index: segment.index,
        label: `${context.categoryLabel}: ${segment.value.label}, Segment: ${segment.segment.label}, ${context.valueLabel}: ${formattedValue}`,
        value: segment.value,
        segment: segment.segment,
        formattedValue,
      }}
      fallbackSlot="stacked-column-chart-segment"
      data-category={segment.value.label}
      data-segment={segment.segment.label}
      data-value={segment.segment.value}
    />
  );
}

export function StackedColumnChartPlot({
  children,
  yMax,
  yTickCount,
  ref,
  ...props
}: StackedColumnChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("StackedColumnChartPlot", "StackedColumnChart");
  if (context.kind !== "stacked-column") {
    throw new Error("StackedColumnChartPlot must be rendered inside StackedColumnChart.");
  }
  const totals = context.values.map((value) => ({
    label: value.label,
    value: value.segments.reduce((sum, segment) => sum + segment.value, 0),
  }));
  const scale = createChartScale("StackedColumnChartPlot", totals, {
    domain: "include-zero",
    min: 0,
    max: yMax ?? Math.max(1, ...totals.map((total) => total.value)),
  });
  const resolvedTickCount = chartTickCount("StackedColumnChartPlot", yTickCount);
  const { bottom, left, right, top } = chartPlotBounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const categorySlot = context.values.length === 0 ? plotWidth : plotWidth / context.values.length;
  const width = categorySlot * 0.68;
  const segments: StackedColumnChartSegmentState[] = [];
  for (const [categoryIndex, value] of context.values.entries()) {
    let preceding = 0;
    for (const [segmentIndex, segment] of value.segments.entries()) {
      const start = bottom - scale.position(preceding) * plotHeight;
      preceding += segment.value;
      const end = bottom - scale.position(preceding) * plotHeight;
      segments.push({
        value,
        segment,
        index: segments.length,
        categoryIndex,
        segmentIndex,
        x: left + categoryIndex * categorySlot + (categorySlot - width) / 2,
        y: end,
        width,
        height: start - end,
      });
    }
  }
  const segmentCount = context.values[0]?.segments.length ?? 0;
  const getTargetIndex = (currentIndex: number, key: string) => {
    const current = segments[currentIndex];
    if (!current || !key.startsWith("Arrow")) return undefined;
    let categoryIndex = current.categoryIndex;
    let segmentIndex = current.segmentIndex;
    if (key === "ArrowLeft") categoryIndex = Math.max(0, categoryIndex - 1);
    if (key === "ArrowRight") {
      categoryIndex = Math.min(context.values.length - 1, categoryIndex + 1);
    }
    if (key === "ArrowDown") segmentIndex = Math.max(0, segmentIndex - 1);
    if (key === "ArrowUp") segmentIndex = Math.min(segmentCount - 1, segmentIndex + 1);
    return categoryIndex * segmentCount + segmentIndex;
  };
  const xTicks = context.values.map((value, index) => ({
    label: value.label,
    position: context.values.length === 0 ? 0.5 : (index + 0.5) / context.values.length,
  }));
  const yTicks = scale.ticks(resolvedTickCount).map((value) => ({
    label: context.formatY(value),
    position: scale.position(value),
  }));

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 120 120"
      role="group"
      data-slot={dataSlot(props, "stacked-column-chart-plot")}
    >
      <ChartAxes
        xLabel={context.categoryLabel}
        xTicks={xTicks}
        yLabel={context.valueLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider
        count={segments.length}
        getTargetIndex={getTargetIndex}
        orientation="both"
      >
        <g role="presentation" data-slot="stacked-column-chart-segments">
          {segments.map((segment) => (
            <Fragment key={`${segment.value.label}-${segment.segment.label}`}>
              {children ? (
                children(segment)
              ) : (
                <g aria-hidden="true" data-slot="stacked-column-chart-segment">
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
