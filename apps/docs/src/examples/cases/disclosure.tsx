import { Disclosure, DisclosurePanel, DisclosureTrigger } from "@comp0/react";

export function Example() {
  return (
    <Disclosure className="flex max-w-xs flex-col gap-2 rounded border border-zinc-950/10 p-3 dark:border-white/10">
      <DisclosureTrigger className="cursor-pointer text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        What is included?
      </DisclosureTrigger>
      <DisclosurePanel className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        Source files, updates, and email support.
      </DisclosurePanel>
    </Disclosure>
  );
}
