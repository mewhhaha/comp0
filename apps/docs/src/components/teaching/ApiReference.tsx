import type { ComponentPart, PartProp } from "../../content/types.js";
import { cn } from "./cn.js";
import { CodeBlock } from "./CodeBlock.js";

type ApiReferenceProps = {
  imports: string[];
  parts: ComponentPart[];
  className?: string | undefined;
};

const controlledPropNames: Record<string, readonly [string, string]> = {
  "selected / defaultSelected": ["selected", "defaultSelected"],
  "value / defaultValue": ["value", "defaultValue"],
};

function splitControlledProp(partProp: PartProp): PartProp[] {
  const names = controlledPropNames[partProp.name];
  if (!names) return [partProp];
  const [controlledName, initialName] = names;
  return [
    {
      ...partProp,
      name: controlledName,
      description: partProp.description.replace("Controlled or initial", "Controlled"),
    },
    {
      ...partProp,
      name: initialName,
      description: partProp.description.replace("Controlled or initial", "Initial"),
    },
  ];
}

export function ApiReference({ imports, parts, className }: ApiReferenceProps) {
  const importStatement = `import { ${imports.join(", ")} } from "@comp0/react";`;
  return (
    <section className={cn("max-w-full min-w-0", className)}>
      <CodeBlock code={importStatement} title="Import" />
      <div className="mt-8 grid gap-8">
        {parts.map((part) => (
          <section
            key={part.name}
            className="border-t border-zinc-950/10 pt-6 first:border-t-0 first:pt-0 dark:border-white/10"
          >
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
                <code className="font-mono text-teal-800 dark:text-teal-200">{part.name}</code>
              </h3>
              {part.optional && (
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs/5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Optional
                </span>
              )}
              <span className="text-xs/5 text-zinc-500 dark:text-zinc-400">
                {part.ownsDom ? "DOM element" : "Context only"}
              </span>
            </div>
            <p className="mt-1 max-w-[66ch] text-base/7 text-zinc-600 sm:text-sm/6 dark:text-zinc-300">
              {part.description}
            </p>
            {part.props && (
              <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-950/10 dark:border-white/10">
                <table className="w-full min-w-2xl border-collapse text-left">
                  <thead className="bg-zinc-50 dark:bg-white/5">
                    <tr className="border-b border-zinc-950/10 dark:border-white/10">
                      <th className="w-48 px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white">
                        Prop
                      </th>
                      <th className="w-64 px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white">
                        Type
                      </th>
                      <th className="px-3 py-2 text-sm/6 font-semibold whitespace-nowrap text-zinc-950 dark:text-white">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-950/5 dark:divide-white/5">
                    {part.props.flatMap(splitControlledProp).map((partProp) => (
                      <tr key={partProp.name}>
                        <td className="px-3 py-2.5 align-top text-sm/6 whitespace-nowrap">
                          <code className="font-mono font-medium text-teal-800 dark:text-teal-200">
                            {partProp.name}
                          </code>
                        </td>
                        <td className="px-3 py-2.5 align-top text-sm/6 text-blue-900 dark:text-blue-200">
                          <code className="font-mono">{partProp.type}</code>
                        </td>
                        <td className="px-3 py-2.5 align-top text-sm/6 text-zinc-600 dark:text-zinc-300">
                          {partProp.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
