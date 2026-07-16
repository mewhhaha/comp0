import { Switch } from "@comp0/react";

export function Example() {
  return (
    <Switch
      className="group flex min-h-7 items-center gap-2 rounded px-1 text-base text-zinc-800 data-checked:bg-teal-50 data-checked:text-teal-950 sm:text-sm dark:text-zinc-100 dark:data-checked:bg-teal-950/40 dark:data-checked:text-teal-50"
      defaultChecked
      name="alerts"
    >
      <span className="h-6 w-11 shrink-0 rounded-full bg-zinc-200 p-0.5 ring-2 ring-transparent transition-colors duration-150 ease-out group-data-focus-visible:ring-teal-600 group-data-checked:bg-teal-600 motion-reduce:transition-none sm:h-5 sm:w-9 dark:bg-zinc-800 dark:group-data-focus-visible:ring-teal-400 dark:group-data-checked:bg-teal-400">
        <span className="block size-5 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out group-data-checked:translate-x-5 motion-reduce:transition-none sm:size-4 sm:group-data-checked:translate-x-4 dark:shadow-none" />
      </span>
      Enable alerts
    </Switch>
  );
}
