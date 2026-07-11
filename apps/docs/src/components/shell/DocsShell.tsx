import { type ReactNode } from "react";
import { DocsHeader } from "./DocsHeader.js";
import { DocsNavigation } from "./DocsNavigation.js";

export type DocsShellProps = {
  children: ReactNode;
  className?: string | undefined;
};

export function DocsShell({ children, className }: DocsShellProps) {
  return (
    <div
      className={`isolate min-h-dvh bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white ${className ?? ""}`}
    >
      <a
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg bg-zinc-950 px-3 py-2 text-base/7 text-white outline-none focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 sm:text-sm/6 dark:bg-white dark:text-zinc-950"
        href="#main-content"
      >
        Skip to content
      </a>
      <DocsHeader />
      <div className="mx-auto grid max-w-360 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="border-r border-zinc-950/10 max-lg:hidden dark:border-white/10">
          <div className="sticky top-16 h-[calc(100dvh-4rem)] overflow-y-auto px-6 py-8">
            <DocsNavigation />
          </div>
        </aside>
        <div className="min-w-0">
          <main id="main-content">{children}</main>
          <footer className="border-t border-zinc-950/10 px-4 py-8 text-base/7 text-zinc-500 sm:px-6 sm:text-sm/6 lg:px-10 dark:border-white/10 dark:text-zinc-400">
            <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>Built to teach the contract, not prescribe the pixels.</p>
              <p className="font-mono">@comp0/react · internal alpha</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
