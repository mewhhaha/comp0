import { Checkbox } from "@comp0/react";

export function Example() {
  return (
    <Checkbox
      className="group flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-checked:bg-teal-50 data-checked:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-checked:bg-teal-950/40 dark:data-checked:text-teal-50"
      defaultChecked
      name="product-updates"
    >
      <span className="size-5 shrink-0 rounded-sm border border-zinc-950/20 bg-white ring-2 ring-transparent group-data-focus-visible:ring-teal-600 group-data-checked:border-teal-600 group-data-checked:bg-teal-600 sm:size-4 dark:border-white/20 dark:bg-zinc-900 dark:group-data-focus-visible:ring-teal-400 dark:group-data-checked:border-teal-400 dark:group-data-checked:bg-teal-400" />
      Send me product updates
    </Checkbox>
  );
}
