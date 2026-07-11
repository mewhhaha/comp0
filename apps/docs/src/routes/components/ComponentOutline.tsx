import type { ComponentDoc } from "../../content/index.js";

const sections = [
  ["example", "Try it"],
  ["anatomy", "See the parts"],
  ["build", "Build it step by step"],
  ["keyboard", "Use the keyboard"],
  ["styling", "Style each state"],
  ["contract", "Forms and accessibility"],
] as const;

export type ComponentOutlineProps = {
  doc: ComponentDoc;
  className?: string | undefined;
  compact?: boolean | undefined;
};

export function ComponentOutline({ doc, className, compact = false }: ComponentOutlineProps) {
  const links = (
    <ol className="grid gap-1" role="list">
      {sections.map(([id, label], index) => (
        <li key={id}>
          <a
            className="flex min-w-0 gap-2 rounded-md px-2 py-1.5 text-base/7 text-zinc-500 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400"
            href={`#${id}`}
          >
            <span className="shrink-0 font-mono text-teal-700 tabular-nums dark:text-teal-300">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">{label}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  if (compact) {
    return (
      <details
        className={`rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-950/10 dark:bg-white/3 dark:ring-white/10 ${className ?? ""}`}
      >
        <summary className="min-h-12 cursor-pointer py-2 text-base/7 font-medium text-zinc-950 outline-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-white dark:focus-visible:outline-teal-400">
          On this {doc.title} page
        </summary>
        <div className="mt-2 border-t border-zinc-950/10 pt-3 dark:border-white/10">{links}</div>
      </details>
    );
  }

  return (
    <nav aria-label={`On this ${doc.title} page`} className={className}>
      <p className="font-mono text-sm/6 font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
        On this page
      </p>
      <div className="mt-3 border-l border-zinc-950/10 pl-3 dark:border-white/10">{links}</div>
    </nav>
  );
}
