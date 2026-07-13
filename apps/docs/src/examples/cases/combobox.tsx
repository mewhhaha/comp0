import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxPopover,
  ComboboxTrigger,
  Label,
} from "@comp0/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

export function Example() {
  return (
    <Combobox as="div" className="flex max-w-xs flex-col gap-1.5" name="city">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        City
      </Label>
      <div className="flex">
        <ComboboxInput
          className="w-full rounded-l border border-r-0 border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:z-10 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          placeholder="Filter cities"
        />
        <ComboboxTrigger className="group rounded-r border border-zinc-950/10 bg-white px-3 text-zinc-500 outline-teal-600 focus-visible:z-10 focus-visible:outline-2 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400 dark:outline-teal-400">
          <ChevronDownIcon
            className="size-4 transition-transform duration-150 ease-out group-data-open:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </ComboboxTrigger>
      </div>
      <ComboboxPopover
        placement="bottom"
        offset={4}
        className="max-h-60 w-[anchor-size(width)] max-w-[anchor-size(width)] overflow-y-auto rounded border-0 bg-white p-1 opacity-100 ring-1 ring-zinc-950/10 transition-[opacity,translate] duration-150 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none dark:bg-zinc-900 dark:ring-white/10"
      >
        <ComboboxOption
          className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 hover:bg-zinc-100 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
          value="Warsaw"
        >
          Warsaw
        </ComboboxOption>
        <ComboboxOption
          className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 hover:bg-zinc-100 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
          value="Tokyo"
        >
          Tokyo
        </ComboboxOption>
        <ComboboxOption
          className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 hover:bg-zinc-100 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
          value="Lisbon"
        >
          Lisbon
        </ComboboxOption>
      </ComboboxPopover>
    </Combobox>
  );
}
