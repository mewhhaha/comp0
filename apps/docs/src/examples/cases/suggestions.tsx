import { useState } from "react";
import { Status, Suggestion, Suggestions } from "@comp0/react";

export function Example() {
  const [sent, setSent] = useState("");

  return (
    <div className="flex max-w-sm flex-col gap-3">
      <Suggestions aria-label="Quick replies" onSend={setSent} className="flex flex-wrap gap-2">
        <Suggestion
          value="Tell me more about the audit"
          className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400"
        >
          Tell me more
        </Suggestion>
        <Suggestion
          value="Show the failing checks"
          className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400"
        >
          Failing checks
        </Suggestion>
        <Suggestion
          value="Thanks"
          className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400"
        >
          Thanks
        </Suggestion>
      </Suggestions>
      <Status className="text-sm text-zinc-600 dark:text-zinc-400">
        {sent && `Sent: ${sent}`}
      </Status>
    </div>
  );
}
