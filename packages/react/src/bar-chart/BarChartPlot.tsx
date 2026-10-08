import { Fragment, type ReactNode, type ComponentProps } from "react";
import { ChartAxes, chartPlotBounds } from "../chart/ChartAxes.js";
import { ChartNavigationProvider } from "../chart/chart-navigation.js";
import { ChartValue } from "../chart/ChartValue.js";
import { chartTickCount, createChartScale } from "../chart/chart-scale.js";
import { type CategoricalChartValue, useChartKind } from "../chart/chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The inline SVG groups the named plot and individually named interactive bars. */

export type BarChartBarState = {
  value: CategoricalChartValue;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BarChartBarProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  bar: BarChartBarState;
  children: ReactNode;
};

export function BarChartBar({ bar, ref, ...props }: BarChartBarProps) {
  const context = useChartKind("BarChartBar", "BarChart", "bar");
  const formattedValue = context.formatY(bar.value.value);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "bar",
        index: bar.index,
        label: `${context.categoryLabel}: ${bar.value.label}, ${context.valueLabel}: ${formattedValue}`,
        value: bar.value,
        formattedValue,
      }}
      fallbackSlot="bar-chart-bar"
      data-label={bar.value.label}
      data-value={bar.value.value}
    />
  );
}

export type BarChartPlotProps = Omit<
  ComponentProps<"svg">,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  /** Concise text alternative identifying the graphic and comparison. */
  "aria-label": string;
  /** Lower horizontal-axis bound; the derived scale includes zero by default. */
  xMin?: number | undefined;
  /** Upper horizontal-axis bound; the derived scale includes zero by default. */
  xMax?: number | undefined;
  /** Number of visible horizontal-axis ticks; defaults to 5. */
  xTickCount?: number | undefined;
  /** Renders each bar; defaults to an unstyled rect using currentColor. */
  children?: ((bar: BarChartBarState) => ReactNode) | undefined;
};

export function BarChartPlot({
  children,
  xMax,
  xMin,
  xTickCount,
  ref,
  ...props
}: BarChartPlotProps) {
  const context = useChartKind("BarChartPlot", "BarChart", "bar");
  const scaleValues = context.values.map((value) => ({ label: value.label, value: value.value }));
  const scale = createChartScale("BarChartPlot", scaleValues, {
    domain: "include-zero",
    max: xMax,
    min: xMin,
  });
  const tickCount = chartTickCount("BarChartPlot", xTickCount, "xTickCount");
  const bounds = { ...chartPlotBounds, left: 32 };
  const { bottom, left, right, top } = bounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const baseline = left + scale.position(0) * plotWidth;
  const slot = context.values.length === 0 ? plotHeight : plotHeight / context.values.length;
  const barHeight = slot * 0.68;
  const offset = (slot - barHeight) / 2;
  const bars = context.values.map((value, index): BarChartBarState => {
    const valueX = left + scale.position(value.value) * plotWidth;
    return {
      value,
      index,
      x: Math.min(valueX, baseline),
      y: top + index * slot + offset,
      width: Math.abs(valueX - baseline),
      height: barHeight,
    };
  });
  const xTicks = scale.axisTicks(tickCount, context.formatY);
  const yTicks = context.values.map((value, index) => ({
    label: value.label,
    position: context.values.length === 0 ? 0.5 : 1 - (index + 0.5) / context.values.length,
  }));

  return (
    <svg data-slot="bar-chart-plot" {...props} ref={ref} viewBox="0 0 120 120" role="group">
      <ChartAxes
        bounds={bounds}
        xGrid
        xLabel={context.valueLabel}
        xTicks={xTicks}
        yGrid={false}
        yLabel={context.categoryLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider count={bars.length} orientation="vertical">
        <g role="presentation" data-slot="bar-chart-bars">
          {bars.map((bar) => {
            if (children)
              return <Fragment key={`${bar.value.label}-${bar.index}`}>{children(bar)}</Fragment>;
            return (
              <Fragment key={`${bar.value.label}-${bar.index}`}>
                <g
                  aria-hidden="true"
                  data-label={bar.value.label}
                  data-slot="bar-chart-bar"
                  data-value={bar.value.value}
                >
                  <rect
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
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
