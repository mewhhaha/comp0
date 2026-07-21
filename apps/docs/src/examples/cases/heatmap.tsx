import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  Heatmap,
  HeatmapCell,
  HeatmapPlot,
} from "@comp0/react";

const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10"] as const;
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const contributionCounts = [
  [0, 1, 3, 2, 0, 0, 0],
  [1, 4, 6, 3, 2, 0, 0],
  [0, 2, 5, 7, 4, 1, 0],
  [2, 6, 9, 5, 3, 0, 1],
  [1, 3, 8, 11, 6, 2, 0],
  [4, 8, 12, 9, 7, 1, 0],
  [3, 7, 10, 13, 8, 2, 1],
  [1, 5, 8, 6, 4, 0, 0],
  [0, 3, 5, 4, 2, 1, 0],
  [2, 4, 7, 5, 3, 0, 0],
] as const;
const contributions = weeks.flatMap((week, weekIndex) =>
  weekdays.map((weekday, weekdayIndex) => ({
    x: week,
    y: weekday,
    value: contributionCounts[weekIndex]![weekdayIndex]!,
  })),
);

const formatContributions = (value: number) =>
  value === 1 ? "1 contribution" : `${value} contributions`;

function contributionColor(value: number) {
  if (value >= 10) {
    return "fill-emerald-800 bg-emerald-800 dark:fill-emerald-300 dark:bg-emerald-300";
  }
  if (value >= 7) {
    return "fill-emerald-600 bg-emerald-600 dark:fill-emerald-500 dark:bg-emerald-500";
  }
  if (value >= 4) {
    return "fill-emerald-400 bg-emerald-400 dark:fill-emerald-700 dark:bg-emerald-700";
  }
  if (value >= 1) {
    return "fill-emerald-200 bg-emerald-200 dark:fill-emerald-900 dark:bg-emerald-900";
  }
  return "fill-zinc-100 bg-zinc-100 dark:fill-zinc-800 dark:bg-zinc-800";
}

export function Example() {
  return (
    <Heatmap
      values={contributions}
      xLabel="Week"
      yLabel="Weekday"
      valueLabel="Contributions"
      formatValue={formatContributions}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-emerald-600 dark:has-[:focus-visible]:outline-emerald-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Contribution activity
      </ChartTitle>
      <HeatmapPlot
        aria-label="Contribution heatmap by weekday and week"
        className="mx-auto mt-5 aspect-square w-full max-w-lg overflow-visible"
      >
        {(cell) => (
          <HeatmapCell
            key={`${cell.value.x}-${cell.value.y}`}
            cell={cell}
            className="group outline-none"
          >
            <rect
              x={cell.x + 1}
              y={cell.y + 1}
              width={Math.max(0, cell.width - 2)}
              height={Math.max(0, cell.height - 2)}
              rx="1.5"
              className={`${contributionColor(cell.value.value)} stroke-transparent group-data-active:stroke-zinc-950 dark:group-data-active:stroke-white`}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </HeatmapCell>
        )}
      </HeatmapPlot>
      <div
        aria-label="Contribution intensity"
        className="mt-3 flex items-center justify-end gap-1 text-xs text-zinc-600 dark:text-zinc-400"
      >
        <span>Less</span>
        {[0, 2, 5, 8, 12].map((value) => (
          <span
            key={value}
            aria-hidden="true"
            className={`size-3 rounded-[2px] ${contributionColor(value)}`}
          />
        ))}
        <span>More</span>
      </div>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Activity peaks in weeks 6 and 7, with most contributions landing on weekdays.
      </ChartDescription>
      <div className="mt-4 overflow-x-auto">
        <ChartTable className="w-full min-w-[36rem] border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
          <caption className="sr-only">Contributions by weekday and week</caption>
          <thead>
            <tr>
              <th scope="col">Weekday</th>
              {weeks.map((week) => (
                <th key={week} scope="col">
                  {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekdays.map((weekday, weekdayIndex) => (
              <tr key={weekday}>
                <th scope="row">{weekday}</th>
                {weeks.map((week, weekIndex) => (
                  <td key={week}>{contributionCounts[weekIndex]![weekdayIndex]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </ChartTable>
      </div>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </Heatmap>
  );
}
