import { useEffect, useState } from "react";
import {
  Composer,
  ComposerInput,
  ComposerSend,
  ComposerStop,
  CopyButton,
  Feedback,
  FeedbackButton,
  Message,
  MessageAuthor,
  MessageContent,
  Messages,
  Reasoning,
  ReasoningContent,
  ReasoningSummary,
  Suggestion,
  Suggestions,
} from "@comp0/react";

type Rating = "good" | "bad" | "";

type Turn = {
  id: number;
  from: "user" | "assistant";
  text: string;
  streaming: boolean;
  thinking: boolean;
  rating: Rating;
};

type Reply = { id: number; words: string[] };

function replyTo(prompt: string) {
  return `Here is a short answer to "${prompt}". Every control in this chat is a real button or form field, so it works by keyboard and with a screen reader, even while this reply is still streaming in.`;
}

export function Example() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [reply, setReply] = useState<Reply | null>(null);
  const generating = reply !== null;

  useEffect(() => {
    if (!reply) return;
    const assistant = turns.find((turn) => turn.id === reply.id);
    if (!assistant) return;
    const shown = assistant.text === "" ? 0 : assistant.text.split(" ").length;
    const done = shown >= reply.words.length;
    const delay = assistant.thinking ? 1200 : 60;
    const timer = setTimeout(() => {
      setTurns((current) =>
        current.map((turn) => {
          if (turn.id !== reply.id) return turn;
          if (turn.thinking) return { ...turn, thinking: false };
          if (done) return { ...turn, streaming: false };
          return { ...turn, text: reply.words.slice(0, shown + 1).join(" ") };
        }),
      );
      if (!assistant.thinking && done) setReply(null);
    }, delay);
    return () => clearTimeout(timer);
  }, [reply, turns]);

  const send = (text: string) => {
    const id = turns.length + 1;
    setTurns((current) => [
      ...current,
      { id, from: "user", text, streaming: false, thinking: false, rating: "" },
      { id: id + 1, from: "assistant", text: "", streaming: true, thinking: true, rating: "" },
    ]);
    setReply({ id: id + 1, words: replyTo(text).split(" ") });
  };

  const stop = () => {
    setTurns((current) => current.map((turn) => ({ ...turn, streaming: false, thinking: false })));
    setReply(null);
  };

  const rate = (id: number, rating: Rating) => {
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, rating } : turn)));
  };

  return (
    <section aria-labelledby="assistant-title" className="flex w-full max-w-md flex-col gap-3">
      <h2 id="assistant-title" className="font-semibold text-zinc-950 dark:text-white">
        Audit assistant
      </h2>
      <Messages
        aria-labelledby="assistant-title"
        busy={generating}
        className="flex min-h-48 flex-col gap-3 rounded-xl border border-zinc-950/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
      >
        {turns.map((turn) => (
          <Message
            key={turn.id}
            from={turn.from}
            status={turn.streaming ? "streaming" : "complete"}
            className="flex max-w-[90%] flex-col gap-2 rounded-lg px-3 py-2 text-base data-[from=assistant]:self-start data-[from=assistant]:bg-zinc-100 data-[from=assistant]:text-zinc-900 data-[from=user]:self-end data-[from=user]:bg-teal-700 data-[from=user]:text-white sm:text-sm dark:data-[from=assistant]:bg-zinc-800 dark:data-[from=assistant]:text-zinc-100"
          >
            <MessageAuthor className="sr-only">
              {turn.from === "user" ? "You" : "Assistant"}
            </MessageAuthor>
            {turn.from === "assistant" && (
              <Reasoning busy={turn.thinking}>
                <ReasoningSummary className="cursor-pointer text-sm opacity-80">
                  {turn.thinking ? "Thinking…" : "Thought for 1 second"}
                </ReasoningSummary>
                <ReasoningContent className="pt-1 text-sm opacity-80">
                  Matched the question against the audit results.
                </ReasoningContent>
              </Reasoning>
            )}
            {turn.text !== "" && <MessageContent>{turn.text}</MessageContent>}
            {turn.from === "assistant" && !turn.streaming && turn.text !== "" && (
              <div className="flex items-center gap-2">
                <Feedback
                  aria-label="Rate this response"
                  value={turn.rating}
                  onChange={(rating) => rate(turn.id, rating)}
                  className="flex gap-2"
                >
                  <FeedbackButton
                    value="good"
                    className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400 data-selected:border-teal-600"
                  >
                    Good response
                  </FeedbackButton>
                  <FeedbackButton
                    value="bad"
                    className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400 data-selected:border-teal-600"
                  >
                    Bad response
                  </FeedbackButton>
                </Feedback>
                <CopyButton
                  value={turn.text}
                  className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400"
                >
                  Copy response
                </CopyButton>
              </div>
            )}
          </Message>
        ))}
      </Messages>
      <Suggestions
        aria-label="Suggested questions"
        onSend={send}
        disabled={generating}
        className="flex flex-wrap gap-2"
      >
        <Suggestion
          value="Which checks failed?"
          className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400"
        >
          Which checks failed?
        </Suggestion>
        <Suggestion
          value="Summarize the audit"
          className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400"
        >
          Summarize the audit
        </Suggestion>
      </Suggestions>
      <Composer
        onSend={send}
        onStop={stop}
        generating={generating}
        className="flex items-end gap-2"
      >
        <ComposerInput
          aria-label="Message"
          placeholder="Ask about the audit"
          className="min-h-11 min-w-0 flex-1 resize-none rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
        />
        <ComposerSend className="rounded bg-teal-600 px-3 py-2.5 text-base text-white outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:py-2 sm:text-sm dark:bg-teal-500 dark:text-zinc-950 dark:outline-teal-400">
          Send
        </ComposerSend>
        <ComposerStop className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400">
          Stop
        </ComposerStop>
      </Composer>
    </section>
  );
}
