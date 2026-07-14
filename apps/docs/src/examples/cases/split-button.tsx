import {
  Button,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SplitButton,
} from "@comp0/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

export function Example() {
  const save = () => {};
  const saveAs = () => {};
  const saveCopy = () => {};

  return (
    <SplitButton aria-label="Save" className="inline-flex items-stretch rounded-md shadow-sm">
      <Button
        onClick={save}
        className="rounded-l-md bg-teal-600 px-3 py-2.5 text-base text-white data-hovered:bg-teal-700 data-focus-visible:outline data-focus-visible:-outline-offset-2 data-focus-visible:outline-2 data-focus-visible:outline-white sm:py-2 sm:text-sm dark:bg-teal-500 dark:text-teal-950 dark:data-hovered:bg-teal-400"
      >
        Save
      </Button>
      <Menu>
        <MenuTrigger
          aria-label="More save options"
          className="flex items-center rounded-r-md border-l border-white/30 bg-teal-600 px-2 text-white hover:bg-teal-700 focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-white dark:border-teal-950/20 dark:bg-teal-500 dark:text-teal-950 dark:hover:bg-teal-400"
        >
          <ChevronDownIcon className="size-4" aria-hidden="true" />
        </MenuTrigger>
        <MenuPopover
          placement="bottom end"
          offset={8}
          className="w-44 rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
        >
          <MenuList>
            <MenuItem
              onClick={saveAs}
              value="save-as"
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Save as…
            </MenuItem>
            <MenuItem
              onClick={saveCopy}
              value="save-copy"
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Save a copy…
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </SplitButton>
  );
}
