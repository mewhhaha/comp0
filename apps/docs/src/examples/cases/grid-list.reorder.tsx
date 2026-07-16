import { useState } from "react";
import { GridList, GridListDragHandle, GridListItem } from "@comp0/react";

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
  const [files, setFiles] = useState(["report.pdf", "photos.zip", "archive.tar", "notes.txt"]);

  return (
    <div className="flex max-w-sm flex-col gap-2">
      <GridList
        aria-label="Files"
        className="rounded border border-zinc-950/10 p-1 dark:border-white/10"
        onReorder={setFiles}
        canReorder={(next) => next.at(-1) === "notes.txt"}
      >
        {files.map((name) => (
          <GridListItem
            key={name}
            value={name}
            textValue={name}
            draggable={name !== "notes.txt"}
            data-pinned={name === "notes.txt" || undefined}
            className="relative cursor-grab select-none rounded-md px-2 py-1.5 outline-teal-600 transition-colors hover:bg-zinc-950/5 active:cursor-grabbing focus-visible:outline-2 data-dragging:cursor-grabbing data-dragging:bg-teal-500/10 data-dragging:outline data-dragging:outline-1 data-dragging:outline-dashed data-dragging:outline-teal-500 data-drag-previewing:-mb-9 data-drag-previewing:bg-transparent data-drag-previewing:opacity-0 data-drag-previewing:outline-none data-pinned:cursor-default data-selected:bg-teal-100 before:pointer-events-none before:mx-1 before:my-1 before:hidden before:h-9 before:items-center before:rounded-md before:border before:border-dashed before:border-teal-500 before:bg-teal-500/10 before:px-9 before:text-sm before:text-teal-700 before:content-[attr(data-drop-preview)] data-drop-before:before:flex after:pointer-events-none after:mx-1 after:my-1 after:hidden after:h-9 after:items-center after:rounded-md after:border after:border-dashed after:border-teal-500 after:bg-teal-500/10 after:px-9 after:text-sm after:text-teal-700 after:content-[attr(data-drop-preview)] data-drop-after:after:flex dark:outline-teal-400 dark:hover:bg-white/5 dark:data-selected:bg-teal-950 dark:before:text-teal-300 dark:after:text-teal-300 [&>[role=gridcell]]:flex [&>[role=gridcell]]:items-center [&>[role=gridcell]]:gap-2"
          >
            <GridListDragHandle
              aria-label={`Reorder ${name}`}
              className="cursor-grab rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 active:cursor-grabbing focus-visible:outline-2 dark:text-zinc-500 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            >
              <DragGrip />
            </GridListDragHandle>
            <span className="text-base text-zinc-800 sm:text-sm dark:text-zinc-100">{name}</span>
            {name === "notes.txt" && (
              <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Pinned
              </span>
            )}
          </GridListItem>
        ))}
      </GridList>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        Drag any non-interactive part of a row, or press Alt+Arrow. The named grip is an explicit
        drag affordance. notes.txt always stays last.
      </p>
    </div>
  );
}
