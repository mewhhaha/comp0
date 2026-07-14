import { useDeferredValue, useState } from "react";
import {
  ColorArea,
  ColorAreaThumb,
  ColorPicker,
  ColorPickerInput,
  ColorPickerPopover,
  ColorPickerTrigger,
  ColorPickerValue,
  ColorSlider,
  ColorSwatch,
  Label,
} from "@comp0/react";

type ThemePreviewProps = {
  color: string;
};

function ThemePreview({ color }: ThemePreviewProps) {
  return (
    <div
      aria-label="Theme preview"
      className="mt-3 overflow-hidden rounded-lg border border-zinc-950/10 bg-white dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="flex items-center justify-between gap-3 p-3">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Theme preview</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Expensive previews can render at lower priority.
          </p>
        </div>
        <span
          aria-hidden="true"
          className="size-8 shrink-0 rounded-full border border-zinc-950/10 dark:border-white/10"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function Example() {
  const [color, setColor] = useState("#0d9488");
  const previewColor = useDeferredValue(color);

  return (
    <ColorPicker
      as="div"
      className="flex max-w-xs flex-col gap-1.5"
      name="accent"
      value={color}
      onChange={setColor}
    >
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Accent color
      </Label>
      <ColorPickerTrigger
        aria-label="Choose accent color"
        className="flex h-11 items-center gap-2 rounded border border-zinc-950/10 bg-white px-2.5 text-left text-base text-zinc-800 outline-teal-600 focus-visible:outline-2 sm:h-9 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:outline-teal-400"
      >
        <ColorSwatch className="size-6 shrink-0 rounded border border-zinc-950/15 shadow-inner dark:border-white/20" />
        <ColorPickerValue className="font-mono tabular-nums" />
      </ColorPickerTrigger>
      <ColorPickerPopover
        aria-label="Accent color picker"
        placement="bottom start"
        offset={4}
        className="w-72 rounded-lg border-0 bg-white p-3 shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10"
      >
        <ColorArea
          aria-label="Saturation and brightness"
          className="relative h-40 w-full touch-none overflow-hidden rounded-md border border-zinc-950/10 bg-[linear-gradient(to_top,#000,transparent),linear-gradient(to_right,#fff,transparent)] outline-teal-600 focus-within:outline-2 dark:border-white/10 dark:outline-teal-400"
          style={{ backgroundColor: "hsl(var(--comp0-color-area-hue) 100% 50%)" }}
        >
          <ColorAreaThumb className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent shadow ring-1 ring-zinc-950/25 dark:ring-zinc-950/50" />
        </ColorArea>
        <ColorSlider
          aria-label="Hue"
          channel="hue"
          className="mt-4 h-3 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,#ef4444,#eab308,#22c55e,#06b6d4,#3b82f6,#a855f7,#ec4899,#ef4444)] outline-teal-600 focus-visible:outline-2 [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-zinc-950 [&::-moz-range-thumb]:shadow [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-zinc-950 [&::-webkit-slider-thumb]:shadow dark:outline-teal-400 dark:[&::-moz-range-thumb]:bg-white dark:[&::-webkit-slider-thumb]:bg-white"
        />
        <label className="mt-4 flex items-center gap-2">
          <span className="text-base text-zinc-500 sm:text-sm dark:text-zinc-400">Hex</span>
          <ColorPickerInput className="min-w-0 flex-1 rounded border border-zinc-950/10 bg-white px-2.5 py-2 font-mono text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:text-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:outline-teal-400" />
        </label>
      </ColorPickerPopover>
      <ThemePreview color={previewColor} />
    </ColorPicker>
  );
}
