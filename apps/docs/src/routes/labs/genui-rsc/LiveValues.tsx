"use client";

import { useGenUIValue } from "@comp0/genui/rsc/client";
import { labState } from "./contract.js";

/** A host component outside every view, reading the values the model's controls write. */
export function LiveValues() {
  const city = useGenUIValue(labState, "city");
  const speed = useGenUIValue(labState, "speed");
  const hue = useGenUIValue(labState, "hue");
  return (
    <dl className="grid grid-cols-3 gap-4 rounded-xl border border-zinc-950/10 p-4 text-sm/6 dark:border-white/10">
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">City</dt>
        <dd className="font-medium text-zinc-950 dark:text-white">{city}</dd>
      </div>
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Speed</dt>
        <dd className="font-medium text-zinc-950 dark:text-white">{speed}</dd>
      </div>
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Hue</dt>
        <dd className="font-medium text-zinc-950 dark:text-white">{hue}</dd>
      </div>
    </dl>
  );
}
