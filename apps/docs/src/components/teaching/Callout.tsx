import type { ReactNode } from "react";
import { AlertTriangle, CircleCheck, Info, Lightbulb } from "lucide-react";
import { cn } from "./cn.js";

type CalloutProps = {
  children: ReactNode;
  title?: string | undefined;
  tone?: "info" | "tip" | "warning" | "success" | undefined;
  className?: string | undefined;
};

const tones = {
  info: {
    Icon: Info,
    classes:
      "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-50",
  },
  tip: {
    Icon: Lightbulb,
    classes:
      "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-50",
  },
  warning: {
    Icon: AlertTriangle,
    classes:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-50",
  },
  success: {
    Icon: CircleCheck,
    classes:
      "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-50",
  },
};

export function Callout({ children, title, tone = "info", className }: CalloutProps) {
  const { Icon, classes } = tones[tone];
  return (
    <aside className={cn("flex items-start gap-3 rounded-xl border p-4", classes, className)}>
      <Icon className="mt-0.5 size-5 shrink-0 sm:size-4" aria-hidden="true" />
      <div className="min-w-0 text-base/6 sm:text-sm/6">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? "mt-1" : undefined}>{children}</div>
      </div>
    </aside>
  );
}
