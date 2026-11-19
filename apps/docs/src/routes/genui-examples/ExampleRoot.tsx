"use client";

import { GenUIRoot, type GenUIRootProps } from "@comp0/genui/rsc/client";
import { type ReactNode, useState } from "react";
import { contracts, type CompositionSlug } from "../../examples/genui/gallery/contracts.js";

const renderDepartures: NonNullable<GenUIRootProps["render"]> = async (name, props, signal) => {
  if (name !== "Departures" || typeof props.line !== "string")
    throw new Error("Expected a rail line");
  const { createFromFetch } = await import("@vitejs/plugin-rsc/browser");
  const query = new URLSearchParams({ line: props.line });
  return createFromFetch<ReactNode>(
    fetch("/genui/examples/night-train/departures?" + query, { signal }).then((response) => {
      if (!response.ok) throw new Error("Timetable unavailable");
      return response;
    }),
  );
};

type ExampleRootProps = { slug: CompositionSlug; children: ReactNode; revision?: ReactNode };
export function ExampleRoot({ slug, children, revision }: ExampleRootProps) {
  const [applied, setApplied] = useState(false);
  const transport: Pick<GenUIRootProps, "call" | "render"> = {};
  if (slug === "repair-desk") transport.call = "/genui/examples/tools";
  if (slug === "night-train") transport.render = renderDepartures;
  return (
    <GenUIRoot ui={contracts[slug]} {...transport}>
      {children}
      {revision && (
        <div className="mt-4">
          <button
            type="button"
            disabled={applied}
            onClick={() => setApplied(true)}
            className="min-h-11 rounded-md bg-teal-800 px-4 font-semibold text-white disabled:bg-zinc-600"
          >
            {applied ? "Encore added" : "Add the encore"}
          </button>
          {applied && revision}
        </div>
      )}
    </GenUIRoot>
  );
}
