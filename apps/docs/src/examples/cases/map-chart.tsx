import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  MapChart,
  MapChartPlot,
  MapChartRegion,
} from "@comp0/react";

const electionRegions = [
  { id: "west", label: "West — Democratic", value: 54 },
  { id: "southwest", label: "Southwest — Republican", value: 40 },
  { id: "midwest", label: "Midwest — Republican", value: 58 },
  { id: "south", label: "South — Republican", value: 74 },
  { id: "southeast", label: "Southeast — Democratic", value: 45 },
  { id: "northeast", label: "Northeast — Democratic", value: 80 },
] as const;

const americaOutline =
  "M 4 12 L 9 8 L 24 10 L 42 9 L 57 10 L 65 9 L 78 8 L 88 10 L 94 15 L 96 20 L 94 27 L 91 31 L 93 36 L 91 43 L 89 48 L 89 53 L 94 57 L 87 58 L 82 54 L 76 52 L 68 54 L 58 56 L 50 54 L 41 57 L 32 54 L 24 46 L 18 44 C 14 40 11 35 8 29 L 5 22 Z";

const electionGeometry = [
  {
    id: "west",
    d: "M 4 12 L 9 8 L 24 10 L 31 23 L 27 32 L 24 39 L 24 46 L 18 44 C 14 40 11 35 8 29 L 5 22 Z",
    centerX: 14.5,
    centerY: 26,
  },
  {
    id: "southwest",
    d: "M 27 32 L 36 29 L 43 31 L 49 42 L 50 54 L 41 57 L 32 54 L 24 46 L 24 39 Z",
    centerX: 34,
    centerY: 46.5,
  },
  {
    id: "midwest",
    d: "M 24 10 L 42 9 L 57 10 L 65 14 L 67 21 L 66 30 L 57 31 L 50 38 L 43 31 L 36 29 L 27 32 L 31 23 Z",
    centerX: 53.5,
    centerY: 23.5,
  },
  {
    id: "south",
    d: "M 43 31 L 50 38 L 57 31 L 66 30 L 73 36 L 77 43 L 74 50 L 68 54 L 58 56 L 50 54 L 49 42 Z",
    centerX: 55.5,
    centerY: 46.5,
  },
  {
    id: "southeast",
    d: "M 66 30 L 79 29 L 88 31 L 93 36 L 91 43 L 89 48 L 89 53 L 94 57 L 87 58 L 82 54 L 76 52 L 68 54 L 74 50 L 77 43 L 73 36 Z",
    centerX: 79.5,
    centerY: 41.5,
  },
  {
    id: "northeast",
    d: "M 65 9 L 78 8 L 88 10 L 94 15 L 96 20 L 94 27 L 91 31 L 88 31 L 79 29 L 66 30 L 67 21 L 65 14 Z",
    centerX: 80,
    centerY: 19.5,
  },
] as const;

const partyOf = (label: string) => (label.includes("Democratic") ? "democratic" : "republican");
const formatVotes = (value: number) => `${value} electoral votes`;

export function Example() {
  return (
    <MapChart
      values={electionRegions}
      regionLabel="US region"
      valueLabel="Electoral votes"
      formatValue={formatVotes}
      className="w-full max-w-2xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Electoral map by region
      </ChartTitle>
      <MapChartPlot
        aria-label="Map of regional electoral votes by party"
        viewBox="0 0 100 65"
        regions={electionGeometry}
        className="mx-auto mt-5 aspect-[100/65] w-full max-w-xl overflow-visible"
      >
        {(region) => {
          const party = partyOf(region.value.label);
          return (
            <>
              {region.index === 0 && (
                <path
                  aria-hidden="true"
                  d={americaOutline}
                  fill="none"
                  className="stroke-zinc-500 dark:stroke-zinc-400"
                  pointerEvents="none"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <MapChartRegion region={region} data-party={party} className="group outline-none">
                <path
                  d={region.region.d}
                  className="fill-teal-100 stroke-teal-700 group-data-[party=democratic]:fill-teal-200 group-data-[party=democratic]:stroke-teal-800 group-data-[party=republican]:fill-rose-100 group-data-[party=republican]:stroke-rose-700 group-data-active:stroke-zinc-950 dark:fill-teal-950 dark:stroke-teal-300 dark:group-data-[party=democratic]:fill-teal-900 dark:group-data-[party=democratic]:stroke-teal-200 dark:group-data-[party=republican]:fill-rose-950 dark:group-data-[party=republican]:stroke-rose-300 dark:group-data-active:stroke-white"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={region.region.centerX}
                  y={region.region.centerY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-zinc-950 text-[3px] font-semibold dark:fill-white"
                >
                  {party === "democratic" ? "D" : "R"}
                </text>
              </MapChartRegion>
            </>
          );
        }}
      </MapChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        A simplified U.S. outline keeps regional party labels visible, while the table keeps every
        exact vote total available.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Regional electoral vote totals</caption>
        <thead>
          <tr>
            <th scope="col">Region</th>
            <th scope="col">Party</th>
            <th scope="col">Electoral votes</th>
          </tr>
        </thead>
        <tbody>
          {electionRegions.map((region) => (
            <tr key={region.id}>
              <th scope="row">{region.label.split(" — ")[0]}</th>
              <td>{region.label.split(" — ")[1]}</td>
              <td>{formatVotes(region.value)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </MapChart>
  );
}
