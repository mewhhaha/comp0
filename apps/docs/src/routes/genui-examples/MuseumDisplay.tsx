import { createRenderer, hole, type ResponseSource } from "@comp0/genui/rsc";
import { contracts } from "../../examples/genui/gallery/contracts.js";

const museum = createRenderer(contracts["museum-label"]);
const display = museum.holes({
  label: hole(
    contracts["museum-label"].vocabulary.only("Heading", "Text"),
    "Identify the object, then give its provenance.",
    { max: 3 },
  ),
  notes: hole(
    contracts["museum-label"].vocabulary.only("Disclosure", "Text"),
    "Give a conservator’s note about a detail of the object in a disclosure.",
    { max: 1 },
  ),
});

type MuseumDisplayProps = { source: ResponseSource };
export function MuseumDisplay({ source }: MuseumDisplayProps) {
  const panels = display.fill(source);
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="grid content-start gap-3 border-l-4 border-amber-600 px-4">
        <panels.label />
      </div>
      <div className="border-t border-zinc-300 pt-4 dark:border-zinc-700">
        <panels.notes />
      </div>
    </div>
  );
}
