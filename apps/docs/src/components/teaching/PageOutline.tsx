type OutlineSection = {
  id: string;
  title: string;
};

type PageOutlineProps = {
  sections: OutlineSection[];
};

/** The page's sections as a disclosure, for screens without room for the side outline. */
export function InlineOutline({ sections }: PageOutlineProps) {
  return (
    <details className="rounded-xl border border-zinc-950/10 p-4 xl:hidden dark:border-white/10">
      <summary className="min-h-12 cursor-pointer py-2 text-base/7 font-medium text-zinc-950 outline-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-white dark:focus-visible:outline-teal-400">
        On this page
      </summary>
      <ol
        className="mt-2 grid gap-1 border-t border-zinc-950/10 pt-3 dark:border-white/10"
        role="list"
      >
        {sections.map((section) => (
          <li key={section.id}>
            <a
              className="flex min-h-11 min-w-0 items-center rounded-lg p-2 text-base/7 text-zinc-600 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400"
              href={`#${section.id}`}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

/** The page's sections in a sticky side column on wide screens. */
export function DesktopOutline({ sections }: PageOutlineProps) {
  return (
    <aside className="hidden xl:block">
      <nav aria-label="On this page" className="sticky top-24">
        <p className="text-sm/6 font-semibold text-zinc-950 dark:text-white">On this page</p>
        <ol
          className="mt-3 grid gap-1 border-l border-zinc-950/10 pl-3 dark:border-white/10"
          role="list"
        >
          {sections.map((section) => (
            <li key={section.id}>
              <a
                className="flex min-w-0 rounded-md px-2 py-1.5 text-sm/6 text-zinc-500 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400"
                href={`#${section.id}`}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
