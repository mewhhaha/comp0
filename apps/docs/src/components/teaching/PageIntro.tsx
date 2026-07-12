import type { ComponentDoc, LearnDoc } from "../../content/types.js";
import { cn } from "./cn.js";

type PageIntroProps = {
  doc: Pick<ComponentDoc | LearnDoc, "title" | "summary">;
  eyebrow?: string | undefined;
  className?: string | undefined;
};

export function PageIntro({ doc, eyebrow, className }: PageIntroProps) {
  return (
    <header className={cn("max-w-3xl", className)}>
      {eyebrow && (
        <p className="text-base/7 font-medium text-zinc-500 sm:text-sm/6 dark:text-zinc-400">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl dark:text-white">
        {doc.title}
      </h1>
      <p className="mt-4 max-w-[48ch] text-lg/8 text-pretty text-zinc-600 dark:text-zinc-300">
        {doc.summary}
      </p>
    </header>
  );
}
