import { ArrowRight, Check, ChevronDown } from "lucide-react";
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
          <div className="flex w-44 shrink-0 items-center justify-between rounded-xl bg-white px-4 py-2.5 text-base/7 font-medium text-zinc-950 shadow-sm ring-1 ring-zinc-950/10 @sm:w-52 dark:bg-zinc-800 dark:text-white dark:ring-white/10">
            Small
            <ChevronDown aria-hidden="true" className="size-4 text-zinc-400" />
          </div>
          <PartTag className="flex-1">SelectTrigger</PartTag>
        </div>
        <div className="flex">
          <div className="grid w-44 shrink-0 gap-0.5 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-zinc-950/10 @sm:w-52 dark:bg-zinc-800 dark:ring-white/10">
            <p className="flex items-center justify-between rounded-lg bg-teal-600/10 px-3 py-1.5 text-base/7 font-medium text-teal-900 dark:bg-teal-400/10 dark:text-teal-100">
              Small
              <Check aria-hidden="true" className="size-4 text-teal-700 dark:text-teal-300" />
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

function AtlasAnatomy() {
  return (
    <div
      aria-label="A blueprint that separates state, visible parts, browser semantics, and styling hooks"
      className="rounded-[min(2vw,var(--radius-2xl))] bg-teal-950 p-4 text-white ring-1 ring-teal-900 sm:p-6 dark:bg-zinc-900 dark:ring-white/10"
      role="img"
    >
      <p className="font-mono text-sm/6 text-teal-200">One component, four small jobs</p>
      <div className="mt-4 grid gap-px overflow-hidden rounded-xl bg-white/15 @sm:grid-cols-2">
        {[
          ["1", "Root", "Remembers what is open and selected."],
          ["2", "Parts", "Render the trigger, value, list, and options."],
          ["3", "Browser", "Receives focus, keys, names, and values."],
          ["4", "Your CSS", "Paints every state using data attributes."],
        ].map(([number, title, description]) => (
          <div className="min-w-0 bg-teal-950 p-4 dark:bg-zinc-900" key={title}>
            <p className="font-mono text-sm/6 text-teal-200">{number}</p>
            <p className="mt-4 text-lg font-medium">{title}</p>
            <p className="mt-1 text-base/7 text-teal-100/75">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeHero({ className }: HomeHeroProps) {
  return (
    <section className={className}>
      <div className="contents" data-uidotsh-pick="Docs opening">
        <div className="contents" data-uidotsh-option="Guided workshop">
          <div className="grid items-center gap-10 lg:grid-cols-[5fr_4fr] lg:gap-14">
            <div className="min-w-0">
              <p className="font-mono text-sm/6 font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
                Headless React, explained slowly
              </p>
              <h1 className="mt-4 max-w-[18ch] text-5xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-6xl dark:text-white">
                Behavior you can see, understand, and make your own.
              </h1>
              <p className="mt-6 max-w-[54ch] text-lg/8 text-pretty text-zinc-600 dark:text-zinc-300">
                Think of comp0 as a box of working hinges, switches, and keyboard controls. We make
                the parts behave correctly. You decide what they look like.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 py-2.5 pr-3 pl-4 text-base/7 font-medium text-white ring-1 ring-teal-700 outline-none hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:bg-teal-400 dark:text-zinc-950 dark:ring-teal-400 dark:hover:bg-teal-300 dark:focus-visible:outline-teal-400"
                  to="/learn/installation"
                >
                  Start the guided tour
                  <ArrowRight aria-hidden="true" className="size-6 shrink-0" />
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
        </div>

        <div className="contents" data-uidotsh-option="Visual field guide" hidden>
          <div className="grid items-center gap-10 lg:grid-cols-[4fr_5fr] lg:gap-14">
            <div className="min-w-0 lg:order-2">
              <p className="font-mono text-sm/6 font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
                A field guide to headless UI
              </p>
              <h1 className="mt-4 max-w-[18ch] text-5xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-6xl dark:text-white">
                Open the box. Name every part. Build with confidence.
              </h1>
              <p className="mt-6 max-w-[54ch] text-lg/8 text-pretty text-zinc-600 dark:text-zinc-300">
                Each guide turns an invisible behavior contract into a small map: what remembers
                state, what renders DOM, which keys work, and where your styles attach.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 py-2.5 pr-3 pl-4 text-base/7 font-medium text-white ring-1 ring-teal-700 outline-none hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:bg-teal-400 dark:text-zinc-950 dark:ring-teal-400 dark:hover:bg-teal-300 dark:focus-visible:outline-teal-400"
                  to="/components/select"
                >
                  Open the first field guide
                  <ArrowRight aria-hidden="true" className="size-6 shrink-0" />
                </Link>
                <Link
                  className="rounded-lg px-3 py-2.5 text-base/7 font-medium text-zinc-700 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400"
                  to="/learn/composition"
                >
                  Learn composition first
                </Link>
              </div>
            </div>
            <div className="@container min-w-0 lg:order-1">
              <AtlasAnatomy />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
