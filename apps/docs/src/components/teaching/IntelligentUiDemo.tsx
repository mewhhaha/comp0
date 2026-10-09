"use client";

import { Button } from "@comp0/react";
import { type ComponentProps, lazy, Suspense, useEffect, useState } from "react";
import { demoResponses, tokenize } from "../../examples/demos/intelligent-ui-responses.js";
import { cn } from "./cn.js";

// The GenUI runtime is only fetched when someone presses play.
const Stage = lazy(async () => ({
  default: (await import("../../examples/demos/IntelligentUiStage.js")).IntelligentUiStage,
}));

const tokensPerTick = 3;
const tickMilliseconds = 45;
const tokenized = demoResponses.map((demo) => tokenize(demo.response));

function DemoButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        `
          min-h-11 rounded-lg px-3 py-2 text-base/7 font-medium outline-none
          data-focus-visible:outline-2 data-focus-visible:outline-offset-2
          data-focus-visible:outline-teal-600
          sm:min-h-9 sm:text-sm/6
          dark:data-focus-visible:outline-teal-400
        `,
        className,
      )}
      {...props}
    />
  );
}

type IntelligentUiDemoProps = {
  className?: string | undefined;
};

/** Replays recorded JSON responses token by token through GenUI. No network. */
export function IntelligentUiDemo({ className }: IntelligentUiDemoProps) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [started, setStarted] = useState(false);
  const [sent, setSent] = useState<string | undefined>(undefined);

  const demo = demoResponses[index]!;
  const tokens = tokenized[index]!;
  const streaming = started && shown < tokens.length;
  const complete = started && !streaming;
  const response = tokens.slice(0, shown).join("");

  useEffect(() => {
    if (!streaming) return;
    const timer = setTimeout(() => {
      setShown((count) => count + tokensPerTick);
    }, tickMilliseconds);
    return () => clearTimeout(timer);
  }, [streaming, shown]);

  function play() {
    setSent(undefined);
    setShown(0);
    setStarted(true);
  }

  function choose(next: number) {
    setIndex(next);
    setShown(0);
    setStarted(false);
    setSent(undefined);
  }

  let playLabel = "Play";
  if (started) playLabel = "Replay";
  if (streaming) playLabel = "Restart";

  let stage = (
    <p className="text-base/7 text-zinc-500 sm:text-sm/6 dark:text-zinc-400">
      The assistant&apos;s answer appears here.
    </p>
  );
  if (started) {
    stage = (
      <Suspense fallback={<p className="text-sm/6 text-zinc-500">Loading the renderer…</p>}>
        <Stage onAction={setSent} response={response} streaming={streaming} />
      </Suspense>
    );
  }

  let status = "Ready. Press play to stream a recorded response.";
  if (streaming) status = "Streaming the response…";
  if (complete) status = "Response complete.";

  return (
    <section
      aria-label="Streaming demo"
      className={cn(
        `
          min-w-0 rounded-xl border border-zinc-950/10 bg-white p-4
          sm:p-6
          dark:border-white/10 dark:bg-zinc-900
        `,
        className,
      )}
    >
      <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
        <legend className="sr-only">Recorded response</legend>
        {demoResponses.map((item, itemIndex) => (
          <DemoButton
            aria-pressed={itemIndex === index}
            className={cn(
              `
                ring-1 ring-zinc-950/10
                data-hovered:bg-zinc-950/5
                dark:ring-white/15
                dark:data-hovered:bg-white/5
              `,
              itemIndex === index &&
                `
                  bg-zinc-950/5
                  dark:bg-white/10
                `,
            )}
            key={item.id}
            onClick={() => choose(itemIndex)}
          >
            {item.title}
          </DemoButton>
        ))}
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <DemoButton
          className={`
            bg-teal-700 text-white
            data-hovered:bg-teal-800
            dark:bg-teal-400 dark:text-zinc-950
            dark:data-hovered:bg-teal-300
          `}
          onClick={play}
        >
          {playLabel}
        </DemoButton>
        <output
          className="text-base/7 text-zinc-600 sm:text-sm/6 dark:text-zinc-300"
          data-streaming={streaming ? "" : undefined}
        >
          {status}
        </output>
      </div>

      <p className="mt-6 ml-auto w-fit max-w-[80%] rounded-2xl bg-zinc-950/5 px-4 py-2 text-base/7 text-zinc-950 sm:text-sm/6 dark:bg-white/10 dark:text-white">
        {demo.prompt}
      </p>

      <div className="mt-4 min-h-40 min-w-0 rounded-xl border border-dashed border-zinc-950/15 p-4 dark:border-white/15">
        {stage}
      </div>

      {sent !== undefined && (
        <output className="mt-4 block text-base/7 text-zinc-600 sm:text-sm/6 dark:text-zinc-300">
          Sent to the assistant: <q>{sent}</q>
        </output>
      )}

      <details className="mt-4">
        <summary className="min-h-11 cursor-pointer py-2 text-base/7 font-medium text-zinc-950 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:text-white dark:focus-visible:outline-teal-400">
          JSON the model wrote
        </summary>
        <pre
          className="mt-2 max-h-72 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs/5 break-words whitespace-pre-wrap text-zinc-100"
          tabIndex={0}
        >
          {started ? response : demo.response}
        </pre>
      </details>
    </section>
  );
}
