"use client";

import { ChartDescription, ChartTable, ChartTitle, LineChart, LineChartPlot } from "@comp0/react";

export type ForecastChartProps = { data: { x: number; y: number }[] };
export function ForecastChart({ data }: ForecastChartProps) {
  return (
    <LineChart values={data} xLabel="Day" yLabel="Degrees Celsius">
      <ChartTitle>Daily high</ChartTitle>
      <LineChartPlot aria-label="Line chart: Daily high" />
      <ChartDescription>Daily highs for the next seven days in the chosen city.</ChartDescription>
      <ChartTable />
    </LineChart>
  );
}
