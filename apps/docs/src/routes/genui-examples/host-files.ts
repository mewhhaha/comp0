import print from "../../examples/genui/gallery/PrintProof.tsx?raw";
import seating from "../../examples/genui/gallery/SeatingPlan.tsx?raw";
import recording from "./recording.server.tsx?raw";
import museum from "./MuseumDisplay.tsx?raw";
import ballot from "./JsonExample.tsx?raw";
import timetable from "./station.server.tsx?raw";
import tools from "./shop-tools.ts?raw";

export const hostFiles = new Map<string, [string, string]>([
  ["print-proof", ["PrintProof.tsx", print]],
  ["listening-room", ["SeatingPlan.tsx", seating]],
  ["encore", ["recording.server.tsx", recording]],
  ["night-train", ["station.server.tsx", timetable]],
  ["museum-label", ["MuseumDisplay.tsx", museum]],
  ["repair-desk", ["shop-tools.ts", tools]],
  ["record-crates", ["shop-tools.ts", tools]],
  ["screening-ballot", ["JsonExample.tsx", ballot]],
]);
