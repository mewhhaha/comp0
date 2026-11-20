import { createRenderer } from "@comp0/genui/rsc";
import type { ReactNode } from "react";
import {
  contracts,
  hasComposition,
  printProof,
  seatingPlan,
  type CompositionSlug,
} from "../../examples/genui/gallery/contracts.js";
import type { GalleryExample, RecordedTurn } from "../../examples/genui/gallery/examples.js";
import { PrintProof } from "../../examples/genui/gallery/PrintProof.js";
import { SeatingPlan } from "../../examples/genui/gallery/SeatingPlan.js";
import { replay } from "../../examples/genui/replay.js";
import { MuseumDisplay } from "./MuseumDisplay.js";
import { station } from "./station.server.js";

export type RecordedReply = { text: AsyncIterable<string> } & (
  | { view: ReactNode }
  | { json: AsyncIterable<string> }
);

function rendererFor(slug: CompositionSlug) {
  if (slug === "night-train") return station;
  if (slug === "print-proof")
    return createRenderer(contracts[slug], printProof.implement(PrintProof));
  if (slug === "listening-room")
    return createRenderer(contracts[slug], seatingPlan.implement(SeatingPlan));
  return createRenderer(contracts[slug]);
}

/** Independent streams let an opening tag render while the introduction is still arriving. */
export function recordedReply(
  example: GalleryExample,
  turn: RecordedTurn,
  signal: AbortSignal,
): RecordedReply {
  const text = replay(turn.reply, signal, 32);
  const source = replay(turn.source, signal);
  if (example.format === "json") {
    return { text, json: source };
  }
  if (example.slug === "museum-label") {
    return { text, view: <MuseumDisplay source={source} /> };
  }
  if (!hasComposition(example.slug)) throw new Error("Missing composition: " + example.slug);
  const renderer = rendererFor(example.slug);
  let view = <renderer.View source={source} />;
  if (turn === example.followUp)
    view = <renderer.View source={source} history={[example.source]} turn="band-encore" />;
  return { text, view };
}
