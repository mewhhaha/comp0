import type { ReferenceTable as ReferenceTableData } from "../../content/types.js";
import { InlineText } from "./InlineText.js";

export type ReferenceTableProps = {
  table: ReferenceTableData;
  className?: string | undefined;
};

export function ReferenceTable({ table, className }: ReferenceTableProps) {
  const headings = table.headings ?? ["Prop", "Type", "Description"];
  const [nameHeading] = headings;
  const typeHeading = headings.length === 3 ? headings[1] : undefined;
  const descriptionHeading = headings.at(-1);

  return (
    <div
      className={`max-w-full overflow-x-auto rounded-lg border border-zinc-950/10 dark:border-white/10 ${className ?? ""}`}
    >
      <table className="w-full min-w-xl border-collapse text-left">
        <caption className="border-b border-zinc-950/10 px-3 py-2 text-left text-sm/6 font-semibold text-zinc-950 dark:border-white/10 dark:text-white">
          {table.caption}
        </caption>
        <thead className="bg-zinc-50 dark:bg-white/5">
          <tr className="border-b border-zinc-950/10 dark:border-white/10">
            <th
              className="w-48 px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white"
              scope="col"
            >
              {nameHeading}
            </th>
            {typeHeading && (
              <th
                className="w-64 px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white"
                scope="col"
              >
                {typeHeading}
              </th>
            )}
            <th
              className="px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white"
              scope="col"
            >
              {descriptionHeading}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-950/5 dark:divide-white/5">
          {table.rows.map((row) => (
            <tr key={`${row.name}-${row.type ?? ""}`}>
              <th
                className="px-3 py-2.5 align-top text-sm/6 font-normal whitespace-nowrap"
                scope="row"
              >
                <code className="font-mono font-medium text-teal-800 dark:text-teal-200">
                  {row.name}
                </code>
              </th>
              {typeHeading && (
                <td className="px-3 py-2.5 align-top text-sm/6 text-blue-900 dark:text-blue-200">
                  <code className="font-mono">{row.type}</code>
                </td>
              )}
              <td className="px-3 py-2.5 align-top text-sm/6 text-zinc-600 dark:text-zinc-300">
                <InlineText text={row.description} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
