import { Preview, PreviewPopover, PreviewTrigger } from "@comp0/react";

export function Example() {
  return (
    <Preview>
      <PreviewTrigger
        href="https://www.npmjs.com/package/@comp0/react"
        className="text-base text-zinc-800 underline decoration-zinc-400 underline-offset-4 hover:decoration-zinc-800 sm:text-sm dark:text-zinc-100 dark:decoration-zinc-500 dark:hover:decoration-zinc-200"
      >
        @comp0/react on npm
      </PreviewTrigger>
      <PreviewPopover
        placement="bottom start"
        offset={8}
        className="flex w-64 flex-col gap-2 rounded border-0 bg-white p-3 opacity-100 shadow-lg ring-1 ring-zinc-950/10 transition-opacity duration-150 ease-out starting:opacity-0 motion-reduce:transition-none dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
      >
        <p className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          @comp0/react
        </p>
        <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          Headless React components with native-first behavior and styling hooks.
        </p>
        <dl className="flex gap-4 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
          <div className="flex gap-1">
            <dt>Version</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">0.1.0</dd>
          </div>
          <div className="flex gap-1">
            <dt>Weekly</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">12k</dd>
          </div>
        </dl>
      </PreviewPopover>
    </Preview>
  );
}
