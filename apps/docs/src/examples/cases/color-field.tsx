import { Description, Label, TextField } from "@comp0/react";
import { ColorField } from "@comp0/react";

export function Example() {
  return (
    <TextField as="div" defaultValue="#0d9488" className="flex max-w-xs flex-col gap-1.5">
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Accent color
      </Label>
      <ColorField
        name="accent"
        className="h-11 w-20 rounded border border-zinc-950/10 bg-white p-1 outline-teal-600 focus-visible:outline-2 sm:h-9 dark:border-white/10 dark:bg-zinc-900 dark:outline-teal-400"
      />
      <Description className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
        Hex sRGB only; the browser picker cannot store transparency.
      </Description>
    </TextField>
  );
}
