import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  ScatterChart,
  ScatterChartPlot,
  ScatterChartPoint,
} from "@comp0/react";

const initiatives = [
  { label: "Search", x: 3, y: 8 },
  { label: "Checkout", x: 7, y: 9 },
  { label: "Navigation", x: 4, y: 6 },
  { label: "Reporting", x: 8, y: 4 },
  { label: "Onboarding", x: 5, y: 7 },
] as const;

const formatScore = (value: number | Date) => `${value}/10`;

export function Example() {
  return (
    <ScatterChart
      values={initiatives}
      xLabel="Effort"
      yLabel="Impact"
      formatX={formatScore}
      formatY={formatScore}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Initiative impact and effort
      </ChartTitle>
      <ScatterChartPlot
        aria-label="Scatter chart comparing initiative impact and effort"
        xMin={0}
        xMax={10}
        yMin={0}
        yMax={10}
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(point) => (
          <ScatterChartPoint key={point.index} point={point} className="group outline-none">
            <circle cx={point.x} cy={point.y} r="5" className="fill-transparent" />
            <circle
              cx={point.x}
              cy={point.y}
              r="2.4"
              className="fill-teal-600 stroke-transparent group-data-active:stroke-zinc-950 dark:fill-teal-400 dark:group-data-active:stroke-white"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </ScatterChartPoint>
        )}
      </ScatterChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Search offers high impact for low effort; reporting is the least favorable tradeoff.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Initiative impact and effort values</caption>
        <thead>
          <tr>
            <th scope="col">Initiative</th>
            <th scope="col">Effort</th>
            <th scope="col">Impact</th>
          </tr>
        </thead>
        <tbody>
          {initiatives.map((initiative) => (
            <tr key={initiative.label}>
              <th scope="row">{initiative.label}</th>
              <td>{formatScore(initiative.x)}</td>
              <td>{formatScore(initiative.y)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </ScatterChart>
  );
}
