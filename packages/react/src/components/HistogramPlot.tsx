import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import { type HistogramBinValue, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named distribution and individually named interactive bins. */

export type HistogramBinState = HistogramBinValue & {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HistogramPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  /** Number of equal-width bins; defaults to the square root of the observation count. */
  binCount?: number | undefined;
  xMin?: number | undefined;
  xMax?: number | undefined;
  xTickCount?: number | undefined;
  yTickCount?: number | undefined;
  children?: ((bin: HistogramBinState) => ReactNode) | undefined;
};

export type HistogramBinProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  bin: HistogramBinState;
  children: ReactNode;
};

export function HistogramBin({ bin, ref, ...props }: HistogramBinProps & RefProp<SVGGElement>) {
  const context = useChartContext("HistogramBin", "Histogram");
  if (context.kind !== "histogram") {
    throw new Error("HistogramBin must be rendered inside Histogram.");
  }
  const formattedMin = context.formatY(bin.min);
  const formattedMax = context.formatY(bin.max);
  let range = `${formattedMin} to ${formattedMax}`;
  if (bin.index > 0) range = `over ${formattedMin} to ${formattedMax}`;
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "histogram",
        index: bin.index,
        label: `${context.valueLabel}: ${range}, ${context.frequencyLabel}: ${bin.count}`,
        value: { min: bin.min, max: bin.max, count: bin.count },
        formattedMin,
        formattedMax,
      }}
      fallbackSlot="histogram-bin"
      data-count={bin.count}
      data-max={bin.max}
      data-min={bin.min}
    />
  );
}

export function HistogramPlot({
  binCount,
  children,
  xMax,
  xMin,
  xTickCount,
  yTickCount,
  ref,
  ...props
}: HistogramPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("HistogramPlot", "Histogram");
  if (context.kind !== "histogram") {
    throw new Error("HistogramPlot must be rendered inside Histogram.");
  }
  const resolvedBinCount = binCount ?? Math.max(1, Math.ceil(Math.sqrt(context.values.length)));
  if (!Number.isInteger(resolvedBinCount) || resolvedBinCount < 1) {
    throw new Error(
      `HistogramPlot binCount must be a positive integer; received ${resolvedBinCount}.`,
    );
  }
  const observations = context.values.map((value, index) => ({ label: String(index), value }));
  const xScale = createChartScale("HistogramPlot x axis", observations, {
    domain: "extent",
    min: xMin,
    max: xMax,
  });
  const binWidth = (xScale.max - xScale.min) / resolvedBinCount;
  const binValues = Array.from(
    { length: resolvedBinCount },
    (_, index): HistogramBinValue => ({
      min: xScale.min + index * binWidth,
      max: xScale.min + (index + 1) * binWidth,
      count: 0,
    }),
  );
  for (const value of context.values) {
    const index = Math.min(
      resolvedBinCount - 1,
      Math.floor(((value - xScale.min) / (xScale.max - xScale.min)) * resolvedBinCount),
    );
    const bin = binValues[index];
    if (bin) bin.count += 1;
  }
  const yScale = createChartScale(
    "HistogramPlot y axis",
    binValues.map((bin, index) => ({ label: String(index), value: bin.count })),
    {
      domain: "include-zero",
      min: 0,
      max: Math.max(1, ...binValues.map((bin) => bin.count)),
    },
  );
  const resolvedXTickCount = chartTickCount("HistogramPlot", xTickCount, "xTickCount");
  const resolvedYTickCount = chartTickCount("HistogramPlot", yTickCount);
  const { bottom, left, right, top } = chartPlotBounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const bins = binValues.map((bin, index): HistogramBinState => {
    const x = left + (index / resolvedBinCount) * plotWidth;
    const y = bottom - yScale.position(bin.count) * plotHeight;
    return {
      ...bin,
      index,
      x,
      y,
      width: plotWidth / resolvedBinCount,
      height: bottom - y,
    };
  });
  const xTicks = xScale.ticks(resolvedXTickCount).map((value) => ({
    label: context.formatY(value),
    position: xScale.position(value),
  }));
  const yTicks = yScale.ticks(resolvedYTickCount).map((value) => ({
    label: String(Math.round(value)),
    position: yScale.position(value),
  }));

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 120 120"
      role="group"
      data-slot={dataSlot(props, "histogram-plot")}
    >
      <ChartAxes
        xLabel={context.valueLabel}
        xTicks={xTicks}
        yLabel={context.frequencyLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider count={bins.length} orientation="horizontal">
        <g role="presentation" data-slot="histogram-bins">
          {bins.map((bin) => (
            <Fragment key={bin.index}>
              {children ? (
                children(bin)
              ) : (
                <g aria-hidden="true" data-slot="histogram-bin">
                  <rect
                    x={bin.x}
                    y={bin.y}
                    width={bin.width}
                    height={bin.height}
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
