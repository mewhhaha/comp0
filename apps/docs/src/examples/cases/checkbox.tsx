import { Checkbox } from "@comp0/react";

export function Example() {
  return (
    <Checkbox
      className="group flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-selected:bg-teal-50 data-selected:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950/40 dark:data-selected:text-teal-50"
      defaultSelected
      name="product-updates"
    >
      <span className="size-5 shrink-0 rounded-sm border border-zinc-950/20 bg-white ring-2 ring-transparent group-data-focused:ring-teal-600 group-data-selected:border-teal-600 group-data-selected:bg-teal-600 sm:size-4 dark:border-white/20 dark:bg-zinc-900 dark:group-data-focused:ring-teal-400 dark:group-data-selected:border-teal-400 dark:group-data-selected:bg-teal-400" />
      Send me product updates
    </Checkbox>
  );
}
