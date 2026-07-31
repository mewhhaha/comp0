import {
  CandlestickChart,
  CandlestickChartCandle,
  CandlestickChartPlot,
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
} from "@comp0/react";

const prices = [
  { x: 1, open: 184, high: 192, low: 181, close: 190 },
  { x: 2, open: 190, high: 194, low: 186, close: 188 },
  { x: 3, open: 188, high: 197, low: 187, close: 195 },
  { x: 4, open: 195, high: 198, low: 189, close: 191 },
] as const;

const formatDay = (value: number | Date) => `Day ${value}`;
const formatPrice = (value: number) => `$${value}`;

export function Example() {
  return (
    <CandlestickChart
      values={prices}
      xLabel="Trading day"
      yLabel="Share price"
      formatX={formatDay}
      formatY={formatPrice}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Four-day share price
      </ChartTitle>
      <CandlestickChartPlot
        aria-label="Candlestick chart showing four days of share prices"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(candle) => (
          <CandlestickChartCandle candle={candle} className="group outline-none">
            <line
              x1={candle.x}
              x2={candle.x}
              y1={candle.highY}
              y2={candle.lowY}
              data-direction={candle.direction}
              className="stroke-rose-600 data-[direction=up]:stroke-teal-600 group-data-active:stroke-zinc-950 dark:stroke-rose-400 dark:data-[direction=up]:stroke-teal-400 dark:group-data-active:stroke-white"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={candle.x - candle.width / 2}
              y={candle.bodyY}
              width={candle.width}
              height={candle.bodyHeight}
              data-direction={candle.direction}
              className="fill-rose-600 stroke-rose-600 data-[direction=up]:fill-white data-[direction=up]:stroke-teal-600 group-data-active:stroke-zinc-950 dark:fill-rose-400 dark:stroke-rose-400 dark:data-[direction=up]:fill-zinc-950 dark:data-[direction=up]:stroke-teal-400 dark:group-data-active:stroke-white"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              aria-hidden="true"
              x={candle.x - candle.width / 2 - 1.5}
              y={candle.highY - 1.5}
              width={candle.width + 3}
              height={candle.lowY - candle.highY + 3}
              rx="1.5"
              className="pointer-events-none fill-none stroke-transparent group-data-active:stroke-zinc-950 dark:group-data-active:stroke-white"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </CandlestickChartCandle>
        )}
      </CandlestickChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        The price reached its highest close on day three before falling on day four.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Daily open, high, low, and close share prices</caption>
        <thead>
          <tr>
            <th scope="col">Trading day</th>
            <th scope="col">Open</th>
            <th scope="col">High</th>
            <th scope="col">Low</th>
            <th scope="col">Close</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((price) => (
            <tr key={price.x}>
              <th scope="row">{formatDay(price.x)}</th>
              <td>{formatPrice(price.open)}</td>
              <td>{formatPrice(price.high)}</td>
              <td>{formatPrice(price.low)}</td>
              <td>{formatPrice(price.close)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </CandlestickChart>
  );
}
