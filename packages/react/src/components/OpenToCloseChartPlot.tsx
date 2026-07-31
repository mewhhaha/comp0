import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import { numberOf, type OpenToCloseChartValue, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named time series and individually named ranges. */

export type OpenToCloseChartRangeState = {
  value: OpenToCloseChartValue;
  index: number;
  x: number;
  width: number;
  openY: number;
  closeY: number;
  direction: "up" | "down" | "unchanged";
};

export type OpenToCloseChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  yMin?: number | undefined;
  yMax?: number | undefined;
  yTickCount?: number | undefined;
  children?: ((range: OpenToCloseChartRangeState) => ReactNode) | undefined;
};

export type OpenToCloseChartRangeProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  range: OpenToCloseChartRangeState;
  children: ReactNode;
};

export function OpenToCloseChartRange({
  range,
  ref,
  ...props
}: OpenToCloseChartRangeProps & RefProp<SVGGElement>) {
  const context = useChartContext("OpenToCloseChartRange", "OpenToCloseChart");
  if (context.kind !== "open-to-close") {
    throw new Error("OpenToCloseChartRange must be rendered inside OpenToCloseChart.");
  }
  const formattedX = context.formatX(range.value.x);
  const formattedOpen = context.formatY(range.value.open);
  const formattedClose = context.formatY(range.value.close);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "open-to-close",
        index: range.index,
        label: `${context.xLabel}: ${formattedX}, ${context.openLabel}: ${formattedOpen}, ${context.closeLabel}: ${formattedClose}`,
        value: range.value,
        formattedX,
        formattedOpen,
        formattedClose,
      }}
      fallbackSlot="open-to-close-chart-range"
      data-close={range.value.close}
      data-direction={range.direction}
      data-open={range.value.open}
    />
  );
}

export function OpenToCloseChartPlot({
  children,
  yMax,
  yMin,
  yTickCount,
  ref,
  ...props
}: OpenToCloseChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("OpenToCloseChartPlot", "OpenToCloseChart");
  if (context.kind !== "open-to-close") {
    throw new Error("OpenToCloseChartPlot must be rendered inside OpenToCloseChart.");
  }
  const xScale = createChartScale(
    "OpenToCloseChartPlot x axis",
    context.values.map((value) => ({ label: context.formatX(value.x), value: numberOf(value.x) })),
    { domain: "extent" },
  );
  const yScale = createChartScale(
    "OpenToCloseChartPlot y axis",
    context.values.flatMap((value) => [
      { label: context.formatX(value.x), value: value.open },
      { label: context.formatX(value.x), value: value.close },
    ]),
    { domain: "extent", min: yMin, max: yMax },
  );
  const resolvedYTickCount = chartTickCount("OpenToCloseChartPlot", yTickCount);
  const bounds = { ...chartPlotBounds, left: 28, right: 112 };
  const { bottom, left, right, top } = bounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const xPositions = context.values.map((value) => {
    if (context.values.length === 1) return left + plotWidth / 2;
    return left + xScale.position(numberOf(value.x)) * (plotWidth - 8) + 4;
  });
  const gaps = xPositions.slice(1).map((x, index) => x - xPositions[index]!);
  const rangeWidth = Math.min(10, (gaps.length === 0 ? plotWidth / 3 : Math.min(...gaps)) * 0.55);
  const ranges = context.values.map((value, index): OpenToCloseChartRangeState => {
    let direction: OpenToCloseChartRangeState["direction"] = "unchanged";
    if (value.close > value.open) direction = "up";
    if (value.close < value.open) direction = "down";
    return {
      value,
      index,
      x: xPositions[index]!,
      width: rangeWidth,
      openY: bottom - yScale.position(value.open) * plotHeight,
      closeY: bottom - yScale.position(value.close) * plotHeight,
      direction,
    };
  });
  const xTicks = context.values.map((value, index) => ({
    label: context.formatX(value.x),
    position: context.values.length === 0 ? 0.5 : (xPositions[index]! - left) / plotWidth,
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
      data-slot={dataSlot(props, "open-to-close-chart-plot")}
    >
      <ChartAxes
        bounds={bounds}
        xLabel={context.xLabel}
        xTicks={xTicks}
        yLabel={context.yLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider count={ranges.length} orientation="horizontal">
        <g role="presentation" data-slot="open-to-close-chart-ranges">
          {ranges.map((range) => (
            <Fragment key={`${context.formatX(range.value.x)}-${range.index}`}>
              {children ? (
                children(range)
              ) : (
                <g
                  aria-hidden="true"
                  data-direction={range.direction}
                  data-slot="open-to-close-chart-range"
                >
                  <line
                    x1={range.x}
                    x2={range.x}
                    y1={range.openY}
                    y2={range.closeY}
                    stroke="currentColor"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={range.x - range.width / 2}
                    x2={range.x + range.width / 2}
                    y1={range.openY}
                    y2={range.openY}
                    stroke="currentColor"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={range.x - range.width / 2}
                    x2={range.x + range.width / 2}
                    y1={range.closeY}
                    y2={range.closeY}
                    stroke="currentColor"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
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
