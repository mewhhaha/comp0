import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  DumbbellChart,
  DumbbellChartDumbbell,
  DumbbellChartPlot,
} from "@comp0/react";

const delivery = [
  { label: "Standard", start: 3, end: 8 },
  { label: "Express", start: 5, end: 11 },
  { label: "Pickup", start: 2, end: 6 },
] as const;

const formatHours = (value: number) => `${value}h`;

export function Example() {
  return (
    <DumbbellChart
      values={delivery}
      categoryLabel="Service"
      valueLabel="Hours"
      formatValue={formatHours}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Delivery-time range
      </ChartTitle>
      <DumbbellChartPlot
        aria-label="Dumbbell chart comparing delivery time ranges"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(dumbbell) => (
          <DumbbellChartDumbbell dumbbell={dumbbell} className="group outline-none">
            <line
              x1={dumbbell.startX}
              x2={dumbbell.endX}
              y1={dumbbell.y}
              y2={dumbbell.y}
              className="stroke-teal-600 group-data-active:stroke-zinc-950 dark:stroke-teal-400 dark:group-data-active:stroke-white"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={dumbbell.startX}
              cy={dumbbell.y}
              r="2.6"
              className="fill-white stroke-teal-700 dark:fill-zinc-950 dark:stroke-teal-300"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={dumbbell.endX}
              cy={dumbbell.y}
              r="2.6"
              className="fill-teal-700 stroke-white dark:fill-teal-300 dark:stroke-zinc-950"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </DumbbellChartDumbbell>
        )}
      </DumbbellChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Express delivery spans the widest range of promised hours.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Delivery-time ranges</caption>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Start</th>
            <th scope="col">End</th>
          </tr>
        </thead>
        <tbody>
          {delivery.map((item) => (
            <tr key={item.label}>
              <th scope="row">{item.label}</th>
              <td>{formatHours(item.start)}</td>
              <td>{formatHours(item.end)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </DumbbellChart>
  );
}
