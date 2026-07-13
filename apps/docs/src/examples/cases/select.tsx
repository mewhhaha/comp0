import {
  Label,
  Select,
  SelectOption,
  SelectPopover,
  SelectTrigger,
  SelectValue,
} from "@comp0/react";

export function Example() {
  return (
    <Select as="div" className="flex max-w-xs flex-col gap-1.5" defaultValue="medium" name="size">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Size
      </Label>
      <SelectTrigger className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400">
        <SelectValue />
      </SelectTrigger>
      <SelectPopover
        placement="bottom"
        offset={4}
        className="max-h-60 w-[anchor-size(width)] max-w-[anchor-size(width)] overflow-y-auto rounded border-0 bg-white p-1 opacity-100 shadow-lg ring-1 ring-zinc-950/10 transition-[opacity,translate] duration-150 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
      >
        <SelectOption
          className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
          value="small"
        >
          Small
        </SelectOption>
        <SelectOption
          className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
          value="medium"
        >
          Medium
        </SelectOption>
        <SelectOption
          className="rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-zinc-950 data-selected:bg-teal-100 focus-visible:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-zinc-50 dark:data-selected:bg-teal-950 dark:focus-visible:bg-teal-800 dark:focus-visible:outline-teal-400"
          value="large"
        >
          Large
        </SelectOption>
      </SelectPopover>
    </Select>
  );
}
