import { useState } from "react";
import { Label } from "@comp0/react";
import { ProgressBar } from "@comp0/react";

export function Example() {
  const [value, setValue] = useState(0.4);

  return (
    <div className="flex max-w-xs flex-col gap-2">
      <Label
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
        htmlFor="upload-progress"
      >
        Uploading photos
      </Label>
      <ProgressBar
        id="upload-progress"
        value={value}
        className="h-2 w-full accent-teal-600 dark:accent-teal-400"
      />
      <p className="text-base text-zinc-600 tabular-nums sm:text-sm dark:text-zinc-400">
        {Math.round(value * 100)}% complete
      </p>
      <button
        type="button"
        className="self-start rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950"
        onClick={() => setValue((current) => Math.min(1, current + 0.2))}
      >
        Advance
      </button>
      <ProgressBar
        aria-label="Preparing download"
        className="h-2 w-full accent-teal-600 dark:accent-teal-400"
      />
    </div>
  );
}
