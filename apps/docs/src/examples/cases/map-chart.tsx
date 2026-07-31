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

const electionGeometry = [
  { id: "west", d: "M 4 10 H 25 V 42 H 4 Z", centerX: 14.5, centerY: 26 },
  { id: "southwest", d: "M 25 37 H 43 V 56 H 25 Z", centerX: 34, centerY: 46.5 },
  { id: "midwest", d: "M 43 10 H 64 V 37 H 43 Z", centerX: 53.5, centerY: 23.5 },
  { id: "south", d: "M 43 37 H 68 V 56 H 43 Z", centerX: 55.5, centerY: 46.5 },
  { id: "southeast", d: "M 68 31 H 91 V 52 H 68 Z", centerX: 79.5, centerY: 41.5 },
  { id: "northeast", d: "M 64 8 H 96 V 31 H 64 Z", centerX: 80, centerY: 19.5 },
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
          );
        }}
      </MapChartPlot>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Regional party labels remain visible in the map, while the table keeps every exact vote
        total available.
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
