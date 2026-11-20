"use client";

import { Message, MessageAuthor, MessageContent, Messages } from "@comp0/react";
import { ArrowPathIcon, PaperAirplaneIcon } from "@heroicons/react/16/solid";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { ExampleRoot } from "./ExampleRoot.js";
import type { RecordedReply } from "./recording.server.js";

type Turn = {
  prompt: string;
  status: "streaming" | "complete" | "error";
  text?: string;
  view?: ReactNode;
  Root?: typeof ExampleRoot;
};

async function receiveReply(
  slug: string,
  prompt: string,
  signal: AbortSignal,
  show: (change: Partial<Turn>) => void,
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
    const reply = await createFromReadableStream<RecordedReply>(pipe.readable);
    async function showText(parts: AsyncIterable<string>) {
      let text = "";
      for await (const chunk of parts) {
        text += chunk;
        show({ text });
      }
    }
    async function showView() {
      if ("view" in reply) {
        const { ExampleRoot } = await import("./ExampleRoot.js");
        show({ Root: ExampleRoot, view: reply.view });
        return;
      }
      const { JsonExample } = await import("./JsonExample.js");
      const inventory = slug === "record-crates";
      let source = "";
      for await (const chunk of reply.json) {
        source += chunk;
        show({ view: <JsonExample source={source} inventory={inventory} streaming /> });
      }
      show({ view: <JsonExample source={source} inventory={inventory} streaming={false} /> });
    }
    await Promise.all([showText(reply.text), showView()]);
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
      await receiveReply(slug, question, controller.signal, update);
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
  const Root = turns[0]?.Root;
  let transcript = (
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
                  <p className="mt-1 min-h-[4lh] max-w-prose sm:min-h-[2lh]">
                    {turn.text ?? (
                      <>
                        Writing a reply
                        <span className="reply-dots" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                      </>
                    )}
                  </p>
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
  );
  if (Root)
    transcript = (
      <Root key={session} slug={slug}>
        {transcript}
      </Root>
    );
  else transcript = <Fragment key={session}>{transcript}</Fragment>;
  return (
    <section aria-labelledby="conversation-title" className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 max-[28rem]:flex-col max-[28rem]:items-start">
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
      {transcript}
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
