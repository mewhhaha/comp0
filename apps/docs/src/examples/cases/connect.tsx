import {
  Connect,
  ConnectCard,
  ConnectDisconnect,
  ConnectInput,
  ConnectInputSelect,
  ConnectInputTrigger,
  ConnectLines,
  ConnectOutput,
} from "@comp0/react";

export function Example() {
  return (
    <div>
      <p className="mb-5 text-sm/6 text-zinc-600 dark:text-zinc-400">
        Click an output, then a matching input, or choose a source from its menu. You can also drag
        between ports.
      </p>
      <Connect
        aria-label="Color connections"
        defaultValue={[{ from: "bronze", to: "surface" }]}
        className="relative grid gap-10 sm:grid-cols-2 sm:gap-20"
      >
        <ConnectLines className="text-teal-600 dark:text-teal-400" />
        <ConnectCard
          value="palette"
          label="Palette"
          className="relative min-w-0 rounded-xl border border-zinc-200 bg-white p-4 outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:bg-zinc-900 dark:outline-teal-400"
        >
          <legend className="px-2 text-sm font-semibold">Palette</legend>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">Color outputs</p>
          <div className="grid gap-3">
            {[
              { value: "bronze", label: "Bronze", color: "#a87946" },
              { value: "jade", label: "Jade", color: "#158568" },
            ].map((color) => (
              <ConnectOutput
                key={color.value}
                value={color.value}
                label={color.label}
                kind="color"
                className="flex min-h-10 items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-teal-600 hover:bg-zinc-50 focus-visible:outline-2 data-selected:border-teal-600 data-selected:ring-2 data-selected:ring-teal-600 dark:border-zinc-700 dark:outline-teal-400 dark:hover:bg-zinc-800"
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-4 rounded"
                    style={{ background: color.color }}
                  />
                  {color.label}
                </span>
                <span aria-hidden="true">○</span>
              </ConnectOutput>
            ))}
          </div>
        </ConnectCard>
        <ConnectCard
          value="material"
          label="Material"
          className="relative min-w-0 rounded-xl border border-zinc-200 bg-white p-4 outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:bg-zinc-900 dark:outline-teal-400"
        >
          <legend className="px-2 text-sm font-semibold">Material</legend>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">Color input</p>
          <ConnectInput value="surface" label="Surface" kind="color" className="grid gap-3">
            <ConnectInputTrigger className="flex min-h-10 items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-teal-600 focus-visible:outline-2 data-available:border-teal-600 data-available:ring-2 data-available:ring-teal-600 dark:border-zinc-700 dark:outline-teal-400">
              <span aria-hidden="true">○</span>Surface
            </ConnectInputTrigger>
            <ConnectInputSelect className="min-h-10 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:bg-zinc-900 dark:outline-teal-400" />
            <ConnectDisconnect className="min-h-9 justify-self-start rounded px-2 text-xs font-medium text-zinc-600 outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 disabled:opacity-40 dark:text-zinc-400 dark:outline-teal-400 dark:hover:bg-zinc-800">
              Disconnect
            </ConnectDisconnect>
          </ConnectInput>
        </ConnectCard>
      </Connect>
    </div>
  );
}
