import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import { type DumbbellChartValue, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named comparison and individually named dumbbells. */

export type DumbbellChartDumbbellState = {
  value: DumbbellChartValue;
  index: number;
  startX: number;
  endX: number;
  y: number;
};

export type DumbbellChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  xMin?: number | undefined;
  xMax?: number | undefined;
  xTickCount?: number | undefined;
  children?: ((dumbbell: DumbbellChartDumbbellState) => ReactNode) | undefined;
};

export type DumbbellChartDumbbellProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  dumbbell: DumbbellChartDumbbellState;
  children: ReactNode;
};

export function DumbbellChartDumbbell({
  dumbbell,
  ref,
  ...props
}: DumbbellChartDumbbellProps & RefProp<SVGGElement>) {
  const context = useChartContext("DumbbellChartDumbbell", "DumbbellChart");
  if (context.kind !== "dumbbell") {
    throw new Error("DumbbellChartDumbbell must be rendered inside DumbbellChart.");
  }
  const formattedStart = context.formatY(dumbbell.value.start);
  const formattedEnd = context.formatY(dumbbell.value.end);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "dumbbell",
        index: dumbbell.index,
        label: `${context.categoryLabel}: ${dumbbell.value.label}, ${context.valueLabel} ${context.startLabel}: ${formattedStart}, ${context.valueLabel} ${context.endLabel}: ${formattedEnd}`,
        value: dumbbell.value,
        formattedStart,
        formattedEnd,
      }}
      fallbackSlot="dumbbell-chart-dumbbell"
      data-end={dumbbell.value.end}
      data-label={dumbbell.value.label}
      data-start={dumbbell.value.start}
    />
  );
}

export function DumbbellChartPlot({
  children,
  xMax,
  xMin,
  xTickCount,
  ref,
  ...props
}: DumbbellChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("DumbbellChartPlot", "DumbbellChart");
  if (context.kind !== "dumbbell") {
    throw new Error("DumbbellChartPlot must be rendered inside DumbbellChart.");
  }
  const scale = createChartScale(
    "DumbbellChartPlot",
    context.values.flatMap((value) => [
      { label: value.label, value: value.start },
      { label: value.label, value: value.end },
    ]),
    { domain: "extent", min: xMin, max: xMax },
  );
  const tickCount = chartTickCount("DumbbellChartPlot", xTickCount, "xTickCount");
  const bounds = { ...chartPlotBounds, left: 32 };
  const { bottom, left, right, top } = bounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const slot = context.values.length === 0 ? plotHeight : plotHeight / context.values.length;
  const dumbbells = context.values.map((value, index): DumbbellChartDumbbellState => ({
    value,
    index,
    startX: left + scale.position(value.start) * plotWidth,
    endX: left + scale.position(value.end) * plotWidth,
    y: top + (index + 0.5) * slot,
  }));
  const xTicks = scale.ticks(tickCount).map((value) => ({
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
      data-slot={dataSlot(props, "dumbbell-chart-plot")}
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
      <ChartNavigationProvider count={dumbbells.length} orientation="vertical">
        <g role="presentation" data-slot="dumbbell-chart-dumbbells">
          {dumbbells.map((dumbbell) => (
            <Fragment key={`${dumbbell.value.label}-${dumbbell.index}`}>
              {children ? (
                children(dumbbell)
              ) : (
                <g aria-hidden="true" data-slot="dumbbell-chart-dumbbell">
                  <line
                    x1={dumbbell.startX}
                    x2={dumbbell.endX}
                    y1={dumbbell.y}
                    y2={dumbbell.y}
                    stroke="currentColor"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={dumbbell.startX} cy={dumbbell.y} r="2" fill="currentColor" />
                  <circle cx={dumbbell.endX} cy={dumbbell.y} r="2" fill="currentColor" />
                </g>
              )}
            </Fragment>
          ))}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
