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
      className={cn("max-w-full min-w-0 divide-y divide-zinc-200 dark:divide-zinc-800", className)}
      role="list"
    >
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 py-6 first:pt-0 last:pb-0 sm:grid-cols-[2.5rem_minmax(0,1fr)]"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">{step.title}</h3>
            <p className="mt-2 leading-7 text-zinc-600 dark:text-zinc-300">{step.explanation}</p>
            {step.code && <CodeBlock code={step.code} language={step.language} className="mt-4" />}
          </div>
        </li>
      ))}
    </ol>
  );
}
