import { useState } from "react";
import { Label, SearchField, SearchFieldClear, SearchFieldInput } from "@comp0/react";

export function Example() {
  const [submitted, setSubmitted] = useState("");

  return (
    <SearchField as="div" className="flex max-w-xs flex-col gap-2" onSubmit={setSubmitted}>
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Search
      </Label>
      <div className="flex gap-2">
        <SearchFieldInput
          className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          name="query"
          placeholder="Press Enter"
        />
        <SearchFieldClear className="shrink-0 rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100">
          Clear
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
