import { useState } from "react";
import {
  GridList,
  GridListDragHandle,
  GridListItem,
  GridListMoveButton,
  GridListReorderGroup,
} from "@comp0/react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/16/solid";

const stages = [
  { name: "todo", label: "To do", accentClassName: "bg-amber-500 ring-amber-500/15" },
  { name: "doing", label: "In progress", accentClassName: "bg-sky-500 ring-sky-500/15" },
  { name: "done", label: "Done", accentClassName: "bg-emerald-500 ring-emerald-500/15" },
];

const taskById: Record<
  string,
  {
    title: string;
    detail: string;
    label: string;
    labelClassName: string;
    progress: string;
    owner: string;
  }
> = {
  search: {
    title: "Improve search",
    detail: "Add recent queries and clearer results.",
    label: "Research",
    labelClassName: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    progress: "3/5",
    owner: "AM",
  },
  contrast: {
    title: "Review contrast",
    detail: "Check the new dashboard tokens.",
    label: "Design",
    labelClassName: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    progress: "4/4",
    owner: "RH",
  },
  empty: {
    title: "Design empty states",
    detail: "Cover first-run project screens.",
    label: "Product",
    labelClassName: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    progress: "1/3",
    owner: "SL",
  },
};

const initialOrder: Record<string, string[]> = {
  todo: ["search", "contrast"],
  doing: ["empty"],
  done: [],
};

function DragGrip() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 18" fill="currentColor" className="size-4">
      <circle cx="3" cy="3" r="1.25" />
      <circle cx="9" cy="3" r="1.25" />
      <circle cx="3" cy="9" r="1.25" />
      <circle cx="9" cy="9" r="1.25" />
      <circle cx="3" cy="15" r="1.25" />
      <circle cx="9" cy="15" r="1.25" />
    </svg>
  );
}

export function Example() {
  const [order, setOrder] = useState(initialOrder);

  return (
    <GridListReorderGroup value={order} onChange={setOrder}>
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        {stages.map((stage, index) => {
          const previous = stages[index - 1];
          const next = stages[index + 1];
          const tasks = order[stage.name]!;

          return (
            <section
              key={stage.name}
              aria-labelledby={`${stage.name}-title`}
              className="min-w-0 rounded-xl bg-zinc-100/80 p-2.5 dark:bg-zinc-900/80"
            >
              <header className="mb-2 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`size-2 rounded-full ring-4 ${stage.accentClassName}`}
                  />
                  <h3
                    id={`${stage.name}-title`}
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                  >
                    {stage.label}
                  </h3>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-600 shadow-sm ring-1 ring-zinc-950/10 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-white/10">
                  {tasks.length}
                </span>
              </header>
              <GridList
                name={stage.name}
                aria-labelledby={`${stage.name}-title`}
                className="flex min-h-40 flex-col gap-2 rounded-lg border border-dashed border-zinc-950/10 p-1 outline-none transition data-drop-target:border-teal-500 data-drop-target:bg-teal-50/80 data-drop-target:shadow-[inset_0_0_0_1px_var(--color-teal-500)] focus-within:border-teal-500/50 dark:border-white/10 dark:data-drop-target:bg-teal-950/40"
              >
                {tasks.map((taskId) => {
                  const task = taskById[taskId]!;
                  return (
                    <GridListItem
                      key={taskId}
                      value={taskId}
                      textValue={task.title}
                      className="relative cursor-grab select-none rounded-lg border border-zinc-950/10 bg-white p-2.5 shadow-sm outline-teal-600 transition hover:-translate-y-px hover:shadow-md active:cursor-grabbing focus-visible:outline-2 data-dragging:cursor-grabbing data-dragging:scale-[0.98] data-dragging:opacity-45 before:pointer-events-none before:absolute before:inset-x-4 before:-top-1 before:z-10 before:h-1 before:rounded-full before:bg-teal-500 before:opacity-0 before:ring-4 before:ring-teal-500/15 before:transition-opacity data-drop-before:before:opacity-100 after:pointer-events-none after:absolute after:inset-x-4 after:-bottom-1 after:z-10 after:h-1 after:rounded-full after:bg-teal-500 after:opacity-0 after:ring-4 after:ring-teal-500/15 after:transition-opacity data-drop-after:after:opacity-100 dark:border-white/10 dark:bg-zinc-950 dark:outline-teal-400 [&>[role=gridcell]]:grid [&>[role=gridcell]]:grid-cols-[auto_1fr_auto] [&>[role=gridcell]]:items-start [&>[role=gridcell]]:gap-2"
                    >
                      <GridListDragHandle
                        aria-label={`Drag ${task.title}`}
                        className="cursor-grab rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 active:cursor-grabbing focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                      >
                        <DragGrip />
                      </GridListDragHandle>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {task.detail}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${task.labelClassName}`}
                            >
                              {task.label}
                            </span>
                            <span
                              aria-label={`${task.progress} subtasks complete`}
                              className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400"
                            >
                              {task.progress}
                            </span>
                          </div>
                          <span
                            aria-label={`Assigned to ${task.owner}`}
                            className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                          >
                            {task.owner}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {previous && (
                          <GridListMoveButton
                            to={previous.name}
                            aria-label={`Move ${task.title} to ${previous.label}`}
                            className="cursor-pointer rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                          >
                            <ArrowLeftIcon className="size-4" aria-hidden="true" />
                          </GridListMoveButton>
                        )}
                        {next && (
                          <GridListMoveButton
                            to={next.name}
                            aria-label={`Move ${task.title} to ${next.label}`}
                            className="cursor-pointer rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                          >
                            <ArrowRightIcon className="size-4" aria-hidden="true" />
                          </GridListMoveButton>
                        )}
                      </div>
                    </GridListItem>
                  );
                })}
              </GridList>
            </section>
          );
        })}
      </div>
    </GridListReorderGroup>
  );
}
