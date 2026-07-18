import { Tooltip, TooltipArrow, TooltipPopover, TooltipTrigger } from "@comp0/react";

export function Example() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Hover or focus the underlined symbol.
      </p>
      <pre className="mt-5 overflow-auto rounded bg-zinc-950 p-4 font-mono text-sm/6 text-zinc-100">
        const{" "}
        <Tooltip>
          <TooltipTrigger className="cursor-help rounded-sm border-0 bg-transparent p-0 font-mono text-sky-300 underline decoration-sky-400 decoration-dashed underline-offset-4 outline-teal-400 focus-visible:outline-2 focus-visible:outline-offset-2">
            message
          </TooltipTrigger>
          <TooltipPopover
            as="span"
            placement="top"
            offset={6}
            className="w-max translate-y-0 overflow-visible rounded border-0 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 opacity-100 shadow-lg transition-[opacity,translate] duration-100 starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none"
          >
            const message: string
            <TooltipArrow
              as="span"
              className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-zinc-800"
            />
          </TooltipPopover>
        </Tooltip>
        {" = getGreeting();"}
      </pre>
    </div>
  );
}
