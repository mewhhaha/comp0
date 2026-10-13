"use client";

import { GenUIRoot } from "@comp0/genui/rsc/client";
import { useState, type ReactNode } from "react";
import { editState, editVocabulary } from "./contract.js";

type RecordedTurn = { key: number; content: ReactNode };

export type EditRootProps = { children: ReactNode };
export function EditRoot({ children }: EditRootProps) {
  const [turns, setTurns] = useState<RecordedTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [revised, setRevised] = useState(false);
  const [message, setMessage] = useState("The first answer is ready to revise.");

  async function revise(mode: "revision" | "invalid") {
    setPending(true);
    setMessage("Streaming a follow-up…");
    try {
      // Loading the browser decoder during SSR replaces the server decoder's global cache.
      const { createFromFetch } = await import("@vitejs/plugin-rsc/browser");
      const content = await createFromFetch<ReactNode>(
        fetch("/labs/genui-edits/turn", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode, revised }),
        }).then((response) => {
          if (!response.ok) throw new Error("The follow-up could not be loaded.");
          return response;
        }),
      );
      setTurns((current) => [...current, { key: current.length, content }]);
      if (mode === "revision") setRevised(true);
      setMessage("Follow-up received.");
    } catch {
      setMessage("The follow-up could not be loaded.");
    } finally {
      setPending(false);
    }
  }

  return (
    <GenUIRoot
      vocabulary={editVocabulary}
      state={editState}
      onError={(errors) => setMessage(errors.map((error) => error.message).join(" "))}
      onAction={() => setMessage("Your trip was saved.")}
    >
      <div className="grid gap-8">
        <section aria-label="Trip answer" data-intelligent-ui="">
          {children}
          {turns.map((turn) => (
            <div key={turn.key}>{turn.content}</div>
          ))}
        </section>
        <section
          aria-label="Revisions"
          className="grid gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800"
        >
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-950"
              disabled={pending}
              onClick={() => void revise("revision")}
            >
              Revise the answer
            </button>
            <button
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
              disabled={pending || !revised}
              onClick={() => void revise("revision")}
            >
              Replay the revision
            </button>
            <button
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
              disabled={pending}
              onClick={() => void revise("invalid")}
            >
              Try an invalid revision
            </button>
          </div>
          <output className="text-sm/6 text-zinc-600 dark:text-zinc-400">{message}</output>
        </section>
      </div>
    </GenUIRoot>
  );
}
