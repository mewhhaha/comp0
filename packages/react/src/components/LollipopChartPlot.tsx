import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import { type CategoricalChartValue, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named comparison and individually named lollipops. */

export type LollipopChartLollipopState = {
  value: CategoricalChartValue;
  index: number;
  x: number;
  y: number;
  baseline: number;
};

export type LollipopChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  xMin?: number | undefined;
  xMax?: number | undefined;
  xTickCount?: number | undefined;
  children?: ((lollipop: LollipopChartLollipopState) => ReactNode) | undefined;
};

export type LollipopChartLollipopProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  lollipop: LollipopChartLollipopState;
  children: ReactNode;
};

export function LollipopChartLollipop({
  lollipop,
  ref,
  ...props
}: LollipopChartLollipopProps & RefProp<SVGGElement>) {
  const context = useChartContext("LollipopChartLollipop", "LollipopChart");
  if (context.kind !== "lollipop") {
    throw new Error("LollipopChartLollipop must be rendered inside LollipopChart.");
  }
  const formattedValue = context.formatY(lollipop.value.value);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "lollipop",
        index: lollipop.index,
        label: `${context.categoryLabel}: ${lollipop.value.label}, ${context.valueLabel}: ${formattedValue}`,
        value: lollipop.value,
        formattedValue,
      }}
      fallbackSlot="lollipop-chart-lollipop"
      data-label={lollipop.value.label}
      data-value={lollipop.value.value}
    />
  );
}

export function LollipopChartPlot({
  children,
  xMax,
  xMin,
  xTickCount,
  ref,
  ...props
}: LollipopChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("LollipopChartPlot", "LollipopChart");
  if (context.kind !== "lollipop") {
    throw new Error("LollipopChartPlot must be rendered inside LollipopChart.");
  }
  const scale = createChartScale(
    "LollipopChartPlot",
    context.values.map((value) => ({ label: value.label, value: value.value })),
    { domain: "include-zero", min: xMin, max: xMax },
  );
  const tickCount = chartTickCount("LollipopChartPlot", xTickCount, "xTickCount");
  const bounds = { ...chartPlotBounds, left: 32 };
  const { bottom, left, right, top } = bounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const baseline = left + scale.position(0) * plotWidth;
  const slot = context.values.length === 0 ? plotHeight : plotHeight / context.values.length;
  const lollipops = context.values.map(
    (value, index): LollipopChartLollipopState => ({
      value,
      index,
      baseline,
      x: left + scale.position(value.value) * plotWidth,
      y: top + (index + 0.5) * slot,
    }),
  );
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
      data-slot={dataSlot(props, "lollipop-chart-plot")}
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
      <ChartNavigationProvider count={lollipops.length} orientation="vertical">
        <g role="presentation" data-slot="lollipop-chart-lollipops">
          {lollipops.map((lollipop) => (
            <Fragment key={`${lollipop.value.label}-${lollipop.index}`}>
              {children ? (
                children(lollipop)
              ) : (
                <g aria-hidden="true" data-slot="lollipop-chart-lollipop">
                  <line
                    x1={lollipop.baseline}
                    x2={lollipop.x}
                    y1={lollipop.y}
                    y2={lollipop.y}
                    stroke="currentColor"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={lollipop.x} cy={lollipop.y} r="2.5" fill="currentColor" />
                </g>
              )}
            </Fragment>
          ))}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
