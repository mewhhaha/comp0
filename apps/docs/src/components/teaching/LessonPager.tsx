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
        "grid gap-3 border-t border-zinc-950/10 pt-6 sm:grid-cols-2 dark:border-white/10",
        className,
      )}
      aria-label="Lesson navigation"
    >
      {previous && (
        <Link
          to={previous.to}
          className="group rounded-xl border border-zinc-950/10 p-4 text-left outline-none hover:border-teal-700/30 hover:bg-teal-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-white/10 dark:hover:border-teal-300/20 dark:hover:bg-teal-400/5 dark:focus-visible:outline-teal-400"
        >
          <span className="flex items-center gap-2 text-base text-zinc-500 sm:text-sm dark:text-zinc-400">
            <ArrowLeft className="size-5 shrink-0 sm:size-4" aria-hidden="true" />
            Previous
          </span>
          <span className="mt-1 block font-medium text-zinc-950 group-hover:text-teal-800 dark:text-white dark:group-hover:text-teal-200">
            {previous.title}
          </span>
        </Link>
      )}
      {next && (
        <Link
          to={next.to}
          className="group rounded-xl border border-zinc-950/10 p-4 text-right outline-none hover:border-teal-700/30 hover:bg-teal-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:col-start-2 dark:border-white/10 dark:hover:border-teal-300/20 dark:hover:bg-teal-400/5 dark:focus-visible:outline-teal-400"
        >
          <span className="flex items-center justify-end gap-2 text-base text-zinc-500 sm:text-sm dark:text-zinc-400">
            Next
            <ArrowRight className="size-5 shrink-0 sm:size-4" aria-hidden="true" />
          </span>
          <span className="mt-1 block font-medium text-zinc-950 group-hover:text-teal-800 dark:text-white dark:group-hover:text-teal-200">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
