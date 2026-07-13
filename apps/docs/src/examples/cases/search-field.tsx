import { useState } from "react";
import { Label, SearchField, SearchFieldClear, SearchFieldInput } from "@comp0/react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/16/solid";

export function Example() {
  const [submitted, setSubmitted] = useState("");

  return (
    <SearchField as="div" className="flex max-w-xs flex-col gap-2" onSubmit={setSubmitted}>
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Search
      </Label>
      <div className="relative">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
          aria-hidden="true"
        />
        <SearchFieldInput
          className="w-full rounded border border-zinc-950/10 bg-white py-2.5 pr-11 pl-9 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400 [&::-webkit-search-cancel-button]:hidden"
          name="query"
          placeholder="Press Enter"
        />
        <SearchFieldClear
          aria-label="Clear search"
          className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded text-zinc-500 outline-teal-600 hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-2 dark:text-zinc-400 dark:outline-teal-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <XMarkIcon className="size-4" aria-hidden="true" />
        </SearchFieldClear>
      </div>
      {submitted && (
        <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Searching for “{submitted}”
        </p>
      )}
    </SearchField>
  );
}
