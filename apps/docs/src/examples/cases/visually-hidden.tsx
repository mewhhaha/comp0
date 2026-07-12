import { VisuallyHidden } from "@comp0/react";

export function Example() {
  return (
    <button
      type="button"
      className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950"
    >
      Notifications <VisuallyHidden>(3 unread)</VisuallyHidden>
    </button>
  );
}
