import { useEffect, useState } from "react";
import { Button, Messages, Status } from "@comp0/react";

const responseWords =
  "The accessibility review is complete. Keyboard navigation, visible focus, and screen reader announcements all passed.".split(
    " ",
  );

type ResponseState = "idle" | "streaming" | "complete" | "interrupted";

export function Example() {
  const [responseState, setResponseState] = useState<ResponseState>("idle");
  const [visibleWords, setVisibleWords] = useState(0);

  useEffect(() => {
    if (responseState !== "streaming") return;
    if (visibleWords >= responseWords.length) {
      setResponseState("complete");
      return;
    }
    const timer = setTimeout(() => setVisibleWords((current) => current + 1), 90);
    return () => clearTimeout(timer);
  }, [responseState, visibleWords]);

  const startResponse = () => {
    setVisibleWords(0);
    setResponseState("streaming");
  };
  const streaming = responseState === "streaming";
  const response = responseWords.slice(0, visibleWords).join(" ");

  let announcement = "";
  if (responseState === "complete") announcement = "Response complete.";
  if (responseState === "interrupted") announcement = "Response stopped.";

  return (
    <section aria-labelledby="stream-title" className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="stream-title" className="font-semibold text-zinc-950 dark:text-white">
            Review assistant
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The live log waits until the response is complete before announcing it.
          </p>
        </div>
        {streaming && (
          <span aria-hidden="true" className="text-xs text-teal-700 dark:text-teal-300">
            Streaming…
          </span>
        )}
      </div>
      <Messages
        aria-labelledby="stream-title"
        busy={streaming}
        className="flex min-h-48 flex-col gap-3 rounded-xl border border-zinc-950/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
      >
        <article className="max-w-[85%] self-end rounded-lg bg-teal-700 px-3 py-2 text-sm text-white">
          Did the accessibility review pass?
        </article>
        {responseState !== "idle" && (
          <article className="max-w-[90%] self-start rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            <strong className="sr-only">Assistant:</strong>
            <p>{response || "…"}</p>
          </article>
        )}
      </Messages>
      <div className="flex items-center gap-2">
        {streaming ? (
          <Button
            className="rounded-lg border border-zinc-950/15 px-3 py-2 text-sm font-medium text-zinc-800 outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:text-zinc-100 dark:outline-teal-400"
            onClick={() => setResponseState("interrupted")}
          >
            Stop generating
          </Button>
        ) : (
          <Button
            className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white outline-teal-600 focus-visible:outline-2 dark:bg-teal-400 dark:text-zinc-950 dark:outline-teal-300"
            onClick={startResponse}
          >
            {responseState === "idle" ? "Generate response" : "Generate again"}
          </Button>
        )}
        <Status className="text-sm text-zinc-600 dark:text-zinc-400">{announcement}</Status>
      </div>
    </section>
  );
}
