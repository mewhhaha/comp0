import { useState } from "react";
import { Button, GridList, GridListItem } from "@comp0/react";

const files = [
  { name: "Product brief.pdf", detail: "PDF · Updated 12 minutes ago", access: "Team" },
  { name: "Homepage concepts.fig", detail: "Figma · Updated yesterday", access: "Design" },
  { name: "Launch checklist.md", detail: "Markdown · Updated Friday", access: "Private" },
];

export function Example() {
  const [selected, setSelected] = useState(files[0]!.name);
  const [sharedFile, setSharedFile] = useState<string>();

  return (
    <div className="flex max-w-xl flex-col gap-2">
      <GridList
        aria-label="Recent files"
        className="rounded-xl border border-zinc-950/10 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-900"
        value={selected}
        onChange={setSelected}
      >
        {files.map((file) => (
          <GridListItem
            key={file.name}
            value={file.name}
            textValue={file.name}
            className="cursor-pointer rounded-lg px-3 py-2.5 outline-teal-600 transition-colors hover:bg-zinc-950/[0.03] focus-visible:outline-2 data-selected:bg-teal-50 dark:hover:bg-white/[0.04] dark:outline-teal-400 dark:data-selected:bg-teal-950/60 [&>[role=gridcell]]:grid [&>[role=gridcell]]:grid-cols-[minmax(0,1fr)_auto] [&>[role=gridcell]]:items-center [&>[role=gridcell]]:gap-3"
          >
            <div className="min-w-0">
              <a
                href={`#${file.name.toLowerCase().replaceAll(" ", "-").replaceAll(".", "")}`}
                className="block cursor-pointer truncate text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 outline-teal-600 hover:decoration-zinc-900 focus-visible:outline-2 dark:text-zinc-100 dark:decoration-zinc-600 dark:outline-teal-400 dark:hover:decoration-zinc-100"
              >
                {file.name}
              </a>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{file.detail}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-300">
                {file.access}
              </span>
              <Button
                onClick={() => setSharedFile(file.name)}
                className="cursor-pointer rounded-md border border-zinc-950/10 px-2.5 py-1.5 text-sm font-medium text-zinc-700 outline-teal-600 hover:bg-zinc-950/5 focus-visible:outline-2 dark:border-white/10 dark:text-zinc-200 dark:outline-teal-400 dark:hover:bg-white/5"
              >
                Share
              </Button>
            </div>
          </GridListItem>
        ))}
      </GridList>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        Selected: {selected}.{" "}
        {sharedFile
          ? `Share link created for ${sharedFile}.`
          : "ArrowRight reaches links and actions inside a row."}
      </p>
    </div>
  );
}
