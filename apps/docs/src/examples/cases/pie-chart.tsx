import {
  ChartDescription,
  ChartLegend,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  PieChart,
  PieChartPlot,
  PieChartSlice,
} from "@comp0/react";

const traffic = [
  { label: "Direct", value: 4200 },
  { label: "Search", value: 3100 },
  { label: "Referrals", value: 1800 },
  { label: "Social", value: 900 },
] as const;

const colors = [
  "bg-teal-600 fill-teal-600 dark:bg-teal-400 dark:fill-teal-400",
  "bg-sky-600 fill-sky-600 dark:bg-sky-400 dark:fill-sky-400",
  "bg-violet-600 fill-violet-600 dark:bg-violet-400 dark:fill-violet-400",
  "bg-amber-500 fill-amber-500 dark:bg-amber-400 dark:fill-amber-400",
] as const;

const formatVisits = (value: number) => value.toLocaleString("en-US");

export function Example() {
  return (
    <PieChart
      values={traffic}
      categoryLabel="Source"
      valueLabel="Visits"
      formatValue={formatVisits}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Traffic by source
      </ChartTitle>
      <PieChartPlot
        aria-label="Pie chart showing traffic share by source"
        className="mx-auto mt-5 aspect-square w-full max-w-xs overflow-visible"
      >
        {(slice) => (
          <PieChartSlice slice={slice} className="group outline-none">
            <path d={slice.path} className={colors[slice.index]} />
          </PieChartSlice>
        )}
      </PieChartPlot>
      <ChartLegend className="mt-5 grid gap-2 text-sm [&>li]:grid [&>li]:grid-cols-[auto_1fr_auto] [&>li]:items-center [&>li]:gap-2">
        {({ formattedValue, index, percentage, value }) => (
          <>
            <span aria-hidden="true" className={`size-3 rounded-sm ${colors[index]}`} />
            <span>{value.label}</span>
            <span>
              {formattedValue} · {percentage.toFixed(0)}%
            </span>
          </>
        )}
      </ChartLegend>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Direct visits are the largest source, while social accounts for less than one tenth.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Traffic source values</caption>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">Visits</th>
          </tr>
        </thead>
        <tbody>
          {traffic.map((source) => (
            <tr key={source.label}>
              <th scope="row">{source.label}</th>
              <td>{formatVisits(source.value)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </PieChart>
  );
}
