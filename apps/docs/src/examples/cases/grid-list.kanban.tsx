import { useState } from "react";
import {
  GridList,
  GridListDragHandle,
  GridListItem,
  GridListMoveButton,
  GridListReorderGroup,
} from "@comp0/react";
import { ArrowLeftIcon, ArrowRightIcon, Bars2Icon } from "@heroicons/react/16/solid";

const stages = [
  { name: "todo", label: "To do" },
  { name: "doing", label: "In progress" },
  { name: "done", label: "Done" },
];

const taskById: Record<string, { title: string; detail: string }> = {
  search: { title: "Improve search", detail: "Add recent queries and clearer results." },
  contrast: { title: "Review contrast", detail: "Check the new dashboard tokens." },
  empty: { title: "Design empty states", detail: "Cover first-run project screens." },
};

const initialOrder: Record<string, string[]> = {
  todo: ["search", "contrast"],
  doing: ["empty"],
  done: [],
};

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
              className="min-w-0 rounded-lg bg-zinc-950/[0.03] p-2 dark:bg-white/[0.04]"
            >
              <header className="mb-2 flex items-baseline justify-between gap-2 px-1">
                <h3
                  id={`${stage.name}-title`}
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {stage.label}
                </h3>
                <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  {tasks.length}
                </span>
              </header>
              <GridList
                name={stage.name}
                aria-labelledby={`${stage.name}-title`}
                className="flex min-h-36 flex-col gap-2 rounded-md outline-none ring-teal-500/70 transition data-drop-target:ring-2 data-drop-target:ring-inset"
              >
                {tasks.map((taskId) => {
                  const task = taskById[taskId]!;
                  return (
                    <GridListItem
                      key={taskId}
                      value={taskId}
                      textValue={task.title}
                      className="rounded-md bg-white p-2 shadow-sm ring-1 ring-zinc-950/10 outline-teal-600 data-dragging:opacity-40 data-drop-after:shadow-[0_2px_0_0_var(--color-teal-600)] data-drop-before:shadow-[0_-2px_0_0_var(--color-teal-600)] focus-visible:outline-2 dark:bg-zinc-900 dark:ring-white/10 dark:outline-teal-400 dark:data-drop-after:shadow-[0_2px_0_0_var(--color-teal-400)] dark:data-drop-before:shadow-[0_-2px_0_0_var(--color-teal-400)] [&>[role=gridcell]]:grid [&>[role=gridcell]]:grid-cols-[auto_1fr_auto] [&>[role=gridcell]]:items-start [&>[role=gridcell]]:gap-2"
                    >
                      <GridListDragHandle className="cursor-grab rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-white/5">
                        <Bars2Icon className="size-4" aria-hidden="true" />
                      </GridListDragHandle>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {task.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                          {task.detail}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {previous && (
                          <GridListMoveButton
                            to={previous.name}
                            aria-label={`Move ${task.title} to ${previous.label}`}
                            className="rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                          >
                            <ArrowLeftIcon className="size-4" aria-hidden="true" />
                          </GridListMoveButton>
                        )}
                        {next && (
                          <GridListMoveButton
                            to={next.name}
                            aria-label={`Move ${task.title} to ${next.label}`}
                            className="rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
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
