import { Description, Label, TextField } from "@comp0/react";
import { DateField, TimeField } from "@comp0/react";

export function Example() {
  return (
    <div className="flex max-w-xs flex-col gap-6">
      <TextField as="div" className="flex flex-col gap-1.5">
        <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          Departure date
        </Label>
        <DateField
          className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          name="departure"
          min="2026-07-01"
          max="2026-08-31"
        />
        <Description className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Trips run in July and August.
        </Description>
      </TextField>
      <TextField as="div" className="flex flex-col gap-1.5">
        <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          Pickup time
        </Label>
        <TimeField
          className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          name="pickup"
          step={900}
        />
        <Description className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Pickups run every 15 minutes.
        </Description>
      </TextField>
    </div>
  );
}
