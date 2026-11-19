import { createRenderer, serverComponent } from "@comp0/genui/rsc";
import { contracts, departures } from "../../examples/genui/gallery/contracts.js";

const timetable = {
  Harbour: [
    ["22:18", "East Quay", "2"],
    ["22:46", "Ferry Steps", "4"],
    ["23:12", "East Quay", "2"],
  ],
  Forest: [
    ["21:55", "Birch End", "3"],
    ["22:20", "Pine Ridge", "3"],
    ["22:58", "Birch End", "1"],
  ],
  Quarry: [
    ["22:05", "Kiln Lane", "5"],
    ["22:35", "Slate Yard", "5"],
    ["23:01", "Kiln Lane", "6"],
  ],
};

export const station = createRenderer(
  contracts["night-train"],
  serverComponent(departures, async ({ line }) => (
    <table className="w-full border-collapse text-left tabular-nums">
      <caption className="pb-3 text-left text-lg font-semibold">{line} line departures</caption>
      <thead>
        <tr>
          {["Departs", "Destination", "Platform"].map((label) => (
            <th key={label} scope="col" className="py-2">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {timetable[line].map(([time, stop, platform]) => (
          <tr key={time} className="border-t border-zinc-300 dark:border-zinc-700">
            <th scope="row" className="py-2 font-mono">
              {time}
            </th>
            <td>{stop}</td>
            <td>{platform}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )),
);
