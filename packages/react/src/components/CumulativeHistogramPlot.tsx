import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import { useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named cumulative distribution and individually named bins. */

export type CumulativeHistogramBinState = {
  min: number;
  max: number;
  count: number;
  cumulativeCount: number;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CumulativeHistogramPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  binCount?: number | undefined;
  xMin?: number | undefined;
  xMax?: number | undefined;
  xTickCount?: number | undefined;
  yTickCount?: number | undefined;
  children?: ((bin: CumulativeHistogramBinState) => ReactNode) | undefined;
};

export type CumulativeHistogramBinProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  bin: CumulativeHistogramBinState;
  children: ReactNode;
};

export function CumulativeHistogramBin({
  bin,
  ref,
  ...props
}: CumulativeHistogramBinProps & RefProp<SVGGElement>) {
  const context = useChartContext("CumulativeHistogramBin", "CumulativeHistogram");
  if (context.kind !== "cumulative-histogram") {
    throw new Error("CumulativeHistogramBin must be rendered inside CumulativeHistogram.");
  }
  const formattedMin = context.formatY(bin.min);
  const formattedMax = context.formatY(bin.max);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "cumulative-histogram",
        index: bin.index,
        label: `${context.valueLabel}: ${formattedMin} to ${formattedMax}, count: ${bin.count}, cumulative ${context.frequencyLabel}: ${bin.cumulativeCount}`,
        value: {
          min: bin.min,
          max: bin.max,
          count: bin.count,
          cumulativeCount: bin.cumulativeCount,
        },
        formattedMin,
        formattedMax,
      }}
      fallbackSlot="cumulative-histogram-bin"
      data-count={bin.count}
      data-cumulative-count={bin.cumulativeCount}
      data-max={bin.max}
      data-min={bin.min}
    />
  );
}

export function CumulativeHistogramPlot({
  binCount,
  children,
  xMax,
  xMin,
  xTickCount,
  yTickCount,
  ref,
  ...props
}: CumulativeHistogramPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("CumulativeHistogramPlot", "CumulativeHistogram");
  if (context.kind !== "cumulative-histogram") {
    throw new Error("CumulativeHistogramPlot must be rendered inside CumulativeHistogram.");
  }
  const resolvedBinCount = binCount ?? Math.max(1, Math.ceil(Math.sqrt(context.values.length)));
  if (!Number.isInteger(resolvedBinCount) || resolvedBinCount < 1) {
    throw new Error(
      `CumulativeHistogramPlot binCount must be a positive integer; received ${resolvedBinCount}.`,
    );
  }
  const xScale = createChartScale(
    "CumulativeHistogramPlot x axis",
    context.values.map((value, index) => ({ label: String(index), value })),
    { domain: "extent", min: xMin, max: xMax },
  );
  const binWidth = (xScale.max - xScale.min) / resolvedBinCount;
  const bins = Array.from({ length: resolvedBinCount }, (_, index) => ({
    min: xScale.min + index * binWidth,
    max: xScale.min + (index + 1) * binWidth,
    count: 0,
  }));
  for (const value of context.values) {
    const index = Math.min(
      resolvedBinCount - 1,
      Math.floor(((value - xScale.min) / (xScale.max - xScale.min)) * resolvedBinCount),
    );
    bins[index]!.count += 1;
  }
  let cumulativeCount = 0;
  const cumulativeBins = bins.map((bin, index) => {
    cumulativeCount += bin.count;
    return { ...bin, cumulativeCount, index };
  });
  const yScale = createChartScale(
    "CumulativeHistogramPlot y axis",
    cumulativeBins.map((bin) => ({ label: String(bin.index), value: bin.cumulativeCount })),
    { domain: "include-zero", min: 0, max: Math.max(1, cumulativeCount) },
  );
  const resolvedXTickCount = chartTickCount("CumulativeHistogramPlot", xTickCount, "xTickCount");
  const resolvedYTickCount = chartTickCount("CumulativeHistogramPlot", yTickCount);
  const { bottom, left, right, top } = chartPlotBounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const renderedBins = cumulativeBins.map((bin): CumulativeHistogramBinState => {
    const y = bottom - yScale.position(bin.cumulativeCount) * plotHeight;
    return {
      ...bin,
      x: left + (bin.index / resolvedBinCount) * plotWidth,
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
      data-slot={dataSlot(props, "cumulative-histogram-plot")}
    >
      <ChartAxes
        xLabel={context.valueLabel}
        xTicks={xTicks}
        yLabel={context.frequencyLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider count={renderedBins.length} orientation="horizontal">
        <g role="presentation" data-slot="cumulative-histogram-bins">
          {renderedBins.map((bin) => (
            <Fragment key={bin.index}>
              {children ? (
                children(bin)
              ) : (
                <g aria-hidden="true" data-slot="cumulative-histogram-bin">
                  <rect
                    x={bin.x}
                    y={bin.y}
                    width={bin.width}
                    height={bin.height}
                    fill="currentColor"
                    stroke="currentColor"
                    strokeOpacity="0.35"
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
