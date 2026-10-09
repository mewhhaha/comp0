import { useEffect, useState } from "react";
import { BusyRegion, Button, Status } from "@comp0/react";

const answerLines = [
  "Check the color contrast of the primary button.",
  "Give every icon-only control an accessible name.",
  "Keep focus where it is while the answer is written.",
];

export function Example() {
  const [lines, setLines] = useState(0);
  const [asked, setAsked] = useState(false);
  const writing = asked && lines < answerLines.length;

  useEffect(() => {
    if (!writing) return;
    const timer = setTimeout(() => setLines((current) => current + 1), 700);
    return () => clearTimeout(timer);
  }, [writing, lines]);

  function ask() {
    if (writing) return;
    setLines(0);
    setAsked(true);
  }

  let announcement = "";
  if (!writing && lines > 0) announcement = "Answer ready.";

  return (
    <section aria-labelledby="busy-title" className="flex w-full max-w-md flex-col gap-3">
      <h2 id="busy-title" className="font-semibold text-zinc-950 dark:text-white">
        Review assistant
      </h2>
      <BusyRegion
        busy={writing}
        className="flex min-h-32 flex-col gap-2 rounded-xl border border-zinc-950/10 bg-white p-4 data-busy:border-teal-600/40 dark:border-white/10 dark:bg-zinc-900"
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {lines === 0 ? "Ask for a review to see the answer arrive line by line." : "Next steps:"}
        </p>
        <ol className="list-decimal pl-5 text-sm text-zinc-900 dark:text-zinc-100">
          {answerLines.slice(0, lines).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </BusyRegion>
      <Status className="text-sm text-zinc-600 dark:text-zinc-400">{announcement}</Status>
      <Button
        onClick={ask}
        className="self-start rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white outline-teal-600 focus-visible:outline-2 dark:bg-teal-400 dark:text-zinc-950 dark:outline-teal-300"
      >
        Ask again
      </Button>
    </section>
  );
}
