import { Button, Drawer, DrawerContent, DrawerTrigger } from "@comp0/react";
import { XMarkIcon } from "@heroicons/react/20/solid";

export function Example() {
  return (
    <Drawer side="right">
      <DrawerTrigger className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950">
        Open settings
      </DrawerTrigger>
      <DrawerContent
        aria-labelledby="drawer-settings-title"
        className="fixed m-0 h-dvh max-h-none w-[min(22rem,calc(100vw-2rem))] border-0 bg-white p-5 text-zinc-900 opacity-100 shadow-2xl ring-1 ring-zinc-950/10 transition-[opacity,translate] duration-150 ease-out data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:left-auto data-[side=right]:translate-x-0 data-[side=right]:starting:translate-x-4 starting:opacity-0 data-dragging:transition-none motion-reduce:transition-none backdrop:bg-zinc-950/40 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-none dark:ring-white/10"
      >
        <div className="flex h-full flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <h2 id="drawer-settings-title" className="text-lg font-semibold">
                Settings
              </h2>
              <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                Drag the panel toward the right edge to dismiss it, or press Escape.
              </p>
            </div>
            <form method="dialog">
              <Button
                type="submit"
                aria-label="Close settings"
                className="rounded p-2 text-zinc-500 outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 dark:text-zinc-400 dark:outline-teal-400 dark:hover:bg-zinc-800"
              >
                <XMarkIcon className="size-5" aria-hidden="true" />
              </Button>
            </form>
          </div>
          <div className="grid gap-3 text-base sm:text-sm">
            <label className="flex items-center justify-between gap-4">
              Product updates
              <input type="checkbox" defaultChecked className="size-4 accent-teal-700" />
            </label>
            <label className="flex items-center justify-between gap-4">
              Weekly digest
              <input type="checkbox" className="size-4 accent-teal-700" />
            </label>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
