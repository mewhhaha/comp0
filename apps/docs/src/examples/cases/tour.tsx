import { Fragment } from "react";
import { Button, PopoverArrow, Tour, TourOverlay, TourTrigger } from "@comp0/react";

const projectTour = [
  {
    target: "project-search",
    title: "Find anything",
    description: "Search projects, people, and recent activity from one place.",
    placement: "bottom" as const,
  },
  {
    target: "project-notifications",
    title: "Review updates",
    description: "Notifications collect mentions and changes that need your attention.",
    placement: "bottom" as const,
  },
  {
    target: "new-project",
    title: "Create a project",
    description: "Start with a blank project or one of your team templates.",
    placement: "bottom" as const,
  },
];

export function Example() {
  return (
    <Tour steps={projectTour}>
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Project space
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The tour content stays separate from these controls.
            </p>
          </div>
          <TourTrigger as={Fragment}>
            <Button className="select-none rounded bg-teal-700 px-3 py-2 text-sm font-medium text-white outline-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-teal-400 dark:text-zinc-950 dark:outline-teal-400">
              Start tour
            </Button>
          </TourTrigger>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-950/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900/60">
          <Button
            data-tour-target="project-search"
            className="relative select-none rounded-lg border border-zinc-950/10 bg-white px-3 py-5 text-sm font-medium text-zinc-700 outline-teal-600 hover:border-teal-500/50 focus-visible:outline-2 data-tour-active:z-10 data-tour-active:border-teal-500 data-tour-active:text-teal-800 data-tour-active:shadow-[0_0_0_4px_var(--color-teal-500),0_0_0_9999px_rgb(0_0_0/0.55)] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:outline-teal-400 dark:data-tour-active:text-teal-200"
          >
            Search
          </Button>
          <Button
            data-tour-target="project-notifications"
            className="relative select-none rounded-lg border border-zinc-950/10 bg-white px-3 py-5 text-sm font-medium text-zinc-700 outline-teal-600 hover:border-teal-500/50 focus-visible:outline-2 data-tour-active:z-10 data-tour-active:border-teal-500 data-tour-active:text-teal-800 data-tour-active:shadow-[0_0_0_4px_var(--color-teal-500),0_0_0_9999px_rgb(0_0_0/0.55)] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:outline-teal-400 dark:data-tour-active:text-teal-200"
          >
            Notifications
          </Button>
          <Button
            data-tour-target="new-project"
            className="relative select-none rounded-lg border border-zinc-950/10 bg-white px-3 py-5 text-sm font-medium text-zinc-700 outline-teal-600 hover:border-teal-500/50 focus-visible:outline-2 data-tour-active:z-10 data-tour-active:border-teal-500 data-tour-active:text-teal-800 data-tour-active:shadow-[0_0_0_4px_var(--color-teal-500),0_0_0_9999px_rgb(0_0_0/0.55)] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200 dark:outline-teal-400 dark:data-tour-active:text-teal-200"
          >
            New project
          </Button>
        </div>
        <TourOverlay
          offset={12}
          className="z-20 w-72 rounded-lg border-0 bg-white p-4 text-sm shadow-xl ring-1 ring-zinc-950/10 backdrop:bg-transparent dark:bg-zinc-900 dark:ring-white/10"
        >
          {({ step, stepIndex, stepCount, first, last, previous, next, close }) => (
            <>
              <PopoverArrow className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-white dark:bg-zinc-900" />
              <p className="mb-1 text-xs font-medium text-teal-700 dark:text-teal-300">
                Step {stepIndex + 1} of {stepCount}
              </p>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{step.title}</h4>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{step.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  onClick={close}
                  className="select-none rounded px-2 py-1.5 text-zinc-600 outline-teal-600 hover:bg-zinc-950/5 focus-visible:outline-2 dark:text-zinc-300 dark:outline-teal-400 dark:hover:bg-white/5"
                >
                  Skip tour
                </Button>
                <div className="flex gap-2">
                  {!first && (
                    <Button
                      onClick={previous}
                      className="select-none rounded border border-zinc-950/10 px-2.5 py-1.5 text-zinc-700 outline-teal-600 hover:bg-zinc-950/5 focus-visible:outline-2 dark:border-white/10 dark:text-zinc-200 dark:outline-teal-400 dark:hover:bg-white/5"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={next}
                    className="select-none rounded bg-teal-700 px-2.5 py-1.5 font-medium text-white outline-teal-600 focus-visible:outline-2 dark:bg-teal-400 dark:text-zinc-950 dark:outline-teal-400"
                  >
                    {last ? "Finish" : "Next"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </TourOverlay>
      </div>
    </Tour>
  );
}
