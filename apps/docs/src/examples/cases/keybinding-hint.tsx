import { useEffect, useRef } from "react";
import { Button, Input, KeybindingHint, Label, TextField } from "@comp0/react";

export function Example() {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <div className="flex w-full max-w-md flex-col gap-3 text-base sm:text-sm">
      <Button
        aria-keyshortcuts="Control+K Meta+K"
        className="flex min-h-10 items-center justify-between gap-4 rounded-lg border border-zinc-950/15 px-3 py-2 text-left outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:outline-teal-400"
        onClick={() => searchRef.current?.focus()}
      >
        Search commands
        <KeybindingHint
          keys="Mod+K"
          className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 [&_[data-slot=keybinding-key]]:rounded [&_[data-slot=keybinding-key]]:border [&_[data-slot=keybinding-key]]:border-zinc-950/15 [&_[data-slot=keybinding-key]]:px-1.5 [&_[data-slot=keybinding-key]]:py-0.5 dark:[&_[data-slot=keybinding-key]]:border-white/15"
        />
      </Button>
      <TextField>
        <Label className="mb-1 block font-medium">Command search</Label>
        <Input
          ref={searchRef}
          className="min-h-10 w-full rounded-lg border border-zinc-950/15 bg-white px-3 py-2 outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:bg-zinc-900 dark:outline-teal-400"
        />
      </TextField>
    </div>
  );
}
