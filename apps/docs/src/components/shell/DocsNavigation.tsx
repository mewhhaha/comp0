import { NavLink } from "react-router";
import { componentGroups, learnDocs } from "../../content/index.js";

export type DocsNavigationProps = {
  className?: string | undefined;
  onNavigate?: (() => void) | undefined;
};

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "flex min-w-0 items-center rounded-lg px-3 py-2.5 text-base/7 text-zinc-600 outline-none hover:bg-zinc-950/5 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:outline-teal-400",
    isActive ? "bg-zinc-950/5 text-zinc-950 dark:bg-white/5 dark:text-white" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function DocsNavigation({ className, onNavigate }: DocsNavigationProps) {
  return (
    <nav aria-label="Documentation" className={className}>
      <div>
        <p className="font-mono text-sm/6 font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
          Start here
        </p>
        <ul className="mt-2 grid gap-0.5" role="list">
          <li>
            <NavLink className={navLinkClass} end onClick={onNavigate} to="/">
              Welcome
            </NavLink>
          </li>
          {learnDocs.map((lesson) => (
            <li key={lesson.slug}>
              <NavLink className={navLinkClass} onClick={onNavigate} to={`/learn/${lesson.slug}`}>
                {lesson.order}. {lesson.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <NavLink
          className="font-mono text-sm/6 font-medium tracking-wide text-teal-700 uppercase outline-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 dark:text-teal-300 dark:focus-visible:outline-teal-400"
          onClick={onNavigate}
          to="/components"
        >
          Components
        </NavLink>
        <div className="mt-3 grid gap-7">
          {componentGroups.map((group) => (
            <section key={group.id}>
              <h2 className="text-base font-medium text-zinc-950 sm:text-sm dark:text-white">
                {group.title}
              </h2>
              <ul className="mt-1 grid gap-0.5" role="list">
                {group.components.map((component) => (
                  <li key={component.slug}>
                    <NavLink
                      className={navLinkClass}
                      onClick={onNavigate}
                      to={`/components/${component.slug}`}
                    >
                      {component.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </nav>
  );
}
