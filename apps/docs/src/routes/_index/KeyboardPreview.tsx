export type KeyboardPreviewProps = {
  className?: string | undefined;
};

const keys = [
  { key: "⇥", spoken: "Tab", action: "Move into the component" },
  { key: "↑ ↓", spoken: "Arrow keys", action: "Move between choices" },
  { key: "↵", spoken: "Enter", action: "Choose or activate" },
  { key: "Esc", spoken: "Escape", action: "Close and go back" },
];

export function KeyboardPreview({ className }: KeyboardPreviewProps) {
  return (
    <section className={`@container ${className ?? ""}`}>
      <div className="rounded-[min(2vw,var(--radius-2xl))] bg-zinc-50 p-5 ring-1 ring-zinc-950/10 sm:p-8 dark:bg-white/3 dark:ring-white/10">
        <div className="grid gap-8 @3xl:grid-cols-[3fr_5fr] @3xl:items-end">
          <div>
            <p className="font-mono text-sm/6 font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
              Keyboard included
            </p>
            <h2 className="mt-3 max-w-[22ch] text-3xl font-semibold tracking-tight text-balance text-zinc-950 dark:text-white">
              The symbols become a tiny instruction manual.
            </h2>
            <p className="mt-4 max-w-[52ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
              Every reference page shows the exact keys that work and what each one does. No
              guessing, and no keyboard jargon left unexplained.
            </p>
          </div>
          <dl className="grid gap-px overflow-hidden rounded-xl bg-zinc-950/10 ring-1 ring-zinc-950/10 @xl:grid-cols-2 dark:bg-white/10 dark:ring-white/10">
            {keys.map((item) => (
              <div className="min-w-0 bg-white p-4 dark:bg-zinc-900" key={item.spoken}>
                <dt className="flex min-w-0 items-center gap-3 font-medium text-zinc-950 dark:text-white">
                  <kbd
                    aria-label={item.spoken}
                    className="min-w-11 shrink-0 rounded-md bg-zinc-100 px-2 py-1.5 text-center font-mono text-base/7 ring-1 ring-zinc-950/10 dark:bg-white/5 dark:ring-white/10"
                  >
                    {item.key}
                  </kbd>
                  <span className="min-w-0">{item.spoken}</span>
                </dt>
                <dd className="mt-3 text-base/7 text-zinc-600 dark:text-zinc-300">{item.action}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
