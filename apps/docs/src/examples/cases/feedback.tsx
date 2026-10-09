import { useState } from "react";
import { Feedback, FeedbackButton } from "@comp0/react";

export function Example() {
  const [rating, setRating] = useState<"good" | "bad" | "">("");

  return (
    <div className="flex flex-col gap-2">
      <Feedback
        aria-label="Rate this response"
        value={rating}
        onChange={setRating}
        className="flex gap-2"
      >
        <FeedbackButton
          value="good"
          className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400 data-selected:border-teal-600 data-selected:bg-teal-50 dark:data-selected:bg-teal-950"
        >
          Good response
        </FeedbackButton>
        <FeedbackButton
          value="bad"
          className="rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400 data-selected:border-teal-600 data-selected:bg-teal-50 dark:data-selected:bg-teal-950"
        >
          Bad response
        </FeedbackButton>
      </Feedback>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Rating: {rating || "none"}</p>
    </div>
  );
}
