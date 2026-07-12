import { Description, Input, Label, TextField } from "@comp0/react";

export function Example() {
  return (
    <TextField as="div" className="flex max-w-xs flex-col gap-1.5">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Email
      </Label>
      <Input
        className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
        name="email"
        type="email"
        placeholder="you@example.com"
      />
      <Description className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        We only use this for receipts.
      </Description>
    </TextField>
  );
}
