import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button, Dialog, DialogContent, DialogTrigger } from "@comp0/react";
import { DocsNavigation } from "./DocsNavigation.js";

export type MobileNavigationProps = {
  className?: string | undefined;
};

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onToggle={setOpen}>
      <DialogTrigger
        aria-label="Open documentation navigation"
        className={`relative grid size-10 place-items-center rounded-lg text-zinc-600 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400 ${className ?? ""}`}
      >
        <Bars3Icon aria-hidden="true" className="size-6 shrink-0" />
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
        />
      </DialogTrigger>
      <DialogContent
        aria-labelledby="mobile-navigation-title"
        className="inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(24rem,calc(100vw-2rem))] max-w-none border-0 bg-white p-0 text-zinc-950 shadow-xl backdrop:bg-zinc-950/30 dark:bg-zinc-950 dark:text-white dark:shadow-none dark:backdrop:bg-black/60"
      >
        <div className="flex h-full min-w-0 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-950/10 px-5 py-4 dark:border-white/10">
            <h2 className="font-mono text-lg font-semibold" id="mobile-navigation-title">
              comp0
            </h2>
            <Button
              aria-label="Close documentation navigation"
              className="relative grid size-10 place-items-center rounded-lg text-zinc-600 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400"
              onClick={() => setOpen(false)}
            >
              <XMarkIcon aria-hidden="true" className="size-6 shrink-0" />
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden"
              />
            </Button>
          </div>
          <DocsNavigation
            className="min-w-0 flex-1 overflow-y-auto px-5 py-6"
            onNavigate={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
