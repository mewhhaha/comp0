import { ColorSwatchPicker, ColorSwatchPickerItem, Legend } from "@comp0/react";

const colors = [
  ["Ocean", "#0f766e"],
  ["Sky", "#2563eb"],
  ["Grape", "#7c3aed"],
  ["Rose", "#e11d48"],
] as const;

export function Example() {
  return (
    <ColorSwatchPicker name="accent" defaultValue="#2563eb" className="border-0 p-0">
      <Legend className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        Accent color
      </Legend>
      <div className="flex gap-3">
        {colors.map(([name, color]) => (
          <ColorSwatchPickerItem
            key={color}
            color={color}
            inputProps={{ "aria-label": name }}
            className="size-9 cursor-pointer rounded-full border-2 border-white outline outline-1 outline-zinc-950/15 ring-2 ring-transparent ring-offset-2 data-focus-visible:ring-teal-600 data-checked:ring-zinc-950 dark:border-zinc-950 dark:outline-white/20 dark:ring-offset-zinc-950 dark:data-focus-visible:ring-teal-400 dark:data-checked:ring-white"
          />
        ))}
      </div>
    </ColorSwatchPicker>
  );
}
