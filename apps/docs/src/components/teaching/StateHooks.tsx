import { useId } from "react";
import type { StateHook } from "../../content/types.js";
import { Braces } from "lucide-react";
import { cn } from "./cn.js";

type StateHooksProps = {
  hooks: StateHook[];
  className?: string | undefined;
};

export function StateHooks({ hooks, className }: StateHooksProps) {
  const titleId = `${useId().replaceAll(":", "")}-state-hooks-title`;
  return (
    <section
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
      aria-labelledby={titleId}
    >
      <div className="flex items-center gap-3">
        <Braces className="size-6 text-teal-700 dark:text-teal-300" aria-hidden="true" />
        <div>
          <h3 id={titleId} className="font-semibold text-zinc-950 dark:text-zinc-50">
            State hooks and selectors
          </h3>
          <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-300">
            Style component state with data attributes and native CSS selectors.
          </p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3">
        {hooks.map((hook) => (
          <div
            key={hook.attribute}
            className="grid gap-1 rounded-lg bg-zinc-50 p-3 sm:grid-cols-[12rem_1fr] sm:items-baseline dark:bg-zinc-800"
          >
            <dt>
              <code className="text-base font-semibold text-teal-800 sm:text-sm dark:text-teal-200">
                {hook.attribute}
              </code>
            </dt>
            <dd className="text-base/6 text-zinc-600 sm:text-sm dark:text-zinc-300">
              {hook.meaning}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
