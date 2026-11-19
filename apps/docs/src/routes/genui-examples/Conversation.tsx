"use client";

import { Message, MessageAuthor, MessageContent, Messages } from "@comp0/react";
import { ArrowPathIcon, PaperAirplaneIcon } from "@heroicons/react/16/solid";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { ExampleRoot } from "./ExampleRoot.js";
import type { ReplyPart } from "./recording.server.js";

type Turn = {
  prompt: string;
  status: "streaming" | "complete" | "error";
  text?: string;
  view?: ReactNode;
};

async function receiveReply(
  slug: string,
  prompt: string,
  signal: AbortSignal,
  show: (text: string, view: ReactNode) => void,
) {
  const [response, { createFromReadableStream }] = await Promise.all([
    fetch("/genui/examples/" + slug + "/reply", { method: "POST", body: prompt, signal }),
    import("@vitejs/plugin-rsc/browser"),
  ]);
  if (!response.ok || !response.body) throw new Error("Recorded reply unavailable");

  // Flight resolves its root before suspended children arrive. Keep the transcript busy until
  // the transport closes, including for JSX replies whose shell can already be displayed.
  const pipe = new TransformStream<Uint8Array, Uint8Array>();
  async function display() {
    const parts = await createFromReadableStream<AsyncIterable<ReplyPart>>(pipe.readable);
    let text = "";
    for await (const part of parts) {
      if (typeof part === "string") {
        text += part;
        show(text, null);
      } else if ("view" in part) {
        show(text, part.view);
      } else {
        const { JsonExample } = await import("./JsonExample.js");
        let source = "";
        const inventory = slug === "record-crates";
        for await (const chunk of part.json) {
          source += chunk;
          show(text, <JsonExample source={source} inventory={inventory} streaming />);
        }
        show(text, <JsonExample source={source} inventory={inventory} streaming={false} />);
      }
    }
  }
  await Promise.all([response.body.pipeTo(pipe.writable, { signal }), display()]);
}

type ConversationProps = { slug: string; prompt: string; followUp?: string | undefined };
export function Conversation({ slug, prompt, followUp }: ConversationProps) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [session, setSession] = useState(0);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const last = turns.at(-1);
  const busy = last?.status === "streaming";

  async function send(question: string) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    const first = question === prompt;
    const next: Turn = { prompt: question, status: "streaming" };
    if (first) setSession((current) => current + 1);
    setTurns((current) => (first ? [next] : [current[0]!, next]));

    function update(change: Partial<Turn>) {
      if (controller.signal.aborted) return;
      setTurns((current) => [
        ...current.slice(0, -1),
        { ...current[current.length - 1]!, ...change },
      ]);
    }
    try {
      await receiveReply(slug, question, controller.signal, (text, view) => update({ text, view }));
      update({ status: "complete" });
    } catch {
      update({ status: "error", text: "The recorded reply couldn’t be loaded.", view: null });
      controller.abort();
    } finally {
      active.current = null;
    }
  }

  let buttonLabel = "Send prompt";
  if (busy) buttonLabel = "Replying…";
  else if (last?.status === "error") buttonLabel = "Retry reply";
  else if (last) buttonLabel = "Replay conversation";
  const ActionIcon = last ? ArrowPathIcon : PaperAirplaneIcon;
  const visibleTurns = turns.length ? turns : [{ prompt }];
  return (
    <section aria-labelledby="conversation-title" className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="conversation-title" className="text-xl font-semibold">
          Mock conversation
        </h2>
        <button
          type="button"
          aria-disabled={busy}
          onClick={() => void send(last?.status === "error" ? last.prompt : prompt)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-800 px-4 font-semibold text-white outline-offset-4 focus-visible:outline-2 aria-disabled:opacity-70 dark:bg-teal-300 dark:text-zinc-950"
        >
          <ActionIcon aria-hidden="true" className="size-4" />
          {buttonLabel}
        </button>
      </div>
      <ExampleRoot key={session} slug={slug}>
        <Messages
          aria-label="Conversation"
          busy={busy}
          className="grid min-w-0 gap-5 rounded-xl border border-zinc-300 p-4 sm:p-6 dark:border-zinc-700"
        >
          {visibleTurns.map(({ prompt: question }, index) => {
            const turn = turns[index];
            return (
              <Fragment key={question}>
                <Message
                  from="user"
                  aria-label="You"
                  className="max-w-[90%] justify-self-end rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800"
                >
                  <MessageAuthor className="text-sm font-semibold">You</MessageAuthor>
                  <MessageContent className="mt-1">{question}</MessageContent>
                </Message>
                {turn && (
                  <Message
                    from="assistant"
                    status={turn.status}
                    aria-label="Assistant"
                    className="min-w-0"
                  >
                    <MessageAuthor className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                      Assistant
                    </MessageAuthor>
                    <MessageContent>
                      <p className="mt-1 max-w-prose">{turn.text ?? "Writing a reply…"}</p>
                      {turn.view && (
                        <div className="mt-4 min-w-0" data-genui="">
                          {turn.view}
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                )}
              </Fragment>
            );
          })}
        </Messages>
      </ExampleRoot>
      {followUp && turns[0]?.status === "complete" && (
        <button
          type="button"
          aria-disabled={turns.length > 1}
          onClick={() => {
            if (turns.length === 1) void send(followUp);
          }}
          className="mt-3 min-h-11 rounded-lg border border-zinc-400 px-3 font-medium outline-offset-4 focus-visible:outline-2 aria-disabled:opacity-70"
        >
          {turns.length > 1 ? "Follow-up sent" : "Add the encore"}
        </button>
      )}
    </section>
  );
}
