import { Link } from "react-router";

export type LearningPathProps = {
  className?: string | undefined;
};

const steps = [
  {
    number: "01",
    title: "Install one package",
    description: "Use the root import and render your first native-feeling button.",
    href: "/learn/installation",
  },
  {
    number: "02",
    title: "Put the parts together",
    description: "Let a root share behavior while its children own the visible DOM.",
    href: "/learn/composition",
  },
  {
    number: "03",
    title: "Style what happened",
    description: "Target data attributes such as open, selected, invalid, and pressed.",
    href: "/learn/styling",
  },
];

export function LearningPath({ className }: LearningPathProps) {
  return (
    <section className={className}>
      <div>
        <h2 className="max-w-[40ch] text-2xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-3xl dark:text-white">
          Start with the idea, then touch the API.
        </h2>
        <p className="mt-4 max-w-[56ch] text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
          You do not need to memorize a component catalog. Follow this path once and every family
          will feel familiar.
        </p>
      </div>
      <ol
        className="mt-10 grid border-y border-zinc-950/10 lg:grid-cols-3 dark:border-white/10"
        role="list"
      >
        {steps.map((step) => (
          <li
            className="border-t border-zinc-950/10 py-6 first:border-t-0 lg:border-t-0 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0 dark:border-white/10"
            key={step.number}
          >
            <Link
              className="group outline-none focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
              to={step.href}
            >
              <p className="font-mono text-sm/6 text-teal-700 tabular-nums dark:text-teal-300">
                {step.number}
              </p>
              <h3 className="mt-4 text-lg font-semibold text-zinc-950 group-hover:text-teal-800 dark:text-white dark:group-hover:text-teal-200">
                {step.title}
              </h3>
              <p className="mt-2 text-base/7 text-pretty text-zinc-600 dark:text-zinc-300">
                {step.description}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
