import { Link } from "react-router";
import { ComponentPreview } from "../../components/teaching/index.js";
import { componentGroups, components } from "../../content/index.js";

export function meta() {
  return [
    { title: "Components · comp0" },
    {
      name: "description",
      content:
        "Browse every graduated comp0 component with anatomy, examples, keyboard behavior, and form contracts.",
    },
  ];
}

export function ServerComponent() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl dark:text-white">
          Components
        </h1>
        <p className="mt-4 max-w-[52ch] text-lg/8 text-pretty text-zinc-600 dark:text-zinc-300">
          {components.length} patterns, each opened up with a live example, an anatomy map, exact
          keyboard controls, and a recipe you can copy one piece at a time.
        </p>
      </header>

      <div className="mt-14 grid gap-14">
        {componentGroups.map((group) => (
          <section aria-labelledby={`group-${group.id}`} key={group.id}>
            <h2
              className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white"
              id={`group-${group.id}`}
            >
              {group.title}
            </h2>
            <p className="mt-2 max-w-[62ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
              {group.description}
            </p>
            <ul className="@container mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
              {group.components.map((component) => (
                <li
                  key={component.slug}
                  className="group relative flex h-full min-w-0 flex-col rounded-xl border border-zinc-950/10 p-5 hover:border-teal-700/30 hover:bg-teal-50/50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-teal-600 dark:border-white/10 dark:hover:border-teal-300/20 dark:hover:bg-teal-400/5 dark:has-[a:focus-visible]:outline-teal-400"
                >
                  <ComponentPreview className="mb-5" slug={component.slug} />
                  <h3 className="min-w-0 text-lg font-semibold text-zinc-950 group-hover:text-teal-900 dark:text-white dark:group-hover:text-teal-100">
                    <Link
                      className="outline-none after:absolute after:inset-0"
                      to={`/components/${component.slug}`}
                    >
                      {component.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
                    {component.summary}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
