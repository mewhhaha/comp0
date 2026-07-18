import { useState } from "react";
import { Button, Status } from "@comp0/react";

export function Example() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex w-80 flex-col items-start gap-3 text-base sm:text-sm">
      <Button
        className="min-h-10 rounded-lg bg-teal-700 px-3 py-2 font-medium text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-teal-600 dark:bg-teal-400 dark:text-zinc-950 dark:focus-visible:outline-teal-300"
        onClick={() => setSaved(true)}
      >
        Save draft
      </Button>
      {saved && (
        <Status className="w-full rounded-lg border border-teal-700/25 bg-teal-50 p-3 text-teal-950 dark:border-teal-400/25 dark:bg-teal-950 dark:text-teal-100">
          Draft saved.
        </Status>
      )}
    </div>
  );
}
