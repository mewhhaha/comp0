import { defineTool } from "@comp0/genui/rsc";
import { type } from "arktype";

const repairs = new Map([
  ["R-104", "R-104 · Cassette deck. New belt fitted, ready for collection."],
  ["R-117", "R-117 · Turntable. Waiting for a replacement stylus."],
]);
const crates = {
  Ambient: [
    ["Soft Index", "LP", 3],
    ["North Window", "Cassette", 2],
  ],
  Dub: [
    ["Delay Atlas", "12-inch", 4],
    ["Version Room", "7-inch", 1],
  ],
  Disco: [
    ["Second Mirror", "12-inch", 2],
    ["Night Receipt", "LP", 5],
  ],
};

export const tools = {
  repairStatus: defineTool({
    description: "Look up a demonstration repair ticket.",
    input: type({ ticket: "0 < string <= 40" }),
    run: async ({ ticket }) =>
      repairs.get(ticket.trim().toUpperCase()) ?? "No repair found for that ticket.",
  }),
  crateInventory: defineTool({
    description: "List demonstration stock in one named record crate.",
    input: type({ crate: "'Ambient' | 'Dub' | 'Disco'" }),
    run: async ({ crate }) => crates[crate],
  }),
};
