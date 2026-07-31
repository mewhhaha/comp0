import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  OpenToCloseChart,
  OpenToCloseChartPlot,
  OpenToCloseChartRange,
} from "@comp0/react";

const prices = [
  { x: 1, open: 98, close: 104 },
  { x: 2, open: 104, close: 101 },
  { x: 3, open: 101, close: 110 },
  { x: 4, open: 110, close: 108 },
] as const;

const formatPrice = (value: number) => `$${value}`;

export function Example() {
  return (
    <OpenToCloseChart
      values={prices}
      xLabel="Trading day"
      yLabel="Share price"
      formatX={(value) => `Day ${value}`}
      formatY={formatPrice}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Opening to closing price
      </ChartTitle>
      <OpenToCloseChartPlot
        aria-label="Open-to-close chart showing four trading days"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(range) => (
          <OpenToCloseChartRange range={range} className="group outline-none">
            <line
              x1={range.x}
              x2={range.x}
              y1={range.openY}
              y2={range.closeY}
              className="stroke-teal-600 group-data-[direction=down]:stroke-rose-600 dark:stroke-teal-400 dark:group-data-[direction=down]:stroke-rose-400"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={range.x - range.width / 2}
              x2={range.x + range.width / 2}
              y1={range.openY}
              y2={range.openY}
              className="stroke-zinc-700 dark:stroke-zinc-300"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={range.x}
              cy={range.closeY}
              r="2.4"
              className="fill-zinc-950 dark:fill-white"
            />
          </OpenToCloseChartRange>
        )}
      </OpenToCloseChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Day three produced the strongest upward move; day two closed below its open.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Opening and closing prices</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Open</th>
            <th scope="col">Close</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => (
            <tr key={price.x}>
              <th scope="row">Day {price.x}</th>
              <td>{formatPrice(price.open)}</td>
              <td>{formatPrice(price.close)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </OpenToCloseChart>
  );
}
