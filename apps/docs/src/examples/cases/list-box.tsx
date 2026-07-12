import { useState } from "react";
import { ListBox, ListBoxItem, ListBoxSection, ListBoxSeparator } from "@comp0/react";

export function Example() {
  const [value, setValue] = useState("mint");

  return (
    <div className="flex max-w-xs flex-col gap-2">
      <ListBox
        aria-label="Flavor"
        className="rounded border border-zinc-950/10 p-1 dark:border-white/10"
        value={value}
        onChange={setValue}
      >
        <ListBoxSection aria-label="Fresh" className="grid">
          <ListBoxItem
            className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
            value="mint"
          >
            Mint
          </ListBoxItem>
          <ListBoxItem
            className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
            value="basil"
          >
            Basil
          </ListBoxItem>
        </ListBoxSection>
        <ListBoxSeparator className="my-1 h-px bg-zinc-950/10 dark:bg-white/10" />
        <ListBoxSection aria-label="Sweet" className="grid">
          <ListBoxItem
            className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-selected:bg-teal-100 data-selected:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-selected:bg-teal-950 dark:data-selected:text-teal-50"
            value="plum"
          >
            Plum
          </ListBoxItem>
        </ListBoxSection>
      </ListBox>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">Selected: {value}</p>
    </div>
  );
}
