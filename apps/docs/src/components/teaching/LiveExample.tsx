import type { ReactNode } from "react";
import { PanelTopOpen } from "lucide-react";
import { cn } from "./cn.js";

type LiveExampleProps = {
  children: ReactNode;
  title?: string | undefined;
  description?: string | undefined;
  className?: string | undefined;
};

export function LiveExample({
  children,
  title = "Try it",
  description,
  className,
}: LiveExampleProps) {
  return (
    <section
      className={cn(
        "max-w-full min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
      aria-label={title}
    >
      <div className="flex items-start gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <PanelTopOpen
          className="size-6 shrink-0 text-teal-700 dark:text-teal-300"
          aria-hidden="true"
        />
        <div>
          <h3 className="font-semibold text-zinc-950 dark:text-white">{title}</h3>
          {description && (
            <p className="mt-1 text-base text-zinc-600 sm:text-sm dark:text-zinc-300">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
