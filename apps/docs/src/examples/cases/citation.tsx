import { Citation, Citations, Source, Sources } from "@comp0/react";

export function Example() {
  return (
    <Citations as="div" className="flex max-w-md flex-col gap-4">
      <p className="text-base text-zinc-800 sm:text-sm dark:text-zinc-200">
        High-altitude tea grows slowly, which concentrates its flavor
        <Citation
          className="mx-0.5 align-super text-xs font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          value="atlas"
        />
        . Lowland estates trade that depth for yield
        <Citation
          className="mx-0.5 align-super text-xs font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          value="farms"
        />
        , and both methods are widely used
        <Citation
          className="mx-0.5 align-super text-xs font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-300"
          value="atlas"
        />
        .
      </p>
      <Sources
        aria-label="Sources"
        className="list-decimal space-y-1 pl-5 text-base text-zinc-600 marker:text-zinc-400 sm:text-sm dark:text-zinc-400"
      >
        <Source
          className="target:text-zinc-950 dark:target:text-white"
          href="https://example.com/tea-atlas"
          title="The World Tea Atlas"
          value="atlas"
        >
          {" "}
          Atlas Press, 2023
        </Source>
        <Source
          className="target:text-zinc-950 dark:target:text-white"
          href="https://example.com/lowland-farms"
          title="Lowland Farms Survey"
          value="farms"
        >
          {" "}
          Journal of Agriculture, 2024
        </Source>
      </Sources>
    </Citations>
  );
}
