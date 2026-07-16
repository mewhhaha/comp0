import { Checkbox, Fieldset, Legend } from "@comp0/react";

export function Example() {
  return (
    <Fieldset className="flex max-w-xs flex-col gap-2 rounded border border-zinc-950/10 p-3 dark:border-white/10">
      <Legend className="px-1 text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Delivery
      </Legend>
      <Checkbox
        className="flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-checked:bg-teal-50 data-checked:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-checked:bg-teal-950/40 dark:data-checked:text-teal-50"
        defaultChecked
        name="leave-at-door"
      >
        <span className="size-5 shrink-0 rounded-sm border border-zinc-950/20 bg-white sm:size-4 dark:border-white/20 dark:bg-zinc-900" />
        Leave at the door
      </Checkbox>
    </Fieldset>
  );
}
