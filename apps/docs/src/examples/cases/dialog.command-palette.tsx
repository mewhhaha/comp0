import { useState } from "react";
import {
  Autocomplete,
  Dialog,
  DialogContent,
  DialogTrigger,
  ListBox,
  ListBoxItem,
  SearchField,
  SearchFieldInput,
} from "@comp0/react";

const commands = [
  "Assign to teammate",
  "Copy page link",
  "Duplicate page",
  "Move to project",
  "Toggle sidebar",
];

function contains(textValue: string, inputValue: string) {
  return textValue.toLocaleLowerCase().includes(inputValue.trim().toLocaleLowerCase());
}

export function Example() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lastCommand, setLastCommand] = useState("");

  const runCommand = (command: string) => {
    setLastCommand(command);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Dialog open={open} onToggle={setOpen}>
        <DialogTrigger className="flex items-center gap-2 rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100">
          Search commands
          <kbd className="rounded border border-zinc-950/10 px-1.5 font-sans text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
            ⌘K
          </kbd>
        </DialogTrigger>
        <DialogContent
          aria-label="Command palette"
          className="m-auto w-[min(26rem,calc(100vw-2rem))] translate-y-0 rounded-[min(1vw,12px)] bg-white p-2 text-zinc-900 opacity-100 shadow-2xl ring-1 ring-zinc-950/10 transition-[opacity,translate] duration-150 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none backdrop:bg-zinc-950/40 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-none dark:ring-white/10"
        >
          <Autocomplete filter={contains} inputValue={query} onInputChange={setQuery}>
            <SearchField as="div" className="flex flex-col gap-2">
              <SearchFieldInput
                aria-label="Search commands"
                autoComplete="off"
                className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:outline-teal-400"
                placeholder="Type a command"
              />
              <ListBox aria-label="Commands" className="max-h-60 overflow-y-auto">
                {commands.map((command) => (
                  <ListBoxItem
                    key={command}
                    className="cursor-pointer rounded px-3 py-2.5 text-base text-zinc-800 data-active:bg-teal-100 data-active:text-teal-950 sm:py-2 sm:text-sm dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-teal-50"
                    onClick={(event) => {
                      event.preventDefault();
                      runCommand(command);
                    }}
                    value={command}
                  >
                    {command}
                  </ListBoxItem>
                ))}
              </ListBox>
            </SearchField>
          </Autocomplete>
        </DialogContent>
      </Dialog>
      {lastCommand && (
        <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">Ran {lastCommand}</p>
      )}
    </div>
  );
}
