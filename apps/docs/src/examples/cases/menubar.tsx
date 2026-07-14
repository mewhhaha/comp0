import { Menu, MenuItem, MenuList, MenuPopover, MenuSeparator, MenuTrigger } from "@comp0/react";
import { Menubar } from "@comp0/react";

export function Example() {
  return (
    <Menubar
      aria-label="Notes"
      className="flex items-center gap-1 rounded border border-zinc-950/10 p-1 dark:border-white/10"
    >
      <Menu>
        <MenuTrigger className="rounded px-3 py-2.5 text-base text-zinc-800 select-none hover:bg-zinc-100 data-open:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800 dark:data-open:bg-zinc-800">
          File
        </MenuTrigger>
        <MenuPopover
          placement="bottom start"
          offset={4}
          className="w-44 rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
        >
          <MenuList>
            <MenuItem
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 select-none hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
              value="new"
            >
              New note
            </MenuItem>
            <MenuItem
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 select-none hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
              value="duplicate"
            >
              Duplicate
            </MenuItem>
            <MenuSeparator className="my-1 h-px bg-zinc-950/10 dark:bg-white/10" />
            <MenuItem
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 select-none hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
              value="delete"
            >
              Delete
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Menu>
        <MenuTrigger className="rounded px-3 py-2.5 text-base text-zinc-800 select-none hover:bg-zinc-100 data-open:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800 dark:data-open:bg-zinc-800">
          Edit
        </MenuTrigger>
        <MenuPopover
          placement="bottom start"
          offset={4}
          className="w-44 rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
        >
          <MenuList>
            <MenuItem
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 select-none hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
              value="undo"
            >
              Undo
            </MenuItem>
            <MenuItem
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 select-none hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
              value="redo"
            >
              Redo
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Menu>
        <MenuTrigger className="rounded px-3 py-2.5 text-base text-zinc-800 select-none hover:bg-zinc-100 data-open:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800 dark:data-open:bg-zinc-800">
          View
        </MenuTrigger>
        <MenuPopover
          placement="bottom start"
          offset={4}
          className="w-44 rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
        >
          <MenuList>
            <MenuItem
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 select-none hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
              value="zoom-in"
            >
              Zoom in
            </MenuItem>
            <MenuItem
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 select-none hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
              value="zoom-out"
            >
              Zoom out
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </Menubar>
  );
}
