"use client";

import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  LineChart,
  LineChartPlot,
  LineChartPoint,
} from "@comp0/react";

export type ForecastChartProps = { data: { x: number; y: number }[] };
export function ForecastChart({ data }: ForecastChartProps) {
  return (
    <LineChart values={data} xLabel="Day" yLabel="Degrees Celsius">
      <ChartTitle>Daily high</ChartTitle>
      <LineChartPlot aria-label="Line chart: Daily high">
        {({ path, points }) => (
          <>
            <path
              aria-hidden="true"
              d={path}
              fill="none"
              stroke="currentColor"
              vectorEffect="non-scaling-stroke"
            />
            {points.map((point) => (
              <LineChartPoint key={point.index} point={point} className="group">
                <circle cx={point.x} cy={point.y} r="4" fill="transparent" />
                <circle
                  className="forecast-point fill-white stroke-teal-700 group-data-active:fill-teal-700 dark:fill-zinc-950 dark:stroke-teal-300 dark:group-data-active:fill-teal-300"
                  cx={point.x}
                  cy={point.y}
                  r="1.8"
                  style={{ animationDelay: point.index * 24 + "ms" }}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              </LineChartPoint>
            ))}
          </>
        )}
      </LineChartPlot>
      <ChartDescription>Daily highs for the next seven days in the chosen city.</ChartDescription>
      <ChartTable />
    </LineChart>
  );
}
