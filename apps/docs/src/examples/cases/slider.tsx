import { useState } from "react";
import { Label, Slider } from "@comp0/react";

export function Example() {
  const [value, setValue] = useState(40);

  return (
    <div className="flex max-w-xs flex-col gap-2">
      <Label
        className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
        htmlFor="volume"
      >
        Volume
      </Label>
      <Slider
        aria-label="Volume"
        className="w-full accent-teal-600 dark:accent-teal-400"
        id="volume"
        name="volume"
        value={value}
        onChange={setValue}
      />
      <p className="text-base text-zinc-600 tabular-nums sm:text-sm dark:text-zinc-400">
        Volume: {value}%
      </p>
    </div>
  );
}
