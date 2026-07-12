"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxPopover,
  Dialog,
  DialogContent,
  Popover,
} from "@comp0/react";
import type { PaletteEntry } from "./types.js";

/**
 * Case-insensitive subsequence match: every character of the query appears in
 * the text in order, so "clnd" matches "Calendar".
 */
export function fuzzyMatch(textValue: string, inputValue: string): boolean {
  const text = textValue.toLowerCase();
  const query = inputValue.toLowerCase();
  let from = 0;
  for (const char of query) {
    const index = text.indexOf(char, from);
    if (index === -1) return false;
    from = index + 1;
  }
  return true;
}

export type CommandPaletteProps = {
  entries: PaletteEntry[];
  open: boolean;
  onToggle: (open: boolean) => void;
};

export function CommandPalette({ entries, open, onToggle }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Selecting an option makes the Combobox echo the option title back through
  // onInputChange after our onChange handler runs; resetting on close keeps
  // the next open starting from an empty query.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const goto = (route: string) => {
    if (!route) return;
    onToggle(false);
    void navigate(route);
  };

  const results = entries.filter((entry) => query === "" || fuzzyMatch(entry.title, query));

  const keepResultsOpen = () => {
    // The results panel stays open for the palette's whole lifetime. Escape
    // closes the dialog from the input's onKeyDown, and after a light dismiss
    // the popover machinery restores the always-open surface on its own.
  };

  return (
    <Dialog open={open} onToggle={onToggle}>
      <DialogContent
        aria-label="Search documentation"
        className="mx-auto mt-[12vh] w-[min(38rem,calc(100vw-2rem))] rounded-2xl border border-zinc-950/10 bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/40 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:backdrop:bg-black/60"
      >
        <Combobox
          filter={fuzzyMatch}
          inputValue={query}
          onChange={goto}
          onInputChange={setQuery}
          value=""
        >
          <Popover open={open} onToggle={keepResultsOpen}>
            <ComboboxInput
              aria-label="Search docs"
              className="w-full rounded-2xl bg-transparent px-5 py-4 text-base text-zinc-950 outline-none placeholder:text-zinc-400 sm:text-sm dark:text-white dark:placeholder:text-zinc-500"
              placeholder="Search components and guides…"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  // The Combobox's own Escape handling only asks the popover
                  // to close, which an always-open panel ignores; close the
                  // whole dialog in one press instead.
                  event.preventDefault();
                  onToggle(false);
                  return;
                }
                if (
                  event.key === "Enter" &&
                  !event.currentTarget.getAttribute("aria-activedescendant")
                ) {
                  // Without an active option Enter is a no-op in the
                  // Combobox; a palette should jump to the top result.
                  event.preventDefault();
                  const first = results[0];
                  if (first) goto(first.route);
                }
              }}
            />
            <ComboboxPopover
              aria-label="Search results"
              className="max-h-80 w-[anchor-size(width)] overflow-y-auto rounded-xl border border-zinc-950/10 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-zinc-900"
              offset={8}
              placement="bottom"
            >
              {entries.map((entry) => (
                <ComboboxOption
                  className="flex cursor-default items-center justify-between gap-4 rounded-lg px-3 py-2 text-base/7 text-zinc-700 data-active:bg-teal-600/10 data-active:text-teal-800 sm:text-sm/6 dark:text-zinc-300 dark:data-active:bg-teal-400/10 dark:data-active:text-teal-200"
                  key={entry.route}
                  textValue={entry.title}
                  value={entry.route}
                >
                  <span className="truncate">{entry.title}</span>
                  <span className="shrink-0 text-sm/6 text-zinc-400 sm:text-xs/6 dark:text-zinc-500">
                    {entry.group}
                  </span>
                </ComboboxOption>
              ))}
              {results.length === 0 && (
                <div className="px-3 py-2 text-base/7 text-zinc-500 sm:text-sm/6 dark:text-zinc-400">
                  No results for “{query}”
                </div>
              )}
            </ComboboxPopover>
          </Popover>
        </Combobox>
      </DialogContent>
    </Dialog>
  );
}
