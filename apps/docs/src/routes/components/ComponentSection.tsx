import type { ReactNode } from "react";

export type ComponentSectionProps = {
  children: ReactNode;
  id: string;
  title: string;
  description?: string | undefined;
  className?: string | undefined;
};

export function ComponentSection({
  children,
  id,
  title,
  description,
  className,
}: ComponentSectionProps) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`min-w-0 max-w-full scroll-mt-24 ${className ?? ""}`}
      id={id}
    >
      <h2
        className="text-2xl font-semibold tracking-tight text-balance text-zinc-950 dark:text-white"
        id={`${id}-title`}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-[64ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
          {description}
        </p>
      )}
      <div className="mt-6 max-w-full min-w-0">{children}</div>
    </section>
  );
}
