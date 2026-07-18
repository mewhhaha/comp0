import { CharacterCount, Label, TextArea, TextField } from "@comp0/react";

export function Example() {
  return (
    <TextField defaultValue="" className="block w-full max-w-md text-base sm:text-sm">
      <Label className="mb-1 block font-medium text-zinc-950 dark:text-white">
        Short biography
      </Label>
      <TextArea
        name="biography"
        maxLength={160}
        rows={5}
        className="w-full rounded-lg border border-zinc-950/15 bg-white px-3 py-2 outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:bg-zinc-900 dark:outline-teal-400"
      />
      <CharacterCount
        maxLength={160}
        className="mt-1 block text-zinc-600 data-limit-reached:font-semibold data-limit-reached:text-amber-700 dark:text-zinc-400 dark:data-limit-reached:text-amber-300"
      />
    </TextField>
  );
}
