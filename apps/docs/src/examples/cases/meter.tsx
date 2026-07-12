import { Label } from "@comp0/react";
import { Meter } from "../../../../../packages/react/src/status.js";

export function Example() {
  return (
    <div className="flex max-w-xs flex-col gap-2">
      <Label
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
        htmlFor="storage-meter"
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
        className="h-4 w-full"
      />
      <p className="text-base text-zinc-600 tabular-nums sm:text-sm dark:text-zinc-400">
        64 GB of 100 GB
      </p>
    </div>
  );
}
