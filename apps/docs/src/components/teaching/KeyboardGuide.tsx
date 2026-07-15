import type { KeyboardAction, KeyboardToken } from "../../content/types.js";
import { cn } from "./cn.js";

const keyLabels: Record<KeyboardToken, { visual: string; spoken: string }> = {
  Alt: { visual: "Alt", spoken: "Alt or Option" },
  ArrowDown: { visual: "↓", spoken: "Arrow down" },
  ArrowLeft: { visual: "←", spoken: "Arrow left" },
  ArrowRight: { visual: "→", spoken: "Arrow right" },
  ArrowUp: { visual: "↑", spoken: "Arrow up" },
  Backspace: { visual: "⌫", spoken: "Backspace" },
  ContextMenu: { visual: "☰", spoken: "Context menu key" },
  Ctrl: { visual: "Ctrl", spoken: "Control" },
  End: { visual: "End", spoken: "End" },
  Enter: { visual: "↵", spoken: "Enter" },
  Escape: { visual: "Esc", spoken: "Escape" },
  F10: { visual: "F10", spoken: "F10" },
  Home: { visual: "Home", spoken: "Home" },
  PageDown: { visual: "PgDn", spoken: "Page down" },
  PageUp: { visual: "PgUp", spoken: "Page up" },
  Shift: { visual: "⇧", spoken: "Shift" },
  Space: { visual: "Space", spoken: "Space" },
  Tab: { visual: "⇥", spoken: "Tab" },
};

type KeycapProps = {
  token: KeyboardToken;
  className?: string | undefined;
};

function Keycap({ token, className }: KeycapProps) {
  const key = keyLabels[token];
  return (
    <kbd
      className={cn(
        `
          inline-flex min-h-7 items-center justify-center rounded-md bg-zinc-50
          px-2 font-mono text-base font-medium text-zinc-700 ring-1
          ring-zinc-950/10 ring-inset
          sm:text-sm
          dark:bg-white/5 dark:text-zinc-100 dark:ring-white/10
        `,
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
  return (
    <dl className={cn("grid divide-y divide-zinc-950/5", "dark:divide-white/10", className)}>
      {actions.map((item) => (
        <div
          key={`${item.keys.join("-")}-${item.action}`}
          className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(11rem,auto)_1fr] sm:items-center"
        >
          <dt className="flex flex-wrap gap-1.5">
            {item.keys.map((token) => (
              <Keycap key={token} token={token} />
            ))}
          </dt>
          <dd className="text-base/7 text-zinc-600 sm:text-sm/6 dark:text-zinc-300">
            {item.action}
            {item.scope && (
              <span className="text-zinc-500 dark:text-zinc-400"> · {item.scope}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
