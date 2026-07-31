import {
  ChartDescription,
  ChartTable,
  ChartTitle,
  ChartTooltip,
  MapChart,
  MapChartPlot,
  MapChartRegion,
} from "@comp0/react";
import { usStateGeometry, type UsStateId } from "../data/us-state-geometry.js";

const democraticStateIds: readonly UsStateId[] = [
  "az",
  "ca",
  "co",
  "ct",
  "de",
  "hi",
  "il",
  "ma",
  "md",
  "me",
  "mi",
  "mn",
  "nv",
  "nh",
  "nj",
  "nm",
  "ny",
  "or",
  "ri",
  "va",
  "vt",
  "wa",
  "wi",
];

const stateElectoralVotes: Record<UsStateId, number> = {
  al: 9,
  ak: 3,
  az: 11,
  ar: 6,
  ca: 54,
  co: 10,
  ct: 7,
  de: 3,
  fl: 30,
  ga: 16,
  hi: 4,
  id: 4,
  il: 19,
  in: 11,
  ia: 6,
  ks: 6,
  ky: 8,
  la: 8,
  me: 4,
  md: 10,
  ma: 11,
  mi: 15,
  mn: 10,
  ms: 6,
  mo: 10,
  mt: 4,
  ne: 5,
  nv: 6,
  nh: 4,
  nj: 14,
  nm: 5,
  ny: 28,
  nc: 16,
  nd: 3,
  oh: 17,
  ok: 7,
  or: 8,
  pa: 19,
  ri: 4,
  sc: 9,
  sd: 3,
  tn: 11,
  tx: 40,
  ut: 6,
  vt: 3,
  va: 13,
  wa: 12,
  wv: 4,
  wi: 10,
  wy: 3,
};

const partyOf = (stateId: string) =>
  democraticStateIds.some((candidate) => candidate === stateId) ? "Democratic" : "Republican";

const electionStates = usStateGeometry.map((state) => ({
  id: state.id,
  label: `${state.name} — ${partyOf(state.id)}`,
  value: stateElectoralVotes[state.id],
}));

const formatVotes = (value: number) => `${value} electoral votes`;

export function Example() {
  return (
    <MapChart
      values={electionStates}
      regionLabel="US state"
      valueLabel="Electoral votes"
      formatValue={formatVotes}
      className="w-full max-w-3xl rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-teal-600 dark:has-[:focus-visible]:outline-teal-400"
    >
      <ChartTitle className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
        Illustrative electoral map by state
      </ChartTitle>
      <MapChartPlot
        aria-label="Map of illustrative state electoral votes by party"
        viewBox="0 0 959 593"
        regions={usStateGeometry}
        className="mx-auto mt-5 aspect-[959/593] w-full max-w-2xl overflow-visible"
      >
        {(region) => {
          const party = partyOf(region.value.id);
          return (
            <>
              {region.index === 0 && (
                <defs>
                  <pattern
                    id="map-party-democratic"
                    width="7"
                    height="7"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="7" height="7" className="fill-teal-100 dark:fill-teal-950" />
                    <path
                      d="M-2 2L2 -2M0 7L7 0M5 9L9 5"
                      className="stroke-teal-700 dark:stroke-teal-300"
                      strokeWidth="1.5"
                    />
                  </pattern>
                  <pattern
                    id="map-party-republican"
                    width="7"
                    height="7"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect width="7" height="7" className="fill-rose-100 dark:fill-rose-950" />
                    <circle cx="2" cy="2" r="1" className="fill-rose-700 dark:fill-rose-300" />
                    <circle cx="5" cy="5" r="1" className="fill-rose-700 dark:fill-rose-300" />
                  </pattern>
                </defs>
              )}
              <MapChartRegion
                region={region}
                data-party={party.toLowerCase()}
                className="group outline-none"
              >
                <path
                  d={region.region.d}
                  fill={`url(#map-party-${party.toLowerCase()})`}
                  className="stroke-teal-700 group-data-[party=democratic]:stroke-teal-800 group-data-[party=republican]:stroke-rose-700 group-data-active:stroke-zinc-950 group-data-active:[stroke-width:3] dark:stroke-teal-300 dark:group-data-[party=democratic]:stroke-teal-200 dark:group-data-[party=republican]:stroke-rose-300 dark:group-data-active:stroke-white"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </MapChartRegion>
            </>
          );
        }}
      </MapChartPlot>
      <ul
        aria-label="Party color key"
        className="mt-3 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm text-zinc-700 dark:text-zinc-300"
      >
        <li className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            viewBox="0 0 7 7"
            className="size-3 rounded-sm ring-1 ring-teal-800"
          >
            <rect width="7" height="7" className="fill-teal-100 dark:fill-teal-950" />
            <path
              d="M-2 2L2 -2M0 7L7 0M5 9L9 5"
              className="stroke-teal-700 dark:stroke-teal-300"
              strokeWidth="1.5"
            />
          </svg>
          Democratic (diagonal)
        </li>
        <li className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            viewBox="0 0 7 7"
            className="size-3 rounded-sm ring-1 ring-rose-700"
          >
            <rect width="7" height="7" className="fill-rose-100 dark:fill-rose-950" />
            <circle cx="2" cy="2" r="1" className="fill-rose-700 dark:fill-rose-300" />
            <circle cx="5" cy="5" r="1" className="fill-rose-700 dark:fill-rose-300" />
          </svg>
          Republican (dots)
        </li>
      </ul>
      <ChartDescription className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
        Every state uses its own path from the CC0 Wikimedia Commons map; party assignments are
        illustrative, and the table keeps each state&apos;s electoral-vote weight available.
      </ChartDescription>
      <ChartTable className="mt-4 w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-zinc-200 [&_td]:py-2 [&_th]:border-zinc-200 [&_th]:py-2 dark:[&_td]:border-zinc-800 dark:[&_th]:border-zinc-800">
        <caption className="sr-only">Illustrative state electoral vote totals</caption>
        <thead>
          <tr>
            <th scope="col">State</th>
            <th scope="col">Party</th>
            <th scope="col">Electoral votes</th>
          </tr>
        </thead>
        <tbody>
          {electionStates.map((state) => (
            <tr key={state.id}>
              <th scope="row">{state.label.split(" — ")[0]}</th>
              <td>{state.label.split(" — ")[1]}</td>
              <td>{formatVotes(state.value)}</td>
            </tr>
          ))}
        </tbody>
      </ChartTable>
      <ChartTooltip className="pointer-events-none z-50 rounded-md bg-zinc-950 px-2 py-1 text-sm text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-950" />
    </MapChart>
  );
}
