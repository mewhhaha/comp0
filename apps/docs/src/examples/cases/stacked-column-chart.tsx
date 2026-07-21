import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  StackedColumnChart,
  StackedColumnChartPlot,
  StackedColumnChartSegment,
} from "@comp0/react";

const signups = [
  {
    label: "Q1",
    segments: [
      { label: "Free", value: 44 },
      { label: "Pro", value: 18 },
    ],
  },
  {
    label: "Q2",
    segments: [
      { label: "Free", value: 52 },
      { label: "Pro", value: 24 },
    ],
  },
  {
    label: "Q3",
    segments: [
      { label: "Free", value: 49 },
      { label: "Pro", value: 31 },
    ],
  },
  {
    label: "Q4",
    segments: [
      { label: "Free", value: 61 },
      { label: "Pro", value: 38 },
    ],
  },
] as const;

const colors = [
  "bg-violet-600 fill-violet-600 dark:bg-violet-400 dark:fill-violet-400",
  "bg-amber-500 fill-amber-500 dark:bg-amber-400 dark:fill-amber-400",
] as const;

const formatSignups = (value: number) => `${value}k`;

export function Example() {
  return (
    <StackedColumnChart
      values={signups}
      categoryLabel="Quarter"
      valueLabel="Signups"
      formatValue={formatSignups}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-violet-600 dark:has-[:focus-visible]:outline-violet-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Signups by plan
      </ChartTitle>
      <div className="mt-3 flex gap-4 text-sm">
        {signups[0].segments.map((segment, index) => (
          <span key={segment.label} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-3 rounded-sm ${colors[index]}`} />
            {segment.label}
          </span>
        ))}
      </div>
      <StackedColumnChartPlot
        aria-label="Stacked column chart showing quarterly signups by plan"
        className="mx-auto mt-5 aspect-square w-full max-w-md overflow-visible"
      >
        {(segment) => (
          <StackedColumnChartSegment
            key={`${segment.value.label}-${segment.segment.label}`}
            segment={segment}
            className="group outline-none"
          >
            <rect
              x={segment.x}
              y={segment.y}
              width={segment.width}
              height={segment.height}
              className={`${colors[segment.segmentIndex]} stroke-transparent group-data-active:stroke-zinc-950 dark:group-data-active:stroke-white`}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </StackedColumnChartSegment>
        )}
      </StackedColumnChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Total signups peaked in the fourth quarter, with Pro accounting for a growing share.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Quarterly signups by plan</caption>
        <thead>
          <tr>
            <th scope="col">Quarter</th>
            <th scope="col">Free</th>
            <th scope="col">Pro</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {signups.map((quarter) => (
            <tr key={quarter.label}>
              <th scope="row">{quarter.label}</th>
              {quarter.segments.map((segment) => (
                <td key={segment.label}>{formatSignups(segment.value)}</td>
              ))}
              <td>
                {formatSignups(quarter.segments.reduce((sum, segment) => sum + segment.value, 0))}
              </td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </StackedColumnChart>
  );
}
