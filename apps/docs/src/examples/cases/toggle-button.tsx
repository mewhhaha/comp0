import { ToggleButton, ToggleButtonGroup } from "@comp0/react";

export function Example() {
  return (
    <ToggleButtonGroup
      type="multiple"
      defaultValue={["bold"]}
      aria-label="Text style"
      className="inline-flex divide-x divide-zinc-950/10 overflow-hidden rounded border border-zinc-950/10 [&>button]:px-3 [&>button]:py-2.5 [&>button]:text-base [&>button]:text-zinc-950 [&>button]:outline-teal-600 [&>button]:focus-visible:outline-2 [&>button[data-selected]]:bg-teal-100 [&>button[data-selected]]:text-teal-950 sm:[&>button]:py-2 sm:[&>button]:text-sm dark:divide-white/10 dark:border-white/10 dark:[&>button]:text-zinc-50 dark:[&>button]:outline-teal-400 dark:[&>button[data-selected]]:bg-teal-950 dark:[&>button[data-selected]]:text-teal-50"
    >
      <ToggleButton value="bold">Bold</ToggleButton>
      <ToggleButton value="italic">Italic</ToggleButton>
      <ToggleButton value="underline">Underline</ToggleButton>
    </ToggleButtonGroup>
  );
}
