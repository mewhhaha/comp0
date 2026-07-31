import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  CumulativeHistogram,
  CumulativeHistogramBin,
  CumulativeHistogramPlot,
} from "@comp0/react";

const responseTimes = [180, 210, 230, 250, 270, 290, 310, 340, 380, 420, 480, 620] as const;

const formatMilliseconds = (value: number) => `${Math.round(value)} ms`;

export function Example() {
  return (
    <CumulativeHistogram
      values={responseTimes}
      valueLabel="Response time"
      frequencyLabel="Requests at or below"
      formatValue={formatMilliseconds}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Cumulative response-time distribution
      </ChartTitle>
      <CumulativeHistogramPlot
        aria-label="Cumulative histogram of response times"
        binCount={5}
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(bin) => (
          <CumulativeHistogramBin bin={bin} className="group outline-none">
            <rect
              x={bin.x}
              y={bin.y}
              width={bin.width}
              height={bin.height}
              className="fill-teal-600 stroke-white group-data-active:stroke-zinc-950 dark:fill-teal-400 dark:stroke-zinc-950 dark:group-data-active:stroke-white"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </CumulativeHistogramBin>
        )}
      </CumulativeHistogramPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        The cumulative count reaches all twelve requests by the final response-time bin.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">
          Response-time observations used for the cumulative histogram
        </caption>
        <thead>
          <tr>
            <th scope="col">Sample</th>
            <th scope="col">Response time</th>
          </tr>
        </thead>
        <tbody>
          {responseTimes.map((value, index) => (
            <tr key={`${value}-${index}`}>
              <th scope="row">{index + 1}</th>
              <td>{formatMilliseconds(value)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </CumulativeHistogram>
  );
}
