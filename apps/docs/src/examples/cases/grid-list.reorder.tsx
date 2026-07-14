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
            className="relative cursor-grab select-none rounded-md px-2 py-1.5 outline-teal-600 transition-colors hover:bg-zinc-950/5 active:cursor-grabbing focus-visible:outline-2 data-dragging:cursor-grabbing data-dragging:opacity-45 data-selected:bg-teal-100 before:pointer-events-none before:absolute before:inset-x-3 before:-top-1 before:z-10 before:h-1 before:rounded-full before:bg-teal-500 before:opacity-0 before:ring-4 before:ring-teal-500/15 before:transition-opacity data-drop-before:before:opacity-100 after:pointer-events-none after:absolute after:inset-x-3 after:-bottom-1 after:z-10 after:h-1 after:rounded-full after:bg-teal-500 after:opacity-0 after:ring-4 after:ring-teal-500/15 after:transition-opacity data-drop-after:after:opacity-100 dark:outline-teal-400 dark:hover:bg-white/5 dark:data-selected:bg-teal-950 [&>[role=gridcell]]:flex [&>[role=gridcell]]:items-center [&>[role=gridcell]]:gap-2"
          >
            <GridListDragHandle
              aria-label={`Reorder ${name}`}
              className="cursor-grab rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 active:cursor-grabbing focus-visible:outline-2 dark:text-zinc-500 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            >
              <DragGrip />
            </GridListDragHandle>
            <span className="text-base text-zinc-800 sm:text-sm dark:text-zinc-100">{name}</span>
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
