import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  LineChart,
  LineChartPlot,
  LineChartPoint,
} from "@comp0/react";

const revenue = [
  { x: 1, y: 18 },
  { x: 2, y: 31 },
  { x: 3, y: 27 },
  { x: 4, y: 42 },
] as const;

const formatQuarter = (value: number | Date) => `Q${value}`;
const formatRevenue = (value: number) => `$${value}k`;

export function Example() {
  return (
    <LineChart
      values={revenue}
      xLabel="Quarter"
      yLabel="Revenue"
      formatX={formatQuarter}
      formatY={formatRevenue}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Quarterly revenue
      </ChartTitle>
      <LineChartPlot
        aria-label="Line chart showing quarterly revenue"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {({ path, points }) => (
          <>
            <path
              aria-hidden="true"
              d={path}
              fill="none"
              className="stroke-teal-600 dark:stroke-teal-400"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            {points.map((point) => (
              <LineChartPoint key={point.index} point={point} className="group outline-none">
                <circle cx={point.x} cy={point.y} r="4" className="fill-transparent" />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="1.8"
                  className="fill-white stroke-teal-600 group-data-active:stroke-zinc-950 dark:fill-zinc-950 dark:stroke-teal-400 dark:group-data-active:stroke-white"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </LineChartPoint>
            ))}
          </>
        )}
      </LineChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Revenue finished at its highest point after a small third-quarter decline.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Quarterly revenue values</caption>
        <thead>
          <tr>
            <th scope="col">Quarter</th>
            <th scope="col">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {revenue.map((quarter) => (
            <tr key={quarter.x}>
              <th scope="row">{formatQuarter(quarter.x)}</th>
              <td>{formatRevenue(quarter.y)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </LineChart>
  );
}
