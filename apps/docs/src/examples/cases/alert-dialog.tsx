import { AlertDialog, AlertDialogContent, Button, DialogTrigger } from "@comp0/react";

export function Example() {
  return (
    <AlertDialog>
      <DialogTrigger className="rounded border border-red-950/10 px-3 py-2.5 text-base text-red-700 sm:py-2 sm:text-sm dark:border-red-200/10 dark:text-red-300">
        Delete draft
      </DialogTrigger>
      <AlertDialogContent
        aria-label="Delete draft"
        className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-[min(1vw,12px)] bg-white p-4 text-zinc-900 shadow-2xl ring-1 ring-red-950/10 backdrop:bg-zinc-950/40 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-none dark:ring-red-200/10"
      >
        <div className="flex flex-col gap-2">
          <p className="text-base font-medium sm:text-sm">Delete this draft?</p>
          <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
            This action cannot be undone.
          </p>
          <form method="dialog" className="flex gap-2 pt-2">
            <Button
              className="rounded border border-zinc-950/10 px-3 py-2.5 text-base text-zinc-800 sm:py-2 sm:text-sm dark:border-white/10 dark:text-zinc-100"
              type="submit"
            >
              Cancel
            </Button>
            <Button
              className="rounded bg-red-600 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm"
              type="submit"
            >
              Delete
            </Button>
          </form>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
