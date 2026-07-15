import type { LessonStep } from "../../content/types.js";
import { CodeBlock } from "./CodeBlock.js";
import { cn } from "./cn.js";

type StepListProps = {
  steps: LessonStep[];
  className?: string | undefined;
};

export function StepList({ steps, className }: StepListProps) {
  return (
    <ol
      className={cn(
        `
          max-w-full min-w-0 divide-y divide-zinc-950/5
          dark:divide-white/10
        `,
        className,
      )}
      role="list"
    >
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 py-6 first:pt-0 last:pb-0 sm:grid-cols-[2rem_minmax(0,1fr)]"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-teal-100 text-base font-semibold text-teal-800 tabular-nums sm:text-sm dark:bg-teal-950 dark:text-teal-200">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white">{step.title}</h3>
            <p className="mt-2 max-w-[66ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
              {step.explanation}
            </p>
            {step.code && <CodeBlock code={step.code} language={step.language} className="mt-4" />}
          </div>
        </li>
      ))}
    </ol>
  );
}
