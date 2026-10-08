import { Fragment, type ReactNode, type ComponentProps } from "react";
import { ChartAxes, chartPlotBounds } from "../chart/ChartAxes.js";
import { ChartNavigationProvider } from "../chart/chart-navigation.js";
import { ChartValue } from "../chart/ChartValue.js";
import { chartTickCount, createChartScale } from "../chart/chart-scale.js";
import { type CandlestickChartValue, numberOf, useChartKind } from "../chart/chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The inline SVG groups the named plot and individually named interactive candles. */

export type CandlestickChartCandleState = {
  value: CandlestickChartValue;
  index: number;
  x: number;
  width: number;
  bodyY: number;
  bodyHeight: number;
  highY: number;
  lowY: number;
  direction: "up" | "down" | "unchanged";
};

export type CandlestickChartCandleProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  candle: CandlestickChartCandleState;
  children: ReactNode;
};

export function CandlestickChartCandle({ candle, ref, ...props }: CandlestickChartCandleProps) {
  const context = useChartKind("CandlestickChartCandle", "CandlestickChart", "candlestick");
  const formattedX = context.formatX(candle.value.x);
  const formattedOpen = context.formatY(candle.value.open);
  const formattedHigh = context.formatY(candle.value.high);
  const formattedLow = context.formatY(candle.value.low);
  const formattedClose = context.formatY(candle.value.close);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "candlestick",
        index: candle.index,
        label: `${context.xLabel}: ${formattedX}, ${context.openLabel}: ${formattedOpen}, ${context.highLabel}: ${formattedHigh}, ${context.lowLabel}: ${formattedLow}, ${context.closeLabel}: ${formattedClose}`,
        value: candle.value,
        formattedX,
        formattedOpen,
        formattedHigh,
        formattedLow,
        formattedClose,
      }}
      fallbackSlot="candlestick-chart-candle"
      data-direction={candle.direction}
    />
  );
}

export type CandlestickChartPlotProps = Omit<
  ComponentProps<"svg">,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  /** Concise text alternative identifying the graphic, instrument, and period. */
  "aria-label": string;
  /** Lower vertical-axis bound; the derived scale follows the observed low values by default. */
  yMin?: number | undefined;
  /** Upper vertical-axis bound; the derived scale follows the observed high values by default. */
  yMax?: number | undefined;
  /** Number of visible vertical-axis ticks; defaults to 5. */
  yTickCount?: number | undefined;
  /** Renders each candle; defaults to an unstyled wick and body using currentColor. */
  children?: ((candle: CandlestickChartCandleState) => ReactNode) | undefined;
};

export function CandlestickChartPlot({
  children,
  yMax,
  yMin,
  yTickCount,
  ref,
  ...props
}: CandlestickChartPlotProps) {
  const context = useChartKind("CandlestickChartPlot", "CandlestickChart", "candlestick");
  const xScaleValues = context.values.map((value) => ({
    label: context.formatX(value.x),
    value: numberOf(value.x),
  }));
  const yScaleValues = context.values.flatMap((value) => [
    { label: context.formatX(value.x), value: value.low },
    { label: context.formatX(value.x), value: value.high },
  ]);
  const xScale = createChartScale("CandlestickChartPlot x axis", xScaleValues, {
    domain: "extent",
  });
  const yScale = createChartScale("CandlestickChartPlot", yScaleValues, {
    domain: "extent",
    max: yMax,
    min: yMin,
  });
  const tickCount = chartTickCount("CandlestickChartPlot", yTickCount);
  const bounds = { ...chartPlotBounds, left: 32, right: 112 };
  const { bottom, left, right, top } = bounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const unpaddedXPositions = context.values.map((value) => {
    if (context.values.length === 1) return left + plotWidth / 2;
    return left + xScale.position(numberOf(value.x)) * plotWidth;
  });
  const gaps = unpaddedXPositions.slice(1).map((x, index) => x - unpaddedXPositions[index]!);
  const candleWidth = Math.min(10, (gaps.length === 0 ? plotWidth : Math.min(...gaps)) * 0.55);
  const xPositions = context.values.map((value) => {
    if (context.values.length === 1) return left + plotWidth / 2;
    return left + candleWidth / 2 + xScale.position(numberOf(value.x)) * (plotWidth - candleWidth);
  });
  const candles = context.values.map((value, index): CandlestickChartCandleState => {
    const openY = bottom - yScale.position(value.open) * plotHeight;
    const closeY = bottom - yScale.position(value.close) * plotHeight;
    let direction: CandlestickChartCandleState["direction"] = "unchanged";
    if (value.close > value.open) direction = "up";
    if (value.close < value.open) direction = "down";
    return {
      value,
      index,
      x: xPositions[index]!,
      width: candleWidth,
      bodyY: Math.min(openY, closeY),
      bodyHeight: Math.abs(closeY - openY),
      highY: bottom - yScale.position(value.high) * plotHeight,
      lowY: bottom - yScale.position(value.low) * plotHeight,
      direction,
    };
  });
  const xTicks = context.values.map((value, index) => ({
    label: context.formatX(value.x),
    position: (xPositions[index]! - left) / plotWidth,
  }));
  const yTicks = yScale.axisTicks(tickCount, context.formatY);

  return (
    <svg data-slot="candlestick-chart-plot" {...props} ref={ref} viewBox="0 0 120 120" role="group">
      <ChartAxes
        bounds={bounds}
        xLabel={context.xLabel}
        xTicks={xTicks}
        yLabel={context.yLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider count={candles.length} orientation="horizontal">
        <g role="presentation" data-slot="candlestick-chart-candles">
          {candles.map((candle) => {
            let body: ReactNode = (
              <rect
                x={candle.x - candle.width / 2}
                y={candle.bodyY}
                width={candle.width}
                height={candle.bodyHeight}
                fill="currentColor"
              />
            );
            if (candle.bodyHeight === 0) {
              body = (
                <line
                  x1={candle.x - candle.width / 2}
                  x2={candle.x + candle.width / 2}
                  y1={candle.bodyY}
                  y2={candle.bodyY}
                  stroke="currentColor"
                  vectorEffect="non-scaling-stroke"
                />
              );
            }
            if (children)
              return (
                <Fragment key={`${context.formatX(candle.value.x)}-${candle.index}`}>
                  {children(candle)}
                </Fragment>
              );
            return (
              <Fragment key={`${context.formatX(candle.value.x)}-${candle.index}`}>
                <g
                  aria-hidden="true"
                  data-direction={candle.direction}
                  data-slot="candlestick-chart-candle"
                >
                  <line
                    x1={candle.x}
                    x2={candle.x}
                    y1={candle.highY}
                    y2={candle.lowY}
                    stroke="currentColor"
                    vectorEffect="non-scaling-stroke"
                  />
                  {body}
                </g>
              </Fragment>
            );
          })}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
