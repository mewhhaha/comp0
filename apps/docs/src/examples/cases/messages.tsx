import { useState, type FormEvent } from "react";
import { Button, Label, Messages, TextArea, TextField } from "@comp0/react";

type Message = {
  id: string;
  author: "Ada" | "You";
  body: string;
  sentAt: string;
  time: string;
};

const initialMessages: Message[] = [
  {
    id: "message-1",
    author: "Ada",
    body: "Could you send the revised outline?",
    sentAt: "2026-07-13T10:40:00+02:00",
    time: "10:40",
  },
  {
    id: "message-2",
    author: "You",
    body: "Absolutely — I’ll share it this afternoon.",
    sentAt: "2026-07-13T10:42:00+02:00",
    time: "10:42",
  },
];

export function Example() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setMessages((current) => [
      ...current,
      {
        id: `message-${current.length + 1}`,
        author: "You",
        body,
        sentAt: new Date().toISOString(),
        time: "Now",
      },
    ]);
    setDraft("");
  }

  return (
    <section aria-labelledby="conversation-title" className="flex w-full max-w-sm flex-col gap-3">
      <h2
        id="conversation-title"
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
      >
        Conversation with Ada
      </h2>
      <Messages aria-labelledby="conversation-title" className="flex flex-col gap-2">
        {messages.map((message) => (
          <article
            key={message.id}
            aria-labelledby={`${message.id}-author`}
            data-direction={message.author === "You" ? "outgoing" : "incoming"}
            className="max-w-[85%] rounded-lg px-3 py-2 text-base data-[direction=incoming]:self-start data-[direction=incoming]:bg-zinc-100 data-[direction=incoming]:text-zinc-900 data-[direction=outgoing]:self-end data-[direction=outgoing]:bg-teal-600 data-[direction=outgoing]:text-white sm:text-sm dark:data-[direction=incoming]:bg-zinc-800 dark:data-[direction=incoming]:text-zinc-100"
          >
            <header className="flex items-baseline justify-between gap-3 text-sm opacity-75">
              <strong id={`${message.id}-author`} className="font-medium">
                {message.author}
              </strong>
              <time dateTime={message.sentAt}>{message.time}</time>
            </header>
            <p className="mt-1">{message.body}</p>
          </article>
        ))}
      </Messages>
      <form className="flex items-end gap-2" onSubmit={sendMessage}>
        <TextField
          as="div"
          value={draft}
          onChange={setDraft}
          className="flex min-w-0 flex-1 flex-col gap-1.5"
        >
          <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
            Message
          </Label>
          <TextArea
            className="min-h-11 w-full resize-none rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
            name="message"
            rows={1}
          />
        </TextField>
        <Button
          type="submit"
          disabled={!draft.trim()}
          className="rounded bg-teal-600 px-3 py-2.5 text-base text-white outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:py-2 sm:text-sm dark:bg-teal-500 dark:text-zinc-950 dark:outline-teal-400"
        >
          Send
        </Button>
      </form>
    </section>
  );
}
