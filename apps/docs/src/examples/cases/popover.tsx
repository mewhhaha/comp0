import { Popover, PopoverContent, PopoverTrigger } from "@comp0/react";

export function Example() {
  return (
    <Popover>
      <PopoverTrigger className="rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100">
        Show details
      </PopoverTrigger>
      <PopoverContent
        placement="bottom start"
        offset={8}
        className="flex w-56 flex-col gap-1 rounded border-0 bg-white p-3 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
      >
        <p className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          New release
        </p>
        <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Version 0.1 is ready to explore.
        </p>
      </PopoverContent>
    </Popover>
  );
}
