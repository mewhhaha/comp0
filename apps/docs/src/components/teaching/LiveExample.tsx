"use client";

import { Suspense } from "react";
import { exampleRegistry } from "../../examples/registry.js";
import { cn } from "./cn.js";

type LiveExampleProps = {
  slug: string;
  title?: string | undefined;
  className?: string | undefined;
};

export function LiveExample({ slug, title = "Live example", className }: LiveExampleProps) {
  const Example = exampleRegistry[slug];

  return (
    <section
      className={cn(
        `
          max-w-full min-w-0 rounded-xl border border-zinc-950/10 bg-white p-6
          sm:p-8
          dark:border-white/10 dark:bg-zinc-900
        `,
        className,
      )}
      aria-label={title}
    >
      <Suspense fallback={<output>Loading example…</output>}>
        {Example ? <Example /> : <p>Example unavailable.</p>}
      </Suspense>
    </section>
  );
}
