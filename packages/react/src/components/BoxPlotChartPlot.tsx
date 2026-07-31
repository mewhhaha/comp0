import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartAxes, chartPlotBounds } from "./ChartAxes.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import { chartTickCount, createChartScale } from "./chart-scale.js";
import { type BoxPlotChartValue, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named distribution and individually named box plots. */

export type BoxPlotChartBoxState = {
  value: BoxPlotChartValue;
  index: number;
  x: number;
  width: number;
  minY: number;
  q1Y: number;
  medianY: number;
  q3Y: number;
  maxY: number;
};

export type BoxPlotChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  yMin?: number | undefined;
  yMax?: number | undefined;
  yTickCount?: number | undefined;
  children?: ((box: BoxPlotChartBoxState) => ReactNode) | undefined;
};

export type BoxPlotChartBoxProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  box: BoxPlotChartBoxState;
  children: ReactNode;
};

export function BoxPlotChartBox({
  box,
  ref,
  ...props
}: BoxPlotChartBoxProps & RefProp<SVGGElement>) {
  const context = useChartContext("BoxPlotChartBox", "BoxPlotChart");
  if (context.kind !== "boxplot")
    throw new Error("BoxPlotChartBox must be rendered inside BoxPlotChart.");
  const formatted = {
    min: context.formatY(box.value.min),
    q1: context.formatY(box.value.q1),
    median: context.formatY(box.value.median),
    q3: context.formatY(box.value.q3),
    max: context.formatY(box.value.max),
  };
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "boxplot",
        index: box.index,
        label: `${context.categoryLabel}: ${box.value.label}, ${context.valueLabel} min: ${formatted.min}, ${context.valueLabel} first quartile: ${formatted.q1}, ${context.valueLabel} median: ${formatted.median}, ${context.valueLabel} third quartile: ${formatted.q3}, ${context.valueLabel} max: ${formatted.max}`,
        value: box.value,
        formattedMin: formatted.min,
        formattedQ1: formatted.q1,
        formattedMedian: formatted.median,
        formattedQ3: formatted.q3,
        formattedMax: formatted.max,
      }}
      fallbackSlot="boxplot-chart-box"
      data-label={box.value.label}
      data-max={box.value.max}
      data-median={box.value.median}
      data-min={box.value.min}
    />
  );
}

export function BoxPlotChartPlot({
  children,
  yMax,
  yMin,
  yTickCount,
  ref,
  ...props
}: BoxPlotChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("BoxPlotChartPlot", "BoxPlotChart");
  if (context.kind !== "boxplot")
    throw new Error("BoxPlotChartPlot must be rendered inside BoxPlotChart.");
  const scale = createChartScale(
    "BoxPlotChartPlot",
    context.values.flatMap((value) => [
      { label: value.label, value: value.min },
      { label: value.label, value: value.max },
    ]),
    { domain: "extent", min: yMin, max: yMax },
  );
  const tickCount = chartTickCount("BoxPlotChartPlot", yTickCount);
  const { bottom, left, right, top } = chartPlotBounds;
  const plotWidth = right - left;
  const plotHeight = bottom - top;
  const slot = context.values.length === 0 ? plotWidth : plotWidth / context.values.length;
  const boxWidth = Math.min(14, slot * 0.55);
  const boxes = context.values.map((value, index): BoxPlotChartBoxState => {
    const x = left + (index + 0.5) * slot;
    return {
      value,
      index,
      x,
      width: boxWidth,
      minY: bottom - scale.position(value.min) * plotHeight,
      q1Y: bottom - scale.position(value.q1) * plotHeight,
      medianY: bottom - scale.position(value.median) * plotHeight,
      q3Y: bottom - scale.position(value.q3) * plotHeight,
      maxY: bottom - scale.position(value.max) * plotHeight,
    };
  });
  const xTicks = context.values.map((value, index) => ({
    label: value.label,
    position: context.values.length === 0 ? 0.5 : (index + 0.5) / context.values.length,
  }));
  const yTicks = scale.ticks(tickCount).map((value) => ({
    label: context.formatY(value),
    position: scale.position(value),
  }));

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 120 120"
      role="group"
      data-slot={dataSlot(props, "boxplot-chart-plot")}
    >
      <ChartAxes
        xLabel={context.categoryLabel}
        xTicks={xTicks}
        yLabel={context.valueLabel}
        yTicks={yTicks}
      />
      <ChartNavigationProvider count={boxes.length} orientation="horizontal">
        <g role="presentation" data-slot="boxplot-chart-boxes">
          {boxes.map((box) => (
            <Fragment key={`${box.value.label}-${box.index}`}>
              {children ? (
                children(box)
              ) : (
                <g aria-hidden="true" data-slot="boxplot-chart-box">
                  <line
                    x1={box.x}
                    x2={box.x}
                    y1={box.minY}
                    y2={box.maxY}
                    stroke="currentColor"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={box.x - box.width / 3}
                    x2={box.x + box.width / 3}
                    y1={box.minY}
                    y2={box.minY}
                    stroke="currentColor"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line
                    x1={box.x - box.width / 3}
                    x2={box.x + box.width / 3}
                    y1={box.maxY}
                    y2={box.maxY}
                    stroke="currentColor"
                    vectorEffect="non-scaling-stroke"
                  />
                  <rect
                    x={box.x - box.width / 2}
                    y={box.q3Y}
                    width={box.width}
                    height={box.q1Y - box.q3Y}
                    fill="currentColor"
                    fillOpacity="0.3"
                  />
                  <line
                    x1={box.x - box.width / 2}
                    x2={box.x + box.width / 2}
                    y1={box.medianY}
                    y2={box.medianY}
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
