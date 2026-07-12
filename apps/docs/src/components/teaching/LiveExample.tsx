import type { ReactNode } from "react";
import { cn } from "./cn.js";

type LiveExampleProps = {
  children: ReactNode;
  title?: string | undefined;
  className?: string | undefined;
};

export function LiveExample({ children, title = "Live example", className }: LiveExampleProps) {
  return (
    <section
      className={cn(
        "max-w-full min-w-0 rounded-xl border border-zinc-950/10 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-zinc-900",
        className,
      )}
      aria-label={title}
    >
      {children}
    </section>
  );
}
