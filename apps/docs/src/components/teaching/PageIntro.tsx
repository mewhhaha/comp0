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
        <p className="font-mono text-sm/6 font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-5xl dark:text-zinc-50">
        {doc.title}
      </h1>
      <p className="mt-5 max-w-2xl text-lg/8 text-zinc-600 dark:text-zinc-300">{doc.summary}</p>
    </header>
  );
}
