import {
  AreaChart,
  AreaChartPlot,
  AreaChartPoint,
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
} from "@comp0/react";

const activeAccounts = [
  { x: 1, y: 12 },
  { x: 2, y: 24 },
  { x: 3, y: 38 },
  { x: 4, y: 51 },
] as const;

export function Example() {
  return (
    <AreaChart
      values={activeAccounts}
      xLabel="Quarter"
      yLabel="Active accounts"
      formatX={(value) => `Q${value}`}
      formatY={(value) => `${value}k`}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Active accounts
      </ChartTitle>
      <AreaChartPlot
        aria-label="Area chart showing active accounts by quarter"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {({ areaPath, linePath, points }) => (
          <>
            <path
              aria-hidden="true"
              d={areaPath}
              className="fill-sky-500/25 dark:fill-sky-400/25"
            />
            <path
              aria-hidden="true"
              d={linePath}
              fill="none"
              className="stroke-sky-600 dark:stroke-sky-400"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {points.map((point) => (
              <AreaChartPoint key={point.index} point={point} className="group outline-none">
                <circle cx={point.x} cy={point.y} r="4" className="fill-transparent" />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="1.8"
                  className="fill-white stroke-sky-600 group-data-active:stroke-zinc-950 dark:fill-zinc-950 dark:stroke-sky-400 dark:group-data-active:stroke-white"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </AreaChartPoint>
            ))}
          </>
        )}
      </AreaChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Active accounts grew every quarter and more than quadrupled across the year.
      </ChartDescription>
      <ChartTable
        caption="Active account values"
        className="mt-4 w-full border-collapse text-left text-sm [&_caption]:sr-only [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800"
      />
      <ChartTooltip className="z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </AreaChart>
  );
}
