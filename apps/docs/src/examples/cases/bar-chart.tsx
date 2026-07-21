import {
  BarChart,
  BarChartBar,
  BarChartPlot,
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
} from "@comp0/react";

const performance = [
  { label: "Reliability", value: 96 },
  { label: "Accessibility", value: 91 },
  { label: "Interaction", value: 84 },
  { label: "Rendering", value: 78 },
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
    <BarChart
      values={performance}
      categoryLabel="Measure"
      valueLabel="Target met"
      formatValue={formatPercent}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Performance against target
      </ChartTitle>
      <BarChartPlot
        aria-label="Horizontal bar chart comparing performance against target"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(bar) => (
          <BarChartBar bar={bar} className="group outline-none">
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              className={`${colors[bar.index]} stroke-transparent group-data-active:stroke-zinc-950 dark:group-data-active:stroke-white`}
              rx="1.5"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </BarChartBar>
        )}
      </BarChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Reliability and accessibility are closest to the target; rendering has the largest gap.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Performance against target values</caption>
        <thead>
          <tr>
            <th scope="col">Measure</th>
            <th scope="col">Target met</th>
          </tr>
        </thead>
        <tbody>
          {performance.map((measure) => (
            <tr key={measure.label}>
              <th scope="row">{measure.label}</th>
              <td>{formatPercent(measure.value)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </BarChart>
  );
}
