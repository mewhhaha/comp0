import { ToggleButton } from "@comp0/react";

export function Example() {
  return (
    <ToggleButton
      className="rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
      defaultSelected
    >
      Pin note
    </ToggleButton>
  );
}
