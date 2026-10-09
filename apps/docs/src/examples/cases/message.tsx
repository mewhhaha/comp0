import { Message, MessageAuthor, MessageContent, MessageTime, Messages } from "@comp0/react";

export function Example() {
  return (
    <Messages
      aria-label="Conversation with the assistant"
      className="flex w-full max-w-sm flex-col gap-3"
    >
      <Message
        from="user"
        className="self-end rounded-lg bg-teal-700 px-3 py-2 text-base text-white sm:text-sm"
      >
        <div className="flex items-baseline justify-between gap-3 text-sm opacity-80">
          <MessageAuthor className="font-medium">You</MessageAuthor>
          <MessageTime dateTime="2026-10-09T10:00:00Z">10:00</MessageTime>
        </div>
        <MessageContent>Summarize the accessibility audit.</MessageContent>
      </Message>
      <Message
        from="assistant"
        className="self-start rounded-lg bg-zinc-100 px-3 py-2 text-base text-zinc-900 sm:text-sm dark:bg-zinc-800 dark:text-zinc-100"
      >
        <div className="flex items-baseline justify-between gap-3 text-sm opacity-80">
          <MessageAuthor className="font-medium">Assistant</MessageAuthor>
          <MessageTime dateTime="2026-10-09T10:00:05Z">10:00</MessageTime>
        </div>
        <MessageContent>All 14 checks passed.</MessageContent>
      </Message>
    </Messages>
  );
}
