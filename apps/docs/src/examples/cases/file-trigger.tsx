import { useState } from "react";
import { FileTrigger } from "@comp0/react";

export function Example() {
  const [name, setName] = useState("No file selected");

  return (
    <div className="flex flex-col gap-2">
      <FileTrigger
        className="inline-flex w-fit cursor-pointer rounded border border-dashed border-zinc-950/20 px-3 py-2.5 text-base text-zinc-800 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:border-white/20 dark:text-zinc-100 dark:has-focus-visible:outline-teal-400"
        name="example-file"
        aria-label="Choose a file"
        onChange={(event) => setName(event.currentTarget.files?.[0]?.name ?? "No file selected")}
      >
        Choose a file
      </FileTrigger>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">{name}</p>
    </div>
  );
}
