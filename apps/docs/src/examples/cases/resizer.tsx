import { useState } from "react";
import { Resizer } from "@comp0/react";

export function Example() {
  const [width, setWidth] = useState(180);

  return (
    <div className="flex h-40 w-full max-w-md overflow-hidden rounded border border-zinc-950/10 dark:border-white/10">
      <div
        className="relative shrink-0 bg-zinc-50 p-3 text-base text-zinc-700 sm:text-sm dark:bg-zinc-900 dark:text-zinc-200"
        style={{ width }}
      >
        Sidebar ({width}px)
        <Resizer
          aria-label="Resize sidebar"
          className="absolute inset-y-0 right-0 w-1.5 bg-zinc-950/10 outline-teal-600 focus-visible:outline-2 data-dragging:bg-teal-600 dark:bg-white/10 dark:outline-teal-400 dark:data-dragging:bg-teal-400"
          min={120}
          max={320}
          size={width}
          onResize={setWidth}
        />
      </div>
      <div className="flex-1 p-3 text-base text-zinc-600 sm:text-sm dark:text-zinc-300">
        Drag the divider, or focus it and press the arrow keys.
      </div>
    </div>
  );
}
