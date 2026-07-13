import { Button, Dialog, DialogContent, DialogTrigger } from "@comp0/react";

export function Example() {
  return (
    <Dialog>
      <DialogTrigger className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950">
        Edit profile
      </DialogTrigger>
      <DialogContent
        aria-labelledby="profile-modal-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] translate-y-0 rounded-[min(1vw,12px)] bg-white p-5 text-zinc-900 opacity-100 shadow-2xl ring-1 ring-zinc-950/10 transition-[opacity,translate] duration-150 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none backdrop:bg-zinc-950/40 dark:bg-zinc-900 dark:text-zinc-50 dark:shadow-none dark:ring-white/10"
      >
        <form method="dialog" className="grid gap-4">
          <div className="grid gap-1">
            <h2 id="profile-modal-title" className="text-lg font-semibold">
              Edit profile
            </h2>
            <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
              Update the name shown to your teammates.
            </p>
          </div>
          <label className="grid gap-1.5 text-base font-medium sm:text-sm">
            Display name
            <input
              className="rounded border border-zinc-950/10 bg-white px-3 py-2.5 font-normal outline-teal-600 focus-visible:outline-2 sm:py-2 dark:border-white/10 dark:bg-zinc-950 dark:outline-teal-400"
              defaultValue="Ada Lovelace"
              name="displayName"
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              className="rounded border border-zinc-950/10 px-3 py-2.5 text-base sm:py-2 sm:text-sm dark:border-white/10"
              type="submit"
            >
              Cancel
            </Button>
            <Button
              className="rounded bg-teal-700 px-3 py-2.5 text-base text-white sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950"
              type="submit"
            >
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
