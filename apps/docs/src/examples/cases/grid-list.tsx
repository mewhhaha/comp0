import { useState } from "react";
import { Button, GridList, GridListItem } from "@comp0/react";

export function Example() {
  const [selected, setSelected] = useState("report");

  return (
    <div className="flex max-w-sm flex-col gap-2">
      <GridList
        aria-label="Files"
        className="rounded border border-zinc-950/10 p-1 dark:border-white/10"
        value={selected}
        onChange={setSelected}
      >
        {[
          ["report", "report.pdf"],
          ["photos", "photos.zip"],
        ].map(([value, name]) => (
          <GridListItem
            key={value}
            value={value}
            className="cursor-pointer rounded px-2 py-1.5 outline-teal-600 focus-visible:outline-2 data-selected:bg-teal-100 dark:outline-teal-400 dark:data-selected:bg-teal-950 [&>[role=gridcell]]:flex [&>[role=gridcell]]:items-center [&>[role=gridcell]]:justify-between [&>[role=gridcell]]:gap-3"
          >
            <span className="text-base text-zinc-800 sm:text-sm dark:text-zinc-100">{name}</span>
            <Button className="rounded border border-zinc-950/10 px-2 py-1 text-base text-zinc-700 outline-teal-600 focus-visible:outline-2 sm:text-sm dark:border-white/10 dark:text-zinc-200 dark:outline-teal-400">
              Share
            </Button>
          </GridListItem>
        ))}
      </GridList>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">Selected: {selected}</p>
    </div>
  );
}
