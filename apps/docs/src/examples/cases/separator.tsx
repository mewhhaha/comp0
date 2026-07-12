import { Separator } from "@comp0/react";

export function Example() {
  return (
    <div className="w-64 text-base text-zinc-800 sm:text-sm dark:text-zinc-100">
      <p className="font-medium">Inbox</p>
      <p className="text-zinc-600 dark:text-zinc-400">128 unread messages</p>
      <Separator className="my-3 border-zinc-950/10 dark:border-white/10" />
      <div className="flex items-center gap-3">
        <span>Archive</span>
        <Separator
          orientation="vertical"
          className="w-px self-stretch bg-zinc-950/10 dark:bg-white/10"
        />
        <span>Move</span>
        <Separator
          orientation="vertical"
          className="w-px self-stretch bg-zinc-950/10 dark:bg-white/10"
        />
        <span>Trash</span>
      </div>
    </div>
  );
}
