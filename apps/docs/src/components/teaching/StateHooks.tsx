import type { ComponentPart, StateHook } from "../../content/types.js";
import { cn } from "./cn.js";

type StateHooksProps = {
  hooks: StateHook[];
  parts: ComponentPart[];
  className?: string | undefined;
};

export function StateHooks({ hooks, parts, className }: StateHooksProps) {
  return (
    <section className={cn("max-w-full min-w-0", className)}>
      <h3 className="text-base font-semibold text-zinc-950 dark:text-white">Style hooks</h3>
      <p className="mt-1 max-w-[66ch] text-base/7 text-pretty text-zinc-600 sm:text-sm/6 dark:text-zinc-300">
        Attributes that appear while a state is true. Target them with Tailwind data variants such
        as <code className="font-mono text-teal-800 dark:text-teal-200">data-open:bg-zinc-100</code>
        , or with any CSS selector.
      </p>
      <div className="mt-6 grid gap-8">
        {parts.map((part) => {
          const partNames = part.name.split(" / ");
          const partHooks = hooks.filter((hook) => {
            const hookOwnerNames = hook.on.split(/[^A-Za-z0-9]+/);
            return partNames.some((partName) => hookOwnerNames.includes(partName));
          });
          if (partHooks.length === 0) return null;
          const hookRows = partHooks.flatMap((hook) =>
            hook.attribute.split(" / ").map((attribute) => ({
              ...hook,
              attribute: attribute as StateHook["attribute"],
            })),
          );

          return (
            <section
              key={part.name}
              className="min-w-0 border-t border-zinc-950/10 pt-6 first:border-t-0 first:pt-0 dark:border-white/10"
            >
              <h4 className="text-base font-semibold text-zinc-950 dark:text-white">
                <code className="font-mono text-teal-800 dark:text-teal-200">{part.name}</code>
              </h4>
              <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-950/10 dark:border-white/10">
                <table className="w-full min-w-xl border-collapse text-left">
                  <thead className="bg-zinc-50 dark:bg-white/5">
                    <tr className="border-b border-zinc-950/10 dark:border-white/10">
                      <th className="w-64 px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white">
                        Style hook
                      </th>
                      <th className="px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white">
                        Meaning
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-950/5 dark:divide-white/5">
                    {hookRows.map((hook) => (
                      <tr key={hook.attribute}>
                        <td className="px-3 py-2.5 align-top text-sm/6 whitespace-nowrap">
                          <code className="font-mono font-medium text-teal-800 dark:text-teal-200">
                            {hook.attribute}
                          </code>
                        </td>
                        <td className="px-3 py-2.5 align-top text-sm/6 text-zinc-600 dark:text-zinc-300">
                          {hook.meaning}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
