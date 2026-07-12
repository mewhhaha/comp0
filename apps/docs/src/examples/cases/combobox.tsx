import { Combobox, ComboboxInput, ComboboxOption, ComboboxPopover, Label } from "@comp0/react";

export function Example() {
  return (
    <Combobox as="div" className="flex max-w-xs flex-col gap-1.5" name="city">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        City
      </Label>
      <ComboboxInput
        className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
        placeholder="Filter cities"
      />
      <ComboboxPopover
        placement="bottom"
        offset={4}
        className="max-h-60 w-[anchor-size(width)] max-w-[anchor-size(width)] overflow-y-auto rounded border-0 bg-white p-1 ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:ring-white/10"
      >
        <ComboboxOption
          className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
          value="Warsaw"
        >
          Warsaw
        </ComboboxOption>
        <ComboboxOption
          className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
          value="Tokyo"
        >
          Tokyo
        </ComboboxOption>
        <ComboboxOption
          className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
          value="Lisbon"
        >
          Lisbon
        </ComboboxOption>
      </ComboboxPopover>
    </Combobox>
  );
}
