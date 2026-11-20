"use client";

import { useEffect, useState, type ReactNode } from "react";

type SourcePanelProps = { href: string; title: string; children?: ReactNode };
export function SourcePanel({ href, title, children }: SourcePanelProps) {
  const [requested, setRequested] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  useEffect(() => {
    if (!requested) return;
    const controller = new AbortController();
    async function load() {
      const [result, { createFromReadableStream }] = await Promise.all([
        fetch(href, {
          headers: { Accept: "text/x-component" },
          signal: controller.signal,
        }),
        import("@vitejs/plugin-rsc/browser"),
      ]);
      if (!result.ok || !result.body) throw new Error("Source unavailable");
      const code = await createFromReadableStream<ReactNode>(result.body);
      if (!controller.signal.aborted) setContent(code);
    }
    // The ordinary link also works before hydration and if the highlighted view is unavailable.
    void load().catch(() => {
      if (!controller.signal.aborted) setRequested(false);
    });
    return () => controller.abort();
  }, [href, requested]);
  return (
    <details
      className="min-w-0"
      onToggle={(e) => {
        if (e.currentTarget.open) setRequested(true);
      }}
    >
      <summary className="w-fit cursor-pointer py-2 text-lg font-semibold">{title}</summary>
      {children}
      {content ?? (
        <a href={href} className="underline underline-offset-4">
          View plain source
        </a>
      )}
    </details>
  );
}
