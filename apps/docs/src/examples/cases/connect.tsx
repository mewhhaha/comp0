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
    <div className="mx-auto w-full max-w-xs">
      <p className="mb-6 text-sm/6 text-zinc-600 dark:text-zinc-400">
        Tap a circle, then the square. Or drag between them.
      </p>
      <Connect
        aria-label="Flower connections"
        defaultValue={[{ from: "sun", to: "flower" }]}
        className="relative grid grid-cols-2 gap-12"
      >
        <ConnectLines className="text-teal-600 dark:text-teal-400" strokeWidth={3} />
        <ConnectCard
          value="weather"
          label="Weather"
          className="relative grid min-w-0 content-start justify-items-center gap-6 border-0 p-0 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
        >
          <legend className="sr-only">Weather</legend>
          {[
            { value: "sun", label: "Sun", emoji: "☀️" },
            { value: "rain", label: "Rain", emoji: "🌧️" },
          ].map((weather) => (
            <ConnectOutput
              key={weather.value}
              value={weather.value}
              label={weather.label}
              kind="weather"
              className="grid size-14 place-items-center rounded-full border-2 border-amber-300 bg-amber-50 text-3xl outline-teal-600 focus-visible:outline-2 focus-visible:outline-offset-4 data-selected:border-teal-600 data-selected:ring-4 data-selected:ring-teal-600/20 dark:border-amber-700 dark:bg-amber-950 dark:outline-teal-400"
            >
              <span aria-hidden="true">{weather.emoji}</span>
            </ConnectOutput>
          ))}
        </ConnectCard>
        <ConnectCard
          value="garden"
          label="Garden"
          className="relative min-w-0 border-0 pt-10 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
        >
          <legend className="sr-only">Garden</legend>
          <ConnectInput
            value="flower"
            label="Flower"
            kind="weather"
            className="grid justify-items-center gap-4"
          >
            <ConnectInputTrigger className="grid size-14 place-items-center rounded-2xl border-2 border-teal-300 bg-teal-50 text-3xl outline-teal-600 focus-visible:outline-2 focus-visible:outline-offset-4 data-available:border-teal-600 data-available:ring-4 data-available:ring-teal-600/20 dark:border-teal-700 dark:bg-teal-950 dark:outline-teal-400">
              <span aria-hidden="true">🌻</span>
            </ConnectInputTrigger>
            <details className="w-full min-w-0 text-sm text-zinc-600 dark:text-zinc-400">
              <summary className="min-h-11 cursor-pointer rounded py-3 text-center outline-teal-600 focus-visible:outline-2 dark:outline-teal-400">
                Source
              </summary>
              <ConnectInputSelect className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-1 text-base outline-teal-600 focus-visible:outline-2 dark:border-zinc-700 dark:bg-zinc-900 dark:outline-teal-400" />
              <ConnectDisconnect className="mt-2 min-h-11 w-full rounded px-1 text-sm outline-teal-600 focus-visible:outline-2 disabled:opacity-40 dark:outline-teal-400">
                Disconnect
              </ConnectDisconnect>
            </details>
          </ConnectInput>
        </ConnectCard>
      </Connect>
    </div>
  );
}
