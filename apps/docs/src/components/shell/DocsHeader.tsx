import { Link, NavLink } from "react-router";
import { MobileNavigation } from "./MobileNavigation.js";

export type DocsHeaderProps = {
  className?: string | undefined;
};

function headerLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-lg px-3 py-2 text-sm/6 text-zinc-600 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400",
    isActive ? "bg-zinc-950/5 text-zinc-950 dark:bg-white/5 dark:text-white" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function DocsHeader({ className }: DocsHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-40 border-b border-zinc-950/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-zinc-950/90 ${className ?? ""}`}
    >
      <div className="mx-auto flex h-16 max-w-360 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center">
          <Link
            aria-label="Homepage"
            className="min-w-0 rounded-md font-mono text-lg font-semibold text-zinc-950 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 dark:text-white dark:focus-visible:outline-teal-400"
            to="/"
          >
            comp0
          </Link>
        </div>
        <nav aria-label="Primary" className="flex items-center gap-1 max-lg:hidden">
          <NavLink className={headerLinkClass} to="/learn/installation">
            Learn
          </NavLink>
          <NavLink className={headerLinkClass} to="/components">
            Components
          </NavLink>
        </nav>
        <div className="flex flex-1 items-center justify-end">
          <MobileNavigation className="lg:hidden" />
        </div>
      </div>
    </header>
  );
}
