import { MenuItem, MenuList, MenuPopover, MenuSeparator } from "@comp0/react";
import { ContextMenu, ContextMenuTrigger } from "@comp0/react";

export function Example() {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        tabIndex={0}
        className="grid h-36 w-full max-w-md place-items-center rounded border border-dashed border-zinc-950/20 text-base text-zinc-500 outline-teal-600 select-none focus-visible:outline-2 data-open:border-teal-600 sm:text-sm dark:border-white/20 dark:text-zinc-400 dark:outline-teal-400 dark:data-open:border-teal-400"
      >
        Right-click here (or press Shift+F10)
      </ContextMenuTrigger>
      {/* The popover positions itself: the recorded pointer position arrives
          as --comp0-context-menu-x/y px values on the popover element. */}
      <MenuPopover className="fixed inset-auto top-(--comp0-context-menu-y) left-(--comp0-context-menu-x) m-0 w-44 rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10">
        <MenuList aria-label="Attachment actions">
          <MenuItem
            className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            value="download"
          >
            Download
          </MenuItem>
          <MenuItem
            className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            value="rename"
          >
            Rename
          </MenuItem>
          <MenuSeparator className="my-1 h-px bg-zinc-950/10 dark:bg-white/10" />
          <MenuItem
            className="w-full rounded px-3 py-2.5 text-left text-base text-red-700 hover:bg-red-50 sm:py-2 sm:text-sm dark:text-red-400 dark:hover:bg-red-950"
            value="remove"
          >
            Remove
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </ContextMenu>
  );
}
