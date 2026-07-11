import { useId } from "react";
import type { KeyboardAction, KeyboardToken } from "../../content/types.js";
import { cn } from "./cn.js";

const keyLabels: Record<KeyboardToken, { visual: string; spoken: string }> = {
  ArrowDown: { visual: "↓", spoken: "Arrow down" },
  ArrowLeft: { visual: "←", spoken: "Arrow left" },
  ArrowRight: { visual: "→", spoken: "Arrow right" },
  ArrowUp: { visual: "↑", spoken: "Arrow up" },
  End: { visual: "End", spoken: "End" },
  Enter: { visual: "↵", spoken: "Enter" },
  Escape: { visual: "Esc", spoken: "Escape" },
  Home: { visual: "Home", spoken: "Home" },
  Shift: { visual: "⇧", spoken: "Shift" },
  Space: { visual: "Space", spoken: "Space" },
  Tab: { visual: "⇥", spoken: "Tab" },
};

type KeycapProps = {
  token: KeyboardToken;
  className?: string | undefined;
};

export function Keycap({ token, className }: KeycapProps) {
  const key = keyLabels[token];
  return (
    <kbd
      className={cn(
        "inline-flex min-h-7 items-center justify-center rounded border border-zinc-300 bg-zinc-100 px-2 font-mono text-base font-semibold text-zinc-700 sm:text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100",
        className,
      )}
      aria-label={key.spoken}
    >
      {key.visual}
    </kbd>
  );
}

type KeyboardGuideProps = {
  actions: KeyboardAction[];
  className?: string | undefined;
};

export function KeyboardGuide({ actions, className }: KeyboardGuideProps) {
  const titleId = `${useId().replaceAll(":", "")}-keyboard-guide-title`;
  return (
    <section
      className={cn(
        "rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
      aria-labelledby={titleId}
    >
      <h3 id={titleId} className="text-lg font-semibold text-zinc-950 dark:text-white">
        Keyboard guide
      </h3>
      <dl className="mt-4 grid gap-4">
        {actions.map((item) => (
          <div
            key={`${item.keys.join("-")}-${item.action}`}
            className="grid gap-2 sm:grid-cols-[minmax(10rem,auto)_1fr] sm:items-center"
          >
            <dt className="flex flex-wrap gap-1.5">
              {item.keys.map((token) => (
                <Keycap key={token} token={token} />
              ))}
            </dt>
            <dd className="text-base/6 text-zinc-600 sm:text-sm dark:text-zinc-300">
              {item.action}
              {item.scope && (
                <span className="text-zinc-500 dark:text-zinc-400"> · {item.scope}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
