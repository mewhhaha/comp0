import type { ReactNode } from "react";

export type ComponentSectionProps = {
  children: ReactNode;
  description: string;
  id: string;
  number: string;
  title: string;
  className?: string | undefined;
};

export function ComponentSection({
  children,
  description,
  id,
  number,
  title,
  className,
}: ComponentSectionProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`min-w-0 max-w-full scroll-mt-24 border-t border-zinc-950/10 pt-10 dark:border-white/10 ${className ?? ""}`}
      id={id}
    >
      <div className="flex items-start gap-4">
        <p className="shrink-0 font-mono text-sm/6 text-teal-700 tabular-nums dark:text-teal-300">
          {number}
        </p>
        <div className="min-w-0">
          <h2
            className="max-w-[28ch] text-2xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-3xl dark:text-white"
            id={`${id}-title`}
          >
            {title}
          </h2>
          <p className="mt-3 max-w-[64ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-7 max-w-full min-w-0">{children}</div>
    </section>
  );
}
