"use client";

import { GenUIRoot, type GenUIRootProps } from "@comp0/genui/rsc/client";
import { type ReactNode } from "react";
import { labState, labVocabulary } from "./contract.js";

const render: NonNullable<GenUIRootProps["render"]> = async (name, props, signal) => {
  // The browser decoder installs its module loader globally; importing it during SSR replaces
  // the server decoder's cache. Initialize it only when a client refresh needs the transport.
  const { createFromFetch } = await import("@vitejs/plugin-rsc/browser");
  return createFromFetch<ReactNode>(
    fetch("/labs/genui-rsc/components", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, props }),
      signal,
    }).then((response) => {
      if (!response.ok) throw new Error("Component refresh failed");
      return response;
    }),
  );
};

export type LabRootProps = Pick<GenUIRootProps, "children" | "onAction">;
export function LabRoot({ children, onAction }: LabRootProps) {
  return (
    <GenUIRoot
      vocabulary={labVocabulary}
      state={labState}
      call="/labs/genui-rsc/tools"
      render={render}
      onAction={onAction}
    >
      {children}
    </GenUIRoot>
  );
}
