import { Button, Dialog, DialogContent, DialogTrigger } from "@comp0/react";

export function Example() {
  return (
    <Dialog>
      <DialogTrigger className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950">
        Open dialog
      </DialogTrigger>
      <DialogContent
        aria-label="Example dialog"
        className="m-auto w-[min(24rem,calc(100vw-2rem))] translate-y-0 rounded-[min(1vw,12px)] bg-white p-4 text-zinc-900 opacity-100 shadow-2xl ring-1 ring-zinc-950/10 transition-[opacity,translate] duration-150 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none backdrop:bg-zinc-950/40 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-none dark:ring-white/10"
      >
        <div className="flex flex-col gap-2">
          <p className="text-base font-medium sm:text-sm">Ready to publish?</p>
          <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
            This dialog is scoped to this example.
          </p>
          <form method="dialog" className="flex pt-2">
            <Button
              className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950"
              type="submit"
            >
              Done
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
