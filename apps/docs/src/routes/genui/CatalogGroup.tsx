import type { GenUIReference } from "../../content/types.js";

export type CatalogGroupProps = {
  entries: GenUIReference["catalog"];
  className?: string | undefined;
};

/** The catalog components of one group: a jump list, then each component with its props. */
export function CatalogGroup({ entries, className }: CatalogGroupProps) {
  return (
    <div className={`grid min-w-0 gap-10 ${className ?? ""}`}>
      <ul className="flex flex-wrap gap-2" role="list">
        {entries.map((entry) => (
          <li key={entry.name}>
            <a
              className="inline-flex min-h-9 items-center rounded-md border border-zinc-950/10 px-2.5 font-mono text-sm/6 text-teal-800 outline-none hover:bg-zinc-950/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-white/10 dark:text-teal-200 dark:hover:bg-white/5 dark:focus-visible:outline-teal-400"
              href={`#${entry.name}`}
            >
              {entry.name}
            </a>
          </li>
        ))}
      </ul>
      {entries.map((entry) => (
        <article
          aria-labelledby={`${entry.name}-title`}
          className="min-w-0 scroll-mt-24 border-t border-zinc-950/10 pt-6 dark:border-white/10"
          id={entry.name}
          key={entry.name}
        >
          <h3
            className="text-base font-semibold text-zinc-950 dark:text-white"
            id={`${entry.name}-title`}
          >
            <code className="font-mono text-teal-800 dark:text-teal-200">{entry.name}</code>
          </h3>
          <p className="mt-1 max-w-[66ch] text-base/7 text-zinc-600 sm:text-sm/6 dark:text-zinc-300">
            {entry.description}
          </p>
          <div className="mt-4 max-w-full overflow-x-auto rounded-lg border border-zinc-950/10 dark:border-white/10">
            <table className="w-full min-w-xl border-collapse text-left">
              <caption className="sr-only">{`${entry.name} props`}</caption>
              <thead className="bg-zinc-50 dark:bg-white/5">
                <tr className="border-b border-zinc-950/10 dark:border-white/10">
                  <th
                    className="w-44 px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white"
                    scope="col"
                  >
                    Prop
                  </th>
                  <th
                    className="w-64 px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white"
                    scope="col"
                  >
                    Type
                  </th>
                  <th
                    className="px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white"
                    scope="col"
                  >
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/5 dark:divide-white/5">
                {entry.props.map((prop) => (
                  <tr key={prop.name}>
                    <th
                      className="px-3 py-2.5 align-top text-sm/6 font-normal whitespace-nowrap"
                      scope="row"
                    >
                      <code className="font-mono font-medium text-teal-800 dark:text-teal-200">
                        {prop.name}
                      </code>
                      {prop.required && (
                        <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs/5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          Required
                        </span>
                      )}
                    </th>
                    <td className="px-3 py-2.5 align-top text-sm/6 text-blue-900 dark:text-blue-200">
                      <code className="font-mono">{prop.type}</code>
                    </td>
                    <td className="px-3 py-2.5 align-top text-sm/6 text-zinc-600 dark:text-zinc-300">
                      {prop.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}
