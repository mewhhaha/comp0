import { Fragment, useEffect, type ReactNode, type ComponentProps } from "react";
import { dataSlot } from "../internal/shared.js";
import { ChartAxes, chartPlotBounds } from "../chart/ChartAxes.js";
import { ChartNavigationProvider } from "../chart/chart-navigation.js";
import { ChartValue } from "../chart/ChartValue.js";
import { chartTickCount, createChartScale } from "../chart/chart-scale.js";
import { binHistogram } from "../chart/chart-histogram.js";
import { useChartMeta } from "../chart/chart-meta.js";
import { type HistogramBinValue, useChartKind } from "../chart/chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named distribution and individually named interactive bins. */

export type HistogramChartBinState = HistogramBinValue & {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HistogramChartBinProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  bin: HistogramChartBinState;
  children: ReactNode;
};

export function HistogramChartBin({ bin, ref, ...props }: HistogramChartBinProps) {
  const context = useChartKind("HistogramChartBin", "HistogramChart", "histogram");
  const formattedMin = context.formatY(bin.min);
  const formattedMax = context.formatY(bin.max);
  const range = `${formattedMin} to ${formattedMax}`;
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
      fallbackSlot="histogram-chart-bin"
      data-count={bin.count}
      data-max={bin.max}
      data-min={bin.min}
    />
  );
}

export type HistogramChartPlotProps = Omit<
  ComponentProps<"svg">,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  /** Number of equal-width bins; defaults to the square root of the observation count. */
  binCount?: number | undefined;
  xMin?: number | undefined;
  xMax?: number | undefined;
  xTickCount?: number | undefined;
  yTickCount?: number | undefined;
  children?: ((bin: HistogramChartBinState) => ReactNode) | undefined;
};

export function HistogramChartPlot({
  binCount,
  children,
  xMax,
  xMin,
  xTickCount,
  yTickCount,
  ref,
  ...props
}: HistogramChartPlotProps) {
  const { setHistogramBins } = useChartMeta("HistogramChartPlot");
  const context = useChartKind("HistogramChartPlot", "HistogramChart", "histogram");
  const {
    bins: binValues,
    binCount: resolvedBinCount,
    xScale,
  } = binHistogram("HistogramChartPlot", context.values, { binCount, xMin, xMax });
  // Tells the default ChartTable how this plot grouped the observations.
  useEffect(() => {
    setHistogramBins({ binCount, xMin, xMax });
    return () => setHistogramBins(null);
  }, [binCount, setHistogramBins, xMax, xMin]);
  const yScale = createChartScale(
    "HistogramChartPlot y axis",
    binValues.map((bin, index) => ({ label: String(index), value: bin.count })),
    {
      domain: "include-zero",
      min: 0,
      max: Math.max(1, ...binValues.map((bin) => bin.count)),
    },
  );
  const resolvedXTickCount = chartTickCount("HistogramChartPlot", xTickCount, "xTickCount");
  const resolvedYTickCount = chartTickCount("HistogramChartPlot", yTickCount);
  const { bottom, left, right, top } = chartPlotBounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const bins = binValues.map((bin, index): HistogramChartBinState => {
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
      data-slot={dataSlot(props, "histogram-chart-plot")}
    >
      <ChartAxes
        xLabel={context.valueLabel}
        xTicks={xTicks}
        yLabel={context.frequencyLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider count={bins.length} orientation="horizontal">
        <g role="presentation" data-slot="histogram-chart-bins">
          {bins.map((bin) => {
            if (children) return <Fragment key={bin.index}>{children(bin)}</Fragment>;
            return (
              <Fragment key={bin.index}>
                <g aria-hidden="true" data-slot="histogram-chart-bin">
                  <rect
                    x={bin.x}
                    y={bin.y}
                    width={bin.width}
                    height={bin.height}
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
