import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  ColumnChart,
  ColumnChartColumn,
  ColumnChartPlot,
} from "@comp0/react";

const traffic = [
  { label: "Direct", value: 42 },
  { label: "Search", value: 31 },
  { label: "Referrals", value: 18 },
  { label: "Social", value: 9 },
] as const;

const colors = [
  "fill-teal-600 dark:fill-teal-400",
  "fill-sky-600 dark:fill-sky-400",
  "fill-violet-600 dark:fill-violet-400",
  "fill-amber-500 dark:fill-amber-400",
] as const;

const formatPercent = (value: number) => `${value}%`;

export function Example() {
  return (
    <ColumnChart
      values={traffic}
      categoryLabel="Source"
      valueLabel="Share"
      formatValue={formatPercent}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Traffic by source
      </ChartTitle>
      <ColumnChartPlot
        aria-label="Column chart comparing traffic share by source"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(column) => (
          <ColumnChartColumn column={column} className="group outline-none">
            <rect
              x={column.x}
              y={column.y}
              width={column.width}
              height={column.height}
              className={`${colors[column.index]} stroke-transparent group-data-active:stroke-zinc-950 dark:group-data-active:stroke-white`}
              rx="1.5"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </ColumnChartColumn>
        )}
      </ColumnChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Direct visits are the largest source, while social accounts for less than one tenth.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Traffic source values</caption>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {traffic.map((source) => (
            <tr key={source.label}>
              <th scope="row">{source.label}</th>
              <td>{formatPercent(source.value)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </ColumnChart>
  );
}
