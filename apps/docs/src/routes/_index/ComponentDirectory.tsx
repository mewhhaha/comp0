import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { componentGroups } from "../../content/index.js";

export type ComponentDirectoryProps = {
  className?: string | undefined;
};

export function ComponentDirectory({ className }: ComponentDirectoryProps) {
  return (
    <section className={className}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="max-w-[40ch] text-2xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-3xl dark:text-white">
            Find the thing you want to build.
          </h2>
          <p className="mt-4 max-w-[56ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
            Each page starts with a working example, opens the component into labelled parts, and
            rebuilds it one step at a time.
          </p>
        </div>
        <Link
          className="flex shrink-0 items-center gap-2 self-start rounded-lg px-3 py-2.5 text-base/7 font-medium text-teal-700 outline-none hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:self-auto sm:text-sm/6 dark:text-teal-300 dark:hover:bg-teal-400/10 dark:focus-visible:outline-teal-400"
          to="/components"
        >
          See the full index
          <ArrowRight aria-hidden="true" className="size-5 shrink-0 sm:size-4" />
        </Link>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {componentGroups.map((group) => (
          <section key={group.id}>
            <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{group.title}</h3>
            <p className="mt-2 max-w-[55ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
              {group.description}
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3" role="list">
              {group.components.map((component) => (
                <li key={component.slug}>
                  <Link
                    className="flex min-h-12 items-center rounded-lg border border-zinc-950/10 px-3 py-2.5 text-base/7 font-medium text-zinc-700 outline-none hover:border-teal-700/30 hover:bg-teal-50 hover:text-teal-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:text-sm/6 dark:border-white/10 dark:text-zinc-300 dark:hover:border-teal-300/20 dark:hover:bg-teal-400/10 dark:hover:text-teal-100 dark:focus-visible:outline-teal-400"
                    to={`/components/${component.slug}`}
                  >
                    {component.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
