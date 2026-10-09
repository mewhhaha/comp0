import { useEffect, useState } from "react";
import { Reasoning, ReasoningContent, ReasoningSummary } from "@comp0/react";

export function Example() {
  const [seconds, setSeconds] = useState(0);
  const thinking = seconds < 3;

  useEffect(() => {
    if (!thinking) return;
    const timer = setTimeout(() => setSeconds((current) => current + 1), 1000);
    return () => clearTimeout(timer);
  }, [thinking, seconds]);

  return (
    <Reasoning
      busy={thinking}
      className="max-w-sm rounded border border-zinc-950/10 p-3 dark:border-white/10"
    >
      <ReasoningSummary className="cursor-pointer text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        {thinking ? "Thinking…" : "Thought for 3 seconds"}
      </ReasoningSummary>
      <ReasoningContent className="pt-2 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        Compared each audit result with the previous release and found no regressions.
      </ReasoningContent>
    </Reasoning>
  );
}
