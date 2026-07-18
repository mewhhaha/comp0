import { SkipLink } from "@comp0/react";

export function Example() {
  return (
    <div className="grid min-h-80 grid-cols-[9rem_1fr] grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-zinc-950/15 text-base sm:text-sm dark:border-white/15">
      <SkipLink
        href="#shell-main"
        className="absolute z-10 m-2 rounded bg-teal-700 px-3 py-2 text-white outline-offset-2 focus-visible:outline-2 dark:bg-teal-400 dark:text-zinc-950"
      >
        Skip to main content
      </SkipLink>
      <header className="col-span-2 border-b border-zinc-950/10 p-4 font-semibold dark:border-white/10">
        Project Atlas
      </header>
      <nav aria-label="Project" className="border-r border-zinc-950/10 p-4 dark:border-white/10">
        <ul className="space-y-2">
          <li>
            <a href="#overview" className="underline underline-offset-2">
              Overview
            </a>
          </li>
          <li>
            <a href="#activity" className="underline underline-offset-2">
              Activity
            </a>
          </li>
        </ul>
      </nav>
      <main
        id="shell-main"
        tabIndex={-1}
        className="scroll-mt-4 p-4 outline-teal-600 focus-visible:outline-2 dark:outline-teal-400"
      >
        <h1 className="text-lg font-semibold">Overview</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Native landmarks give assistive technology a map of the page.
        </p>
      </main>
      <footer className="col-span-2 border-t border-zinc-950/10 p-4 text-zinc-600 dark:border-white/10 dark:text-zinc-400">
        Project support
      </footer>
    </div>
  );
}
