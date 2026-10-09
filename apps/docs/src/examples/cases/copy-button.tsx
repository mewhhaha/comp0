import { CopyButton } from "@comp0/react";

export function Example() {
  return (
    <div className="flex max-w-sm items-center gap-3">
      <code className="rounded bg-zinc-100 px-2 py-1 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
        npm i @comp0/react
      </code>
      <CopyButton
        value="npm i @comp0/react"
        className="group rounded border border-zinc-950/10 bg-white px-3 py-2 text-base text-zinc-900 outline-teal-600 focus-visible:outline-2 disabled:opacity-50 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400"
      >
        <span>Copy install command</span>
        <span aria-hidden="true" className="hidden group-data-copied:inline">
          {" "}
          ✓
        </span>
        <span aria-hidden="true" className="hidden group-data-failed:inline">
          {" "}
          ✗
        </span>
      </CopyButton>
    </div>
  );
}
