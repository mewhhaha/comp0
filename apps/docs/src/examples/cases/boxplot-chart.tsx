import {
  BoxPlotChart,
  BoxPlotChartBox,
  BoxPlotChartPlot,
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
} from "@comp0/react";

const responseTimes = [
  { label: "Read", min: 90, q1: 120, median: 150, q3: 190, max: 280 },
  { label: "Write", min: 110, q1: 145, median: 180, q3: 230, max: 340 },
  { label: "Search", min: 70, q1: 100, median: 130, q3: 170, max: 250 },
] as const;

const formatMilliseconds = (value: number) => `${value} ms`;

export function Example() {
  return (
    <BoxPlotChart
      values={responseTimes}
      categoryLabel="Operation"
      valueLabel="Response time"
      formatValue={formatMilliseconds}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Response-time spread
      </ChartTitle>
      <BoxPlotChartPlot
        aria-label="Box plot chart comparing response-time spread"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(box) => (
          <BoxPlotChartBox box={box} className="group outline-none">
            <line
              x1={box.x}
              x2={box.x}
              y1={box.minY}
              y2={box.maxY}
              className="stroke-teal-700 dark:stroke-teal-300"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={box.x - box.width / 3}
              x2={box.x + box.width / 3}
              y1={box.minY}
              y2={box.minY}
              className="stroke-teal-700 dark:stroke-teal-300"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={box.x - box.width / 3}
              x2={box.x + box.width / 3}
              y1={box.maxY}
              y2={box.maxY}
              className="stroke-teal-700 dark:stroke-teal-300"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={box.x - box.width / 2}
              y={box.q3Y}
              width={box.width}
              height={box.q1Y - box.q3Y}
              className="fill-teal-100 stroke-teal-700 group-data-active:stroke-zinc-950 dark:fill-teal-950 dark:stroke-teal-300 dark:group-data-active:stroke-white"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={box.x - box.width / 2}
              x2={box.x + box.width / 2}
              y1={box.medianY}
              y2={box.medianY}
              className="stroke-zinc-950 dark:stroke-white"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </BoxPlotChartBox>
        )}
      </BoxPlotChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Write operations have the highest median and widest spread.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Response-time five-number summaries</caption>
        <thead>
          <tr>
            <th scope="col">Operation</th>
            <th scope="col">Min</th>
            <th scope="col">Q1</th>
            <th scope="col">Median</th>
            <th scope="col">Q3</th>
            <th scope="col">Max</th>
          </tr>
        </thead>
        <tbody>
          {responseTimes.map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td>{formatMilliseconds(item.min)}</td>
              <td>{formatMilliseconds(item.q1)}</td>
              <td>{formatMilliseconds(item.median)}</td>
              <td>{formatMilliseconds(item.q3)}</td>
              <td>{formatMilliseconds(item.max)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </BoxPlotChart>
  );
}
