import { useState } from "react";
import {
  Autocomplete,
  Label,
  Menu,
  MenuItem,
  MenuPopover,
  MenuTrigger,
  SearchField,
  SearchFieldInput,
} from "@comp0/react";

const commands = ["Archive conversation", "Assign to me", "Mark as unread", "Move to inbox"];

function contains(textValue: string, inputValue: string) {
  return textValue.toLocaleLowerCase().includes(inputValue.trim().toLocaleLowerCase());
}

export function Example() {
  const [open, setOpen] = useState(false);
  const [lastCommand, setLastCommand] = useState("");

  return (
    <Autocomplete disableAutoFocusFirst filter={contains}>
      <SearchField as="div" className="flex w-full max-w-xs flex-col gap-1.5">
        <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
          Find a command
        </Label>
        <SearchFieldInput
          autoComplete="off"
          className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
          placeholder="Type to filter"
        />
        <Menu open={open} onToggle={setOpen}>
          <MenuTrigger className="self-start rounded border border-zinc-950/10 px-3 py-2 text-sm text-zinc-800 dark:border-white/10 dark:text-zinc-100">
            Commands
          </MenuTrigger>
          <MenuPopover
            aria-label="Matching commands"
            className="w-64 rounded border-0 bg-white p-1 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
            offset={4}
            placement="bottom start"
          >
            {commands.map((command) => (
              <MenuItem
                key={command}
                className="w-full rounded px-3 py-2.5 text-left text-base text-zinc-800 hover:bg-zinc-100 data-active:bg-teal-100 data-active:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800 dark:data-active:bg-teal-950 dark:data-active:text-teal-50"
                onClick={() => setLastCommand(command)}
                value={command}
              >
                {command}
              </MenuItem>
            ))}
          </MenuPopover>
        </Menu>
        {lastCommand && (
          <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">Ran {lastCommand}</p>
        )}
      </SearchField>
    </Autocomplete>
  );
}
