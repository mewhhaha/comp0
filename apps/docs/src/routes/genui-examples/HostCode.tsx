import { CodeBlock } from "../../components/teaching/CodeBlock.js";
import print from "../../examples/genui/gallery/PrintProof.tsx?raw";
import seating from "../../examples/genui/gallery/SeatingPlan.tsx?raw";
import recording from "./recording.server.tsx?raw";
import museum from "./MuseumDisplay.tsx?raw";
import ballot from "./JsonExample.tsx?raw";
import timetable from "./station.server.tsx?raw";
import tools from "./shop-tools.ts?raw";

const files = new Map<string, [string, string]>([
  ["print-proof", ["PrintProof.tsx", print]],
  ["listening-room", ["SeatingPlan.tsx", seating]],
  ["encore", ["recording.server.tsx", recording]],
  ["night-train", ["station.server.tsx", timetable]],
  ["museum-label", ["MuseumDisplay.tsx", museum]],
  ["repair-desk", ["shop-tools.ts", tools]],
  ["record-crates", ["shop-tools.ts", tools]],
  ["screening-ballot", ["JsonExample.tsx", ballot]],
]);

type HostCodeProps = { slug: string };
export function HostCode({ slug }: HostCodeProps) {
  const file = files.get(slug);
  if (!file) return null;
  return (
    <details className="min-w-0">
      <summary className="w-fit cursor-pointer py-2 text-lg font-semibold">
        Host implementation
      </summary>
      <CodeBlock title={file[0]} code={file[1].trimEnd()} className="mt-3" />
    </details>
  );
}
