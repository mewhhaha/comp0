import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartNavigationProvider, ChartValue, useActiveChartValue } from "./chart-interaction.js";
import { type CategoricalChartValue, useChartContext } from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The inline SVG groups the named plot and individually named interactive slices. */

export type PieChartSliceState = {
  value: CategoricalChartValue;
  index: number;
  path: string;
  percentage: number;
  startAngle: number;
  endAngle: number;
};

export type PieChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  /** Concise text alternative identifying the graphic and proportions. */
  "aria-label": string;
  /** Renders each slice; defaults to an unstyled currentColor path. */
  children?: ((slice: PieChartSliceState) => ReactNode) | undefined;
};

export type PieChartSliceProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  slice: PieChartSliceState;
  children: ReactNode;
};

export function PieChartSlice({ slice, ref, ...props }: PieChartSliceProps & RefProp<SVGGElement>) {
  const context = useChartContext("PieChartSlice", "PieChart");
  if (context.kind !== "pie") {
    throw new Error("PieChartSlice must be rendered inside PieChart.");
  }
  const formattedValue = context.formatY(slice.value.value);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "pie",
        index: slice.index,
        label: `${context.categoryLabel}: ${slice.value.label}, ${context.valueLabel}: ${formattedValue}, ${slice.percentage.toFixed(1)}%`,
        value: slice.value,
        formattedValue,
        percentage: slice.percentage,
      }}
      fallbackSlot="pie-chart-slice"
      data-label={slice.value.label}
      data-value={slice.value.value}
    />
  );
}

function pointAt(angle: number) {
  const x = 50 + 50 * Math.cos(angle);
  const y = 50 + 50 * Math.sin(angle);
  return {
    x: Number(x.toFixed(6)),
    y: Number(y.toFixed(6)),
  };
}

function slicePath(startAngle: number, endAngle: number) {
  const turn = Math.PI * 2;
  if (endAngle - startAngle >= turn - Number.EPSILON) {
    const start = pointAt(startAngle);
    const opposite = pointAt(startAngle + Math.PI);
    return `M 50 50 L ${start.x} ${start.y} A 50 50 0 1 1 ${opposite.x} ${opposite.y} A 50 50 0 1 1 ${start.x} ${start.y} Z`;
  }
  const start = pointAt(startAngle);
  const end = pointAt(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M 50 50 L ${start.x} ${start.y} A 50 50 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export function PieChartPlot({
  children,
  ref,
  ...props
}: PieChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("PieChartPlot", "PieChart");
  const activeValue = useActiveChartValue();
  if (context.kind !== "pie") throw new Error("PieChartPlot must be rendered inside PieChart.");
  const total = context.values.reduce((sum, value) => sum + value.value, 0);
  const slices = context.values.map((value, index): PieChartSliceState => {
    const precedingValue = context.values
      .slice(0, index)
      .reduce((sum, preceding) => sum + preceding.value, 0);
    const startAngle = -Math.PI / 2 + (precedingValue / total) * Math.PI * 2;
    const percentage = (value.value / total) * 100;
    const endAngle = startAngle + (value.value / total) * Math.PI * 2;
    const path = value.value === 0 ? "" : slicePath(startAngle, endAngle);
    return { value, index, path, percentage, startAngle, endAngle };
  });
  const activeSlice = activeValue?.kind === "pie" ? slices[activeValue.index] : undefined;

  return (
    <svg
      {...props}
      ref={ref}
      viewBox="0 0 100 100"
      role="group"
      data-slot={dataSlot(props, "pie-chart-plot")}
    >
      <ChartNavigationProvider
        count={slices.length}
        loop
        orientation="both"
        paintActiveLast={false}
      >
        <g role="presentation" data-slot="pie-chart-slices">
          {slices.map((slice) => {
            const { index, path, value } = slice;
            return (
              <Fragment key={`${value.label}-${index}`}>
                {children ? (
                  children(slice)
                ) : (
                  <g
                    aria-hidden="true"
                    data-label={value.label}
                    data-slot="pie-chart-slice"
                    data-value={value.value}
                  >
                    {path && <path d={path} fill="currentColor" />}
                  </g>
                )}
              </Fragment>
            );
          })}
        </g>
        {activeSlice?.path && (
          <path
            aria-hidden="true"
            d={activeSlice.path}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
            data-slot="pie-chart-active-slice"
          />
        )}
      </ChartNavigationProvider>
    </svg>
  );
}
