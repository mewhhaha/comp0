import { useState } from "react";
import {
  Button,
  Checkbox,
  GridList,
  GridListDragHandle,
  GridListItem,
  GridListMoveButton,
  GridListReorderGroup,
} from "@comp0/react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@heroicons/react/16/solid";

const collections = [
  { name: "available", label: "Available", destination: "chosen" },
  { name: "chosen", label: "Chosen", destination: "available" },
] as const;

const frameworkById: Record<string, { name: string; description: string }> = {
  react: { name: "React", description: "Component library" },
  vue: { name: "Vue", description: "Progressive framework" },
  svelte: { name: "Svelte", description: "Compiler-based framework" },
  solid: { name: "Solid", description: "Fine-grained reactivity" },
  angular: { name: "Angular", description: "Application platform" },
};

const initialOrder: Record<string, string[]> = {
  available: ["vue", "svelte", "solid", "angular"],
  chosen: ["react"],
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
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);

  const moveSelected = (source: string, destination: string) => {
    const movingFrameworks = order[source]!.filter((frameworkId) =>
      selectedFrameworks.includes(frameworkId),
    );
    if (movingFrameworks.length === 0) return;

    setOrder((current) => ({
      ...current,
      [source]: current[source]!.filter((frameworkId) => !movingFrameworks.includes(frameworkId)),
      [destination]: [...current[destination]!, ...movingFrameworks],
    }));
    setSelectedFrameworks((current) =>
      current.filter((frameworkId) => !movingFrameworks.includes(frameworkId)),
    );
  };

  return (
    <GridListReorderGroup value={order} onChange={setOrder}>
      <div className="grid w-full max-w-3xl grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        {collections.map((collection, index) => (
          <div key={collection.name} className="contents">
            <section aria-labelledby={`${collection.name}-title`} className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <h3
                  id={`${collection.name}-title`}
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {collection.label}
                </h3>
                <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  {order[collection.name]!.length}
                </span>
              </div>
              <GridList
                name={collection.name}
                aria-labelledby={`${collection.name}-title`}
                className="flex min-h-64 flex-col gap-1.5 rounded-lg border border-dashed border-zinc-950/15 p-1.5 outline-none after:pointer-events-none after:order-1 after:hidden after:min-h-12 after:items-center after:justify-center after:rounded-lg after:border after:border-dashed after:border-teal-500 after:bg-teal-500/10 after:px-2 after:text-xs after:font-medium after:text-teal-700 after:content-[attr(data-drop-preview)] focus-within:border-teal-500/50 data-drop-target:border-teal-500 dark:border-white/15 dark:after:text-teal-300 [&[data-drop-target]:not(:has([data-drag-previewing]))]:after:flex"
              >
                {order[collection.name]!.map((frameworkId) => {
                  const framework = frameworkById[frameworkId]!;
                  const checked = selectedFrameworks.includes(frameworkId);

                  return (
                    <GridListItem
                      key={frameworkId}
                      value={frameworkId}
                      textValue={framework.name}
                      className="cursor-grab select-none rounded-md border border-zinc-950/10 bg-white shadow-sm outline-teal-600 focus-visible:outline-2 data-dragging:border-dashed data-dragging:border-teal-500 data-dragging:shadow-none data-drop-before:order-2 dark:border-white/10 dark:bg-zinc-950 dark:outline-teal-400 [&>[role=gridcell]]:grid [&>[role=gridcell]]:grid-cols-[auto_1fr_auto] [&>[role=gridcell]]:items-center [&>[role=gridcell]]:gap-2 [&>[role=gridcell]]:p-2 [[data-drop-after]~&:not([data-drag-previewing])]:order-2 [[data-drop-before]~&:not([data-drag-previewing])]:order-2 [[role=grid][data-drop-target]_&[data-drag-previewing]]:order-1 [[role=grid]:not([data-drop-target])_&[data-drag-previewing]]:opacity-40"
                    >
                      <GridListDragHandle
                        aria-label={`Drag ${framework.name}`}
                        className="cursor-grab rounded p-0.5 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                      >
                        <DragGrip />
                      </GridListDragHandle>
                      <Checkbox
                        checked={checked}
                        onChange={(nextChecked) =>
                          setSelectedFrameworks((current) => {
                            if (nextChecked) return [...current, frameworkId];
                            return current.filter((value) => value !== frameworkId);
                          })
                        }
                        className="group flex min-w-0 cursor-pointer items-center gap-2 rounded outline-none"
                      >
                        <span className="grid size-4 shrink-0 place-items-center rounded-sm border border-zinc-950/20 bg-white text-white ring-2 ring-transparent group-data-focus-visible:ring-teal-600 group-data-checked:border-teal-600 group-data-checked:bg-teal-600 dark:border-white/20 dark:bg-zinc-900 dark:group-data-focus-visible:ring-teal-400 dark:group-data-checked:border-teal-400 dark:group-data-checked:bg-teal-400">
                          {checked && <CheckIcon className="size-3" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {framework.name}
                          </span>
                          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {framework.description}
                          </span>
                        </span>
                      </Checkbox>
                      <GridListMoveButton
                        to={collection.destination}
                        aria-label={`Move ${framework.name} to ${collection.destination}`}
                        className="cursor-pointer rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 focus-visible:outline-2 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                      >
                        {collection.name === "available" ? (
                          <ArrowRightIcon className="size-4" aria-hidden="true" />
                        ) : (
                          <ArrowLeftIcon className="size-4" aria-hidden="true" />
                        )}
                      </GridListMoveButton>
                    </GridListItem>
                  );
                })}
              </GridList>
            </section>
            {index === 0 && (
              <div className="flex justify-center gap-2 md:flex-col">
                <Button
                  disabled={
                    !order.available!.some((frameworkId) =>
                      selectedFrameworks.includes(frameworkId),
                    )
                  }
                  onClick={() => moveSelected("available", "chosen")}
                  className="select-none rounded border border-zinc-950/10 px-2.5 py-2 text-sm text-zinc-700 outline-teal-600 hover:bg-zinc-950/5 focus-visible:outline-2 disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:outline-teal-400 dark:hover:bg-white/5"
                >
                  Add selected <ArrowRightIcon className="ml-1 inline size-4" aria-hidden="true" />
                </Button>
                <Button
                  disabled={
                    !order.chosen!.some((frameworkId) => selectedFrameworks.includes(frameworkId))
                  }
                  onClick={() => moveSelected("chosen", "available")}
                  className="select-none rounded border border-zinc-950/10 px-2.5 py-2 text-sm text-zinc-700 outline-teal-600 hover:bg-zinc-950/5 focus-visible:outline-2 disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:outline-teal-400 dark:hover:bg-white/5"
                >
                  <ArrowLeftIcon className="mr-1 inline size-4" aria-hidden="true" /> Remove
                  selected
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </GridListReorderGroup>
  );
}
