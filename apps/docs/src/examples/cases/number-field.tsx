import {
  Label,
  NumberField,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@comp0/react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";

export function Example() {
  return (
    <NumberField
      className="flex max-w-xs flex-col gap-1.5"
      defaultValue={2}
      id="tickets"
      max={10}
      min={1}
      name="tickets"
    >
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Tickets
      </Label>
      <div className="flex overflow-hidden rounded border border-zinc-950/10 bg-white focus-within:outline-2 focus-within:outline-teal-600 dark:border-white/10 dark:bg-zinc-900 dark:focus-within:outline-teal-400">
        <NumberFieldInput className="min-w-0 flex-1 [appearance:textfield] bg-transparent px-3 py-2.5 text-base text-zinc-950 outline-none sm:py-2 sm:text-sm dark:text-zinc-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        <div className="grid w-9 shrink-0 grid-rows-2 border-l border-zinc-950/10 dark:border-white/10">
          <NumberFieldIncrement
            aria-label="Increase tickets"
            className="flex items-center justify-center border-b border-zinc-950/10 text-zinc-500 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:bg-teal-50 focus-visible:text-teal-800 disabled:opacity-35 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:bg-teal-950 dark:focus-visible:text-teal-200"
          >
            <ChevronUpIcon className="size-3.5" aria-hidden="true" />
          </NumberFieldIncrement>
          <NumberFieldDecrement
            aria-label="Decrease tickets"
            className="flex items-center justify-center text-zinc-500 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:bg-teal-50 focus-visible:text-teal-800 disabled:opacity-35 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:bg-teal-950 dark:focus-visible:text-teal-200"
          >
            <ChevronDownIcon className="size-3.5" aria-hidden="true" />
          </NumberFieldDecrement>
        </div>
      </div>
    </NumberField>
  );
}
