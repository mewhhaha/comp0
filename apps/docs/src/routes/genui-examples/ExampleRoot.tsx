"use client";

import { GenUIRoot, type GenUIRootProps } from "@comp0/genui/rsc/client";
import { type ReactNode } from "react";
import { contracts, hasComposition } from "../../examples/genui/gallery/contracts.js";

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

type ExampleRootProps = { slug: string; children: ReactNode };
export function ExampleRoot({ slug, children }: ExampleRootProps) {
  if (!hasComposition(slug)) return children;
  const transport: Pick<GenUIRootProps, "call" | "render"> = {};
  if (slug === "repair-desk") transport.call = "/genui/examples/tools";
  if (slug === "night-train") transport.render = renderDepartures;
  return (
    <GenUIRoot ui={contracts[slug]} {...transport}>
      {children}
    </GenUIRoot>
  );
}
