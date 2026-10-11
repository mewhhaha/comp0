"use client";

import { useGenUIValue } from "@comp0/genui/rsc/client";

function show(value: unknown) {
  return value === undefined ? "–" : String(value);
}

/** A host component outside every view, reading the values the model's controls write. */
export function LiveValues() {
  const city = useGenUIValue("city");
  const speed = useGenUIValue("speed");
  const hue = useGenUIValue("hue");
  return (
    <dl className="grid grid-cols-3 gap-4 rounded-xl border border-zinc-950/10 p-4 text-sm/6 dark:border-white/10">
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">City</dt>
        <dd className="font-medium text-zinc-950 dark:text-white">{show(city)}</dd>
      </div>
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Speed</dt>
        <dd className="font-medium text-zinc-950 dark:text-white">{show(speed)}</dd>
      </div>
      <div>
        <dt className="text-zinc-500 dark:text-zinc-400">Hue</dt>
        <dd className="font-medium text-zinc-950 dark:text-white">{show(hue)}</dd>
      </div>
    </dl>
  );
}
