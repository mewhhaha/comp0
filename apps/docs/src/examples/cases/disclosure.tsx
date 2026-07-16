import { Disclosure, DisclosurePanel, DisclosureTrigger } from "@comp0/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

export function Example() {
  return (
    <Disclosure className="docs-disclosure max-w-xs rounded border border-zinc-950/10 p-3 dark:border-white/10">
      <DisclosureTrigger className="group flex cursor-pointer list-none items-center justify-between gap-2 text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
        What is included?
        <ChevronDownIcon
          className="size-4 text-zinc-400 transition-transform duration-150 ease-out group-data-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </DisclosureTrigger>
      <DisclosurePanel className="pt-2 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        Source files, updates, and email support.
      </DisclosurePanel>
    </Disclosure>
  );
}
