import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { componentGroups, components } from "../../content/index.js";
import { getExample } from "../../examples/index.js";

function CardPreview({ slug }: { slug: string }) {
  const Example = getExample(slug);
  if (!Example) return null;
  return (
    <div
      aria-hidden="true"
      // Inert makes the real component purely presentational, like an image.
      inert
      className="pointer-events-none mb-5 flex h-36 items-center overflow-hidden rounded-lg bg-zinc-50 px-6 ring-1 ring-zinc-950/5 select-none dark:bg-white/3 dark:ring-white/10"
    >
      <div className="max-h-32 w-full max-w-60 origin-left scale-90">
        <Example />
      </div>
    </div>
  );
}

export function meta() {
  return [
    { title: "Component field guide · comp0" },
    {
      name: "description",
      content:
        "Browse every graduated comp0 component with anatomy, examples, keyboard behavior, and form contracts.",
    },
  ];
}

export default function ComponentsIndexRoute() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
      <header>
        <p className="font-mono text-sm/6 font-medium tracking-wide text-teal-700 uppercase dark:text-teal-300">
          {components.length} practical patterns
        </p>
        <h1 className="mt-4 max-w-[22ch] text-4xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-5xl dark:text-white">
          Pick the behavior you need. We will open it up together.
        </h1>
        <p className="mt-6 max-w-[62ch] text-lg/8 text-pretty text-zinc-600 dark:text-zinc-300">
          A component page is not a prop dump. It is a small lesson with a live example, an anatomy
          map, exact keyboard controls, and a recipe you can copy one piece at a time.
        </p>
      </header>

      <div className="mt-14 grid gap-14">
        {componentGroups.map((group) => (
          <section aria-labelledby={`group-${group.id}`} key={group.id}>
            <div className="border-b border-zinc-950/10 pb-5 dark:border-white/10">
              <h2
                className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white"
                id={`group-${group.id}`}
              >
                {group.title}
              </h2>
              <p className="mt-2 max-w-[62ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
                {group.description}
              </p>
            </div>
            <ul className="@container mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
              {group.components.map((component) => (
                <li
                  key={component.slug}
                  className="group relative flex h-full min-w-0 flex-col rounded-xl border border-zinc-950/10 p-5 hover:border-teal-700/30 hover:bg-teal-50/50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-teal-600 dark:border-white/10 dark:hover:border-teal-300/20 dark:hover:bg-teal-400/5 dark:has-[a:focus-visible]:outline-teal-400"
                >
                  <CardPreview slug={component.slug} />
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <h3 className="min-w-0 text-lg font-semibold text-zinc-950 group-hover:text-teal-900 dark:text-white dark:group-hover:text-teal-100">
                      <Link
                        className="outline-none after:absolute after:inset-0"
                        to={`/components/${component.slug}`}
                      >
                        {component.title}
                      </Link>
                    </h3>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-6 shrink-0 stroke-zinc-400 group-hover:stroke-teal-700 dark:stroke-zinc-500 dark:group-hover:stroke-teal-300"
                    />
                  </div>
                  <p className="mt-3 text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
                    {component.summary}
                  </p>
                  <p className="mt-6 font-mono text-sm/6 text-zinc-500 dark:text-zinc-400">
                    {component.parts.length} {component.parts.length === 1 ? "part" : "parts"}
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
