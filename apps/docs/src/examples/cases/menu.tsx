import { Menu, MenuItem, MenuPopover, MenuSection, MenuSeparator, MenuTrigger } from "@comp0/react";

export function Example() {
  return (
    <Menu>
      <MenuTrigger className="rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100">
        Actions
      </MenuTrigger>
      <MenuPopover
        placement="bottom start"
        offset={8}
        className="w-44 rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
      >
        <MenuSection aria-label="Document" className="grid">
          <MenuItem
            className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            value="rename"
          >
            Rename
          </MenuItem>
          <MenuItem
            className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            value="duplicate"
          >
            Duplicate
          </MenuItem>
        </MenuSection>
        <MenuSeparator className="my-1 h-px bg-zinc-950/10 dark:bg-white/10" />
        <Menu>
          <MenuTrigger className="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800">
            Share to <span aria-hidden="true">›</span>
          </MenuTrigger>
          <MenuPopover
            placement="right top"
            offset={4}
            className="w-40 rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
          >
            <MenuItem
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
              value="email"
            >
              Email
            </MenuItem>
            <MenuItem
              className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
              value="copy-link"
            >
              Copy link
            </MenuItem>
          </MenuPopover>
        </Menu>
      </MenuPopover>
    </Menu>
  );
}
