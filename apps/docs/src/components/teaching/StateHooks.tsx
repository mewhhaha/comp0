import type { StateHook } from "../../content/types.js";
import { cn } from "./cn.js";

type StateHooksProps = {
  hooks: StateHook[];
  className?: string | undefined;
};

export function StateHooks({ hooks, className }: StateHooksProps) {
  return (
    <section className={cn("max-w-full min-w-0", className)}>
      <h3 className="text-base font-semibold text-zinc-950 dark:text-white">Style hooks</h3>
      <p className="mt-1 text-base/7 text-pretty text-zinc-600 sm:text-sm/6 dark:text-zinc-300">
        Attributes your CSS can target to paint each state.
      </p>
      <dl className="mt-4 grid divide-y divide-zinc-950/5 dark:divide-white/10">
        {hooks.map((hook) => (
          <div
            key={hook.attribute}
            className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(12rem,auto)_1fr] sm:items-baseline sm:gap-4"
          >
            <dt className="min-w-0 text-base sm:text-sm">
              <code className="font-mono font-medium text-teal-800 dark:text-teal-200">
                {hook.attribute}
              </code>
              <p className="mt-0.5 font-mono text-xs/5 text-zinc-500 dark:text-zinc-400">
                on {hook.on}
              </p>
            </dt>
            <dd className="text-base/7 text-zinc-600 sm:text-sm/6 dark:text-zinc-300">
              {hook.meaning}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
