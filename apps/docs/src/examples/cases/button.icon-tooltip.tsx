import { Fragment, useState } from "react";
import { Button, Tooltip, TooltipArrow, TooltipPopover, TooltipTrigger } from "@comp0/react";

export function Example() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <Tooltip>
        <TooltipTrigger as={Fragment}>
          <Button
            aria-label="Save draft"
            className="select-none rounded-full bg-teal-700 p-2.5 text-white outline-teal-600 hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-teal-400 dark:text-zinc-950 dark:outline-teal-400 dark:hover:bg-teal-300"
            onClick={() => setSaved(true)}
          >
            <svg
              aria-hidden="true"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path d="M5 4h11l3 3v13H5V4Zm3 0v6h8V4M8 20v-6h8v6" />
            </svg>
          </Button>
        </TooltipTrigger>
        <TooltipPopover
          placement="top"
          offset={6}
          className="w-max translate-y-0 overflow-visible rounded border-0 bg-zinc-900 px-2 py-1 text-sm text-white opacity-100 shadow-lg transition-[opacity,translate] duration-150 starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save draft
          <TooltipArrow className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-zinc-900 dark:bg-zinc-100" />
        </TooltipPopover>
      </Tooltip>
      <output className="min-h-5 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        {saved ? "Draft saved." : ""}
      </output>
    </div>
  );
}
