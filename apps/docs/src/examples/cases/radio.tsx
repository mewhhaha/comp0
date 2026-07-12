import { Radio, RadioGroup } from "@comp0/react";

export function Example() {
  return (
    <RadioGroup
      className="flex flex-col gap-2 sm:flex-row sm:gap-4"
      defaultValue="standard"
      name="shipping"
    >
      <Radio
        value="standard"
        className="group flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-selected:bg-teal-50 data-selected:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950/40 dark:data-selected:text-teal-50"
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-full border border-zinc-950/20 bg-white ring-2 ring-transparent group-data-focused:ring-teal-600 group-data-selected:border-teal-600 sm:size-4 dark:border-white/20 dark:bg-zinc-900 dark:group-data-focused:ring-teal-400 dark:group-data-selected:border-teal-400">
          <span className="size-2 rounded-full bg-teal-600 opacity-0 group-data-selected:opacity-100 dark:bg-teal-400" />
        </span>
        Standard
      </Radio>
      <Radio
        value="express"
        className="group flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-selected:bg-teal-50 data-selected:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950/40 dark:data-selected:text-teal-50"
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-full border border-zinc-950/20 bg-white ring-2 ring-transparent group-data-focused:ring-teal-600 group-data-selected:border-teal-600 sm:size-4 dark:border-white/20 dark:bg-zinc-900 dark:group-data-focused:ring-teal-400 dark:group-data-selected:border-teal-400">
          <span className="size-2 rounded-full bg-teal-600 opacity-0 group-data-selected:opacity-100 dark:bg-teal-400" />
        </span>
        Express
      </Radio>
    </RadioGroup>
  );
}
