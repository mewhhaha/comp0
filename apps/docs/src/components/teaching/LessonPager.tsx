"use client";

import { Link } from "@comp0/react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/16/solid";
import { Link as RouterLink } from "react-router";
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
        `
          grid gap-3 border-t border-zinc-950/10 pt-6
          sm:grid-cols-2
          dark:border-white/10
        `,
        className,
      )}
      aria-label="Lesson navigation"
    >
      {previous && (
        <Link
          as={RouterLink}
          to={previous.to}
          className="group rounded-xl border border-zinc-950/10 p-4 text-left outline-none data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-teal-600 data-hovered:border-teal-700/30 data-hovered:bg-teal-50/50 dark:border-white/10 dark:data-focus-visible:outline-teal-400 dark:data-hovered:border-teal-300/20 dark:data-hovered:bg-teal-400/5"
        >
          <span className="flex items-center gap-2 text-base text-zinc-500 sm:text-sm dark:text-zinc-400">
            <ArrowLeftIcon className="size-5 shrink-0 sm:size-4" aria-hidden="true" />
            Previous
          </span>
          <span className="mt-1 block font-medium text-zinc-950 group-data-hovered:text-teal-800 dark:text-white dark:group-data-hovered:text-teal-200">
            {previous.title}
          </span>
        </Link>
      )}
      {next && (
        <Link
          as={RouterLink}
          to={next.to}
          className="group rounded-xl border border-zinc-950/10 p-4 text-right outline-none data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-teal-600 data-hovered:border-teal-700/30 data-hovered:bg-teal-50/50 sm:col-start-2 dark:border-white/10 dark:data-focus-visible:outline-teal-400 dark:data-hovered:border-teal-300/20 dark:data-hovered:bg-teal-400/5"
        >
          <span className="flex items-center justify-end gap-2 text-base text-zinc-500 sm:text-sm dark:text-zinc-400">
            Next
            <ArrowRightIcon className="size-5 shrink-0 sm:size-4" aria-hidden="true" />
          </span>
          <span className="mt-1 block font-medium text-zinc-950 group-data-hovered:text-teal-800 dark:text-white dark:group-data-hovered:text-teal-200">
            {next.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
