import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "./cn.js";

type LessonLink = { title: string; to: string };

type LessonPagerProps = {
  previous?: LessonLink | undefined;
  next?: LessonLink | undefined;
  className?: string | undefined;
};

export function LessonPager({ previous, next, className }: LessonPagerProps) {
  return (
    <nav
      className={cn(
        "grid gap-3 border-t border-zinc-200 pt-6 sm:grid-cols-2 dark:border-zinc-700",
        className,
      )}
      aria-label="Lesson navigation"
    >
      {previous && (
        <Link
          to={previous.to}
          className="group rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <span className="flex items-center gap-2 text-base text-zinc-500 sm:text-sm dark:text-zinc-400">
            <ArrowLeft className="size-6" aria-hidden="true" />
            Previous
          </span>
          <span className="mt-1 block font-semibold text-zinc-950 group-hover:text-teal-700 dark:text-zinc-50 dark:group-hover:text-teal-300">
            {previous.title}
          </span>
        </Link>
      )}
      {next && (
        <Link
          to={next.to}
          className="group rounded-xl border border-zinc-200 bg-white p-4 text-right transition hover:border-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:col-start-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <span className="flex items-center justify-end gap-2 text-base text-zinc-500 sm:text-sm dark:text-zinc-400">
            Next
            <ArrowRight className="size-6" aria-hidden="true" />
          </span>
          <span className="mt-1 block font-semibold text-zinc-950 group-hover:text-teal-700 dark:text-zinc-50 dark:group-hover:text-teal-300">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
