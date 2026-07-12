import { useState } from "react";
import { RangeSlider, RangeSliderThumb, RangeSliderTrack } from "@comp0/react";

export function Example() {
  const [value, setValue] = useState<[number, number]>([20, 60]);

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <p className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Price range
      </p>
      <RangeSlider
        aria-label="Price range"
        className="relative h-6 w-full"
        name="price"
        value={value}
        onChange={setValue}
      >
        <RangeSliderTrack className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="absolute inset-y-0 rounded-full bg-teal-600 dark:bg-teal-400"
            style={{
              left: "calc(var(--comp0-range-slider-start) * 100%)",
              width:
                "calc((var(--comp0-range-slider-end) - var(--comp0-range-slider-start)) * 100%)",
            }}
          />
        </RangeSliderTrack>
        <RangeSliderThumb
          aria-label="Minimum price"
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-950/10 bg-white shadow outline-teal-600 focus-visible:outline-2 data-dragging:border-teal-600 dark:border-white/20 dark:bg-zinc-100 dark:outline-teal-400 dark:data-dragging:border-teal-400"
          style={{ left: "calc(var(--comp0-range-slider-start) * 100%)" }}
          thumb="start"
        />
        <RangeSliderThumb
          aria-label="Maximum price"
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-950/10 bg-white shadow outline-teal-600 focus-visible:outline-2 data-dragging:border-teal-600 dark:border-white/20 dark:bg-zinc-100 dark:outline-teal-400 dark:data-dragging:border-teal-400"
          style={{ left: "calc(var(--comp0-range-slider-end) * 100%)" }}
          thumb="end"
        />
      </RangeSlider>
      <p className="text-base text-zinc-600 tabular-nums sm:text-sm dark:text-zinc-400">
        ${value[0]} – ${value[1]}
      </p>
    </div>
  );
}
