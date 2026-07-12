import { ToggleButton, ToggleButtonGroup } from "@comp0/react";
import { Toolbar } from "@comp0/react";

export function Example() {
  return (
    <Toolbar
      aria-label="Text formatting"
      className="flex items-center gap-2 rounded border border-zinc-950/10 p-1.5 dark:border-white/10"
    >
      <ToggleButtonGroup
        type="multiple"
        defaultValue={["bold"]}
        aria-label="Text style"
        className="flex gap-1"
      >
        <ToggleButton
          value="bold"
          className="rounded px-3 py-2.5 text-base font-bold text-zinc-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
        >
          B
        </ToggleButton>
        <ToggleButton
          value="italic"
          className="rounded px-3 py-2.5 text-base italic text-zinc-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
        >
          I
        </ToggleButton>
        <ToggleButton
          value="underline"
          className="rounded px-3 py-2.5 text-base text-zinc-950 underline data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
        >
          U
        </ToggleButton>
      </ToggleButtonGroup>
      <span aria-hidden="true" className="h-6 w-px bg-zinc-950/10 dark:bg-white/10" />
      <ToggleButtonGroup
        type="single"
        defaultValue="left"
        aria-label="Alignment"
        className="flex gap-1"
      >
        <ToggleButton
          value="left"
          className="rounded px-3 py-2.5 text-base text-zinc-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
        >
          Left
        </ToggleButton>
        <ToggleButton
          value="center"
          className="rounded px-3 py-2.5 text-base text-zinc-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
        >
          Center
        </ToggleButton>
        <ToggleButton
          value="right"
          className="rounded px-3 py-2.5 text-base text-zinc-950 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-50 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
        >
          Right
        </ToggleButton>
      </ToggleButtonGroup>
    </Toolbar>
  );
}
