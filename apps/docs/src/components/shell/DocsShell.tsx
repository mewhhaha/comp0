import { useEffect, useState, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { SkipLink, Toast, ToastDismiss, ToastProvider, ToastRegion } from "@comp0/react";
import { CommandPalette } from "./CommandPalette.js";
import { DocsHeader } from "./DocsHeader.js";
import { DocsNavigation } from "./DocsNavigation.js";

export type DocsShellProps = {
  children: ReactNode;
  className?: string | undefined;
};

export function DocsShell({ children, className }: DocsShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey;
      if (!hasModifier || event.altKey || event.shiftKey) return;
      if (event.key !== "k" && event.key !== "K") return;
      event.preventDefault();
      setPaletteOpen((current) => !current);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <ToastProvider>
      <div
        className={`isolate min-h-dvh bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white ${className ?? ""}`}
      >
        <SkipLink
          className="fixed top-3 left-3 z-50 rounded-lg bg-zinc-950 px-3 py-2 text-base/7 text-white outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 sm:text-sm/6 dark:bg-white dark:text-zinc-950"
          href="#main"
        >
          Skip to content
        </SkipLink>
        <DocsHeader onOpenSearch={() => setPaletteOpen(true)} />
        <div className="mx-auto grid max-w-360 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="border-r border-zinc-950/10 max-lg:hidden dark:border-white/10">
            <div className="sticky top-16 h-[calc(100dvh-4rem)] overflow-y-auto px-6 py-8">
              <DocsNavigation />
            </div>
          </aside>
          <div className="min-w-0">
            <main id="main">{children}</main>
            <footer className="border-t border-zinc-950/10 px-4 py-8 text-base/7 text-zinc-500 sm:px-6 sm:text-sm/6 lg:px-10 dark:border-white/10 dark:text-zinc-400">
              <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>Built to teach the contract, not prescribe the pixels.</p>
                <p className="font-mono">@comp0/react · internal alpha</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onToggle={setPaletteOpen} />
      <ToastRegion className="inset-auto right-4 bottom-4 m-0 flex w-80 flex-col gap-2 border-0 bg-transparent p-0">
        {(toast) => (
          <Toast
            className="flex items-start justify-between gap-3 rounded-xl border border-zinc-950/10 bg-white p-3 text-base/7 text-zinc-900 shadow-lg sm:text-sm/6 data-[kind=alert]:border-red-600/30 data-[kind=alert]:text-red-700 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:data-[kind=alert]:border-red-400/30 dark:data-[kind=alert]:text-red-300"
            toast={toast}
          >
            <span className="min-w-0">{toast.content}</span>
            <ToastDismiss className="rounded p-1 text-zinc-500 outline-none hover:bg-zinc-950/10 hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100 dark:focus-visible:outline-teal-400">
              <XMarkIcon aria-hidden="true" className="size-4 shrink-0" />
            </ToastDismiss>
          </Toast>
        )}
      </ToastRegion>
    </ToastProvider>
  );
}
