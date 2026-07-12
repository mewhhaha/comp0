import { Tooltip, TooltipArrow, TooltipPopover, TooltipTrigger } from "@comp0/react";

export function Example() {
  return (
    <Tooltip>
      <TooltipTrigger className="rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100">
        Hover or focus
      </TooltipTrigger>
      <TooltipPopover
        placement="top"
        offset={6}
        className="w-max overflow-visible rounded border-0 bg-zinc-900 px-2 py-1 text-base text-white sm:text-sm dark:bg-zinc-100 dark:text-zinc-900"
      >
        Helpful context
        <TooltipArrow className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-zinc-900 dark:bg-zinc-100" />
      </TooltipPopover>
    </Tooltip>
  );
}
