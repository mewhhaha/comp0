import { useId } from "react";
import type { ComponentPart } from "../../content/types.js";
import { cn } from "./cn.js";

type AnatomyProps = {
  parts: ComponentPart[];
  className?: string | undefined;
};

export function Anatomy({ parts, className }: AnatomyProps) {
  const id = useId().replaceAll(":", "");
  const titleId = `${id}-anatomy-title`;
  const svgTitleId = `${id}-anatomy-svg-title`;
  const svgDescriptionId = `${id}-anatomy-svg-description`;
  return (
    <section
      className={cn(
        "max-w-full min-w-0 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
      aria-labelledby={titleId}
    >
      <h3 id={titleId} className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        Anatomy
      </h3>
      <div
        aria-label="The invisible root shares behavior with each numbered visible component part."
        className="mt-4 grid gap-3 sm:hidden"
        role="img"
      >
        <div className="rounded-lg border border-dashed border-teal-600/60 bg-teal-50 p-3 dark:border-teal-400/50 dark:bg-teal-400/5">
          <p className="font-mono text-base/7 font-medium text-teal-800 dark:text-teal-200">
            Invisible shared state
          </p>
          <p className="mt-1 text-base/7 text-zinc-600 dark:text-zinc-300">
            Remembers values and passes behavior down.
          </p>
        </div>
        <p className="text-center font-mono text-base/7 text-zinc-500 dark:text-zinc-400">
          sends behavior to ↓
        </p>
        <div className="grid grid-cols-2 gap-2">
          {parts.map((part, index) => (
            <div
              className="min-w-0 rounded-lg bg-zinc-50 p-3 ring-1 ring-zinc-950/10 dark:bg-white/5 dark:ring-white/10"
              key={part.name}
            >
              <p className="font-mono text-base/7 text-teal-700 tabular-nums dark:text-teal-300">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-base/7 font-medium wrap-break-word text-zinc-950 dark:text-white">
                {part.name}
              </p>
            </div>
          ))}
        </div>
      </div>
      <svg
        className="mt-4 hidden h-auto max-w-full sm:block"
        viewBox="0 0 720 270"
        role="img"
        aria-labelledby={`${svgTitleId} ${svgDescriptionId}`}
      >
        <title id={svgTitleId}>Component part map</title>
        <desc id={svgDescriptionId}>
          A wireframe component with connectors to each of its named parts.
        </desc>
        <rect
          x="240"
          y="46"
          width="240"
          height="176"
          rx="12"
          fill="none"
          stroke="currentColor"
          className="text-zinc-400 dark:text-zinc-500"
          strokeWidth="2"
        />
        <rect
          x="268"
          y="78"
          width="184"
          height="28"
          rx="6"
          fill="currentColor"
          className="text-zinc-200 dark:text-zinc-700"
        />
        <rect
          x="268"
          y="122"
          width="132"
          height="22"
          rx="5"
          fill="currentColor"
          className="text-zinc-200 dark:text-zinc-700"
        />
        <rect
          x="268"
          y="160"
          width="156"
          height="34"
          rx="6"
          fill="currentColor"
          className="text-zinc-200 dark:text-zinc-700"
        />
        {parts.map((part, index) => {
          const left = index % 2 === 0;
          const row = Math.floor(index / 2);
          const y = 45 + row * (170 / Math.max(1, Math.ceil(parts.length / 2) - 1 || 1));
          const x = left ? 18 : 548;
          const endX = left ? 240 : 480;
          const startX = left ? 175 : 545;
          return (
            <g
              key={part.name}
              className={cn(
                index % 2 === 0 && "text-teal-600 dark:text-teal-400",
                index % 2 !== 0 && "text-zinc-500 dark:text-zinc-400",
              )}
            >
              <path
                d={`M ${startX} ${y + 18} H ${endX} V ${134 + ((index % 3) - 1) * 30}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx={endX} cy={134 + ((index % 3) - 1) * 30} r="4" fill="currentColor" />
              <rect
                x={x}
                y={y}
                width="157"
                height="36"
                rx="7"
                fill="currentColor"
                className="text-zinc-100 dark:text-zinc-800"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <text
                x={x + 12}
                y={y + 23}
                className="fill-zinc-800 text-[0.8125rem] font-semibold dark:fill-zinc-100"
              >
                {part.name}
              </text>
            </g>
          );
        })}
      </svg>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2" role="list">
        {parts.map((part, index) => (
          <li
            key={part.name}
            className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2.5 rounded-full bg-current",
                  index % 2 === 0 && "text-teal-600 dark:text-teal-400",
                  index % 2 !== 0 && "text-zinc-500 dark:text-zinc-400",
                )}
                aria-hidden="true"
              />
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{part.name}</span>
              {part.optional && (
                <span className="text-base text-zinc-500 sm:text-sm dark:text-zinc-400">
                  Optional
                </span>
              )}
            </div>
            <p className="mt-1 text-base/6 text-zinc-600 sm:text-sm dark:text-zinc-300">
              {part.description}
            </p>
            <p className="mt-1 text-base font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">
              {part.ownsDom ? "Owns a DOM element" : "Does not add a DOM element"}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
