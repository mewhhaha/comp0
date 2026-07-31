import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  LollipopChart,
  LollipopChartLollipop,
  LollipopChartPlot,
} from "@comp0/react";

const adoption = [
  { label: "Email", value: 82 },
  { label: "Calendar", value: 64 },
  { label: "Files", value: 48 },
  { label: "Chat", value: 35 },
] as const;

const formatPercent = (value: number) => `${value}%`;

export function Example() {
  return (
    <LollipopChart
      values={adoption}
      categoryLabel="Feature"
      valueLabel="Adoption"
      formatValue={formatPercent}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Feature adoption
      </ChartTitle>
      <LollipopChartPlot
        aria-label="Lollipop chart comparing feature adoption"
        xMin={0}
        xMax={100}
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(lollipop) => (
          <LollipopChartLollipop lollipop={lollipop} className="group outline-none">
            <line
              x1={lollipop.baseline}
              x2={lollipop.x}
              y1={lollipop.y}
              y2={lollipop.y}
              className="stroke-teal-600 group-data-active:stroke-zinc-950 dark:stroke-teal-400 dark:group-data-active:stroke-white"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={lollipop.x}
              cy={lollipop.y}
              r="3"
              className="fill-teal-700 stroke-white dark:fill-teal-300 dark:stroke-zinc-950"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </LollipopChartLollipop>
        )}
      </LollipopChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Email is the most adopted feature, while chat has the most room to grow.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Feature adoption percentages</caption>
        <thead>
          <tr>
            <th scope="col">Feature</th>
            <th scope="col">Adoption</th>
          </tr>
        </thead>
        <tbody>
          {adoption.map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td>{formatPercent(item.value)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </LollipopChart>
  );
}
