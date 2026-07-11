import type { ComponentPart } from "../../content/types.js";
import { cn } from "./cn.js";
import { CodeBlock } from "./CodeBlock.js";

type ApiReferenceProps = {
  imports: string[];
  parts: ComponentPart[];
  className?: string | undefined;
};

export function ApiReference({ imports, parts, className }: ApiReferenceProps) {
  const importStatement = `import { ${imports.join(", ")} } from "@comp0/react";`;
  return (
    <section
      className={cn(
        "max-w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
    >
      <h3 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">API reference</h3>
      <CodeBlock className="mt-4" code={importStatement} title="Import" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-md border-collapse text-left">
          <thead>
            <tr className="border-b border-zinc-950/10 dark:border-white/10">
              <th className="py-2 pr-4 text-sm/6 font-semibold text-zinc-950 dark:text-white">
                Part
              </th>
              <th className="py-2 pr-4 text-sm/6 font-semibold text-zinc-950 dark:text-white">
                Renders
              </th>
              <th className="py-2 text-sm/6 font-semibold text-zinc-950 dark:text-white">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => (
              <tr
                key={part.name}
                className="border-b border-zinc-950/5 last:border-b-0 dark:border-white/5"
              >
                <td className="py-2.5 pr-4 align-top">
                  <code className="font-mono text-sm/6 font-medium whitespace-nowrap text-teal-800 dark:text-teal-200">
                    {part.name}
                  </code>
                  {part.optional && (
                    <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs/5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      Optional
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-4 align-top text-sm/6 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                  {part.ownsDom ? "DOM element" : "Context only"}
                </td>
                <td className="py-2.5 align-top text-sm/6 text-zinc-600 dark:text-zinc-300">
                  {part.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
