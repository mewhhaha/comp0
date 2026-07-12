import { useState } from "react";
import { GridList, GridListDragHandle, GridListItem } from "@comp0/react";
import { Bars2Icon } from "@heroicons/react/16/solid";

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
            className="rounded px-2 py-1.5 outline-teal-600 focus-visible:outline-2 data-dragging:opacity-40 data-drop-after:shadow-[0_2px_0_0_var(--color-teal-600)] data-drop-before:shadow-[0_-2px_0_0_var(--color-teal-600)] data-selected:bg-teal-100 dark:outline-teal-400 dark:data-drop-after:shadow-[0_2px_0_0_var(--color-teal-400)] dark:data-drop-before:shadow-[0_-2px_0_0_var(--color-teal-400)] dark:data-selected:bg-teal-950 [&>[role=gridcell]]:flex [&>[role=gridcell]]:items-center [&>[role=gridcell]]:gap-2"
          >
            <GridListDragHandle className="cursor-grab rounded p-1 text-zinc-400 outline-teal-600 hover:bg-zinc-950/5 hover:text-zinc-700 focus-visible:outline-2 dark:text-zinc-500 dark:outline-teal-400 dark:hover:bg-white/5 dark:hover:text-zinc-200">
              <Bars2Icon className="size-4" aria-hidden="true" />
            </GridListDragHandle>
            <span className="text-base text-zinc-800 sm:text-sm dark:text-zinc-100">{name}</span>
          </GridListItem>
        ))}
      </GridList>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        Drag a handle or press Alt+Arrow. notes.txt always stays last.
      </p>
    </div>
  );
}
