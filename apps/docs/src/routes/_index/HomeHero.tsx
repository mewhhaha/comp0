import { ArrowRightIcon, CheckIcon, ChevronDownIcon } from "@heroicons/react/16/solid";
import type { ReactNode } from "react";
import { Link } from "react-router";

export type HomeHeroProps = {
  className?: string | undefined;
};

function PartTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`hidden items-center @[22rem]:flex ${className ?? ""}`}>
      <span
        aria-hidden="true"
        className="min-w-4 flex-1 border-t-2 border-dotted border-teal-600/50 dark:border-teal-400/40"
      />
      <span className="pl-2 font-mono text-xs/5 font-medium whitespace-nowrap text-teal-700 dark:text-teal-300">
        {children}
      </span>
    </div>
  );
}

function GuidedAnatomy() {
  return (
    <div
      aria-label="An open select component with its trigger, content, and option parts labelled"
      className="relative isolate overflow-hidden rounded-3xl bg-zinc-50 p-6 ring-1 ring-zinc-950/5 sm:p-8 dark:bg-white/3 dark:ring-white/10"
      role="img"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle,var(--color-zinc-200)_1px,transparent_1px)] bg-size-[16px_16px] dark:bg-[radial-gradient(circle,var(--color-zinc-700)_1px,transparent_1px)]"
      />
      <div className="grid gap-3">
        <div className="flex items-center">
          <div className="flex w-44 shrink-0 items-center justify-between rounded-xl bg-white px-4 py-2.5 text-base/7 font-medium text-zinc-950 shadow-sm ring-1 ring-zinc-950/10 @sm:w-52 dark:bg-zinc-800 dark:text-white dark:shadow-none dark:ring-white/10">
            Small
            <ChevronDownIcon aria-hidden="true" className="size-4 text-zinc-400" />
          </div>
          <PartTag className="flex-1">SelectTrigger</PartTag>
        </div>
        <div className="flex">
          <div className="grid w-44 shrink-0 gap-0.5 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-zinc-950/10 @sm:w-52 dark:bg-zinc-800 dark:shadow-none dark:ring-white/10">
            <p className="flex items-center justify-between rounded-lg bg-teal-600/10 px-3 py-1.5 text-base/7 font-medium text-teal-900 dark:bg-teal-400/10 dark:text-teal-100">
              Small
              <CheckIcon aria-hidden="true" className="size-4 text-teal-700 dark:text-teal-300" />
            </p>
            <p className="px-3 py-1.5 text-base/7 text-zinc-600 dark:text-zinc-300">Medium</p>
            <p className="px-3 py-1.5 text-base/7 text-zinc-600 dark:text-zinc-300">Large</p>
          </div>
          <div className="relative min-w-0 flex-1">
            <PartTag className="absolute inset-x-0 top-[26px] -translate-y-1/2">
              SelectOption
            </PartTag>
            <PartTag className="absolute inset-x-0 bottom-0 translate-y-1/2">SelectPopover</PartTag>
          </div>
        </div>
        <p className="font-mono text-xs/5 text-teal-700 @[22rem]:hidden dark:text-teal-300">
          SelectTrigger · SelectPopover · SelectOption
        </p>
      </div>
    </div>
  );
}

export function HomeHero({ className }: HomeHeroProps) {
  return (
    <section className={className}>
      <div className="grid items-center gap-10 lg:grid-cols-[5fr_4fr] lg:gap-14">
        <div className="min-w-0">
          <p className="font-mono text-sm/6 font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
            Headless React, explained slowly
          </p>
          <h1 className="mt-4 max-w-[18ch] text-5xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-6xl dark:text-white">
            Behavior you can see, understand, and make your own.
          </h1>
          <p className="mt-6 max-w-[54ch] text-lg/8 text-pretty text-zinc-600 dark:text-zinc-300">
            Think of comp0 as a box of working hinges, switches, and keyboard controls. We make the
            parts behave correctly. You decide what they look like.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 py-2.5 pr-2.5 pl-3.5 text-base/7 font-medium text-white ring-1 ring-teal-700 outline-none hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:bg-teal-400 dark:text-zinc-950 dark:ring-teal-400 dark:hover:bg-teal-300 dark:focus-visible:outline-teal-400"
              to="/learn/installation"
            >
              Start the guided tour
              <ArrowRightIcon aria-hidden="true" className="size-5 shrink-0 sm:size-4" />
            </Link>
            <Link
              className="rounded-lg px-3 py-2.5 text-base/7 font-medium text-zinc-700 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400"
              to="/components"
            >
              Browse every component
            </Link>
          </div>
        </div>
        <div className="@container min-w-0">
          <GuidedAnatomy />
        </div>
      </div>
    </section>
  );
}
