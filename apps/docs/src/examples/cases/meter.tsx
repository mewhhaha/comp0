import { Label } from "@comp0/react";
import { Meter } from "@comp0/react";

export function Example() {
  return (
    <div className="flex max-w-xs flex-col gap-2">
      <Label
        id="storage-meter-label"
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
      >
        Storage used
      </Label>
      <Meter
        id="storage-meter"
        value={64}
        min={0}
        max={100}
        low={50}
        high={85}
        optimum={25}
        aria-labelledby="storage-meter-label"
        className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <span className="block h-full w-[calc(var(--comp0-meter-value)*100%)] rounded-full bg-teal-700 transition-[width] dark:bg-teal-400" />
      </Meter>
      <p className="text-base text-zinc-600 tabular-nums sm:text-sm dark:text-zinc-400">
        64 GB of 100 GB
      </p>
    </div>
  );
}
