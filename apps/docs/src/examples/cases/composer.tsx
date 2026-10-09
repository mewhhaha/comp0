import { useState } from "react";
import { Composer, ComposerInput, ComposerSend, ComposerStop } from "@comp0/react";

export function Example() {
  const [sent, setSent] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Composer
        generating={generating}
        onSend={(text) => {
          setSent((current) => [...current, text]);
          setGenerating(true);
        }}
        onStop={() => setGenerating(false)}
        className="flex items-end gap-2"
      >
        <ComposerInput
          aria-label="Message"
          placeholder="Message the assistant"
          className="min-h-11 min-w-0 flex-1 resize-none rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
        />
        <ComposerSend className="rounded bg-teal-600 px-3 py-2.5 text-base text-white outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:py-2 sm:text-sm dark:bg-teal-500 dark:text-zinc-950 dark:outline-teal-400">
          Send
        </ComposerSend>
        <ComposerStop className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400">
          Stop
        </ComposerStop>
      </Composer>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Enter sends, Shift+Enter adds a line. Sent: {sent.length}
      </p>
    </div>
  );
}
