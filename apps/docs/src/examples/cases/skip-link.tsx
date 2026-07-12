import { SkipLink } from "@comp0/react";

export function Example() {
  return (
    <div className="flex w-64 flex-col gap-3 text-base text-zinc-800 sm:text-sm dark:text-zinc-100">
      <SkipLink
        href="#skip-link-main"
        className="self-start rounded bg-teal-700 px-3 py-2 text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-teal-600 dark:bg-teal-400 dark:text-zinc-950 dark:focus-visible:outline-teal-300"
      >
        Skip to main content
      </SkipLink>
      <p className="text-zinc-600 dark:text-zinc-400">
        Press Tab from the start of this example to reveal the link.
      </p>
      <nav aria-label="Example" className="flex gap-3">
        <a className="underline underline-offset-4" href="#skip-link-home">
          Home
        </a>
        <a className="underline underline-offset-4" href="#skip-link-docs">
          Docs
        </a>
        <a className="underline underline-offset-4" href="#skip-link-blog">
          Blog
        </a>
      </nav>
      <main
        id="skip-link-main"
        tabIndex={-1}
        className="rounded border border-zinc-950/10 p-3 dark:border-white/10"
      >
        Main content starts here.
      </main>
    </div>
  );
}
