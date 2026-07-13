import { Button, Dialog, DialogContent, DialogTrigger } from "@comp0/react";
import { XMarkIcon } from "@heroicons/react/20/solid";

export function Example() {
  return (
    <Dialog>
      <DialogTrigger className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950">
        Open drawer
      </DialogTrigger>
      <DialogContent
        aria-labelledby="drawer-title"
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(24rem,calc(100vw-2rem))] translate-x-0 border-0 bg-white p-5 text-zinc-900 opacity-100 shadow-2xl ring-1 ring-zinc-950/10 transition-[opacity,translate] duration-150 ease-out starting:translate-x-2 starting:opacity-0 motion-reduce:transition-none backdrop:bg-zinc-950/40 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-none dark:ring-white/10"
      >
        <div className="flex h-full flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-1">
              <h2 id="drawer-title" className="text-lg font-semibold">
                Notifications
              </h2>
              <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
                Choose which updates should reach you.
              </p>
            </div>
            <form method="dialog">
              <Button
                type="submit"
                aria-label="Close notifications"
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
      </DialogContent>
    </Dialog>
  );
}
