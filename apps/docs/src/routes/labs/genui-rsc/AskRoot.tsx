"use client";

import { GenUIRoot } from "@comp0/genui/rsc/client";
import { type ReactNode } from "react";
import { useNavigate } from "react-router";
import { ShaderCanvas } from "./ShaderCanvas.js";

export type AskRootProps = {
  /** The request the current answer responds to, passed on as context for a follow-up. */
  prompt: string;
  children?: ReactNode;
};

/**
 * The scope of a model's answer in the lab: the lab's tools and shader, and follow-ups. A button,
 * form, or suggestion in the answer asks again, with the request it followed.
 */
export function AskRoot({ prompt, children }: AskRootProps) {
  const navigate = useNavigate();
  return (
    <GenUIRoot
      call="/labs/genui-rsc/tools"
      slots={{ shader: <ShaderCanvas /> }}
      onAction={(action) =>
        navigate(`?${new URLSearchParams({ prompt: action.message, after: prompt })}`)
      }
    >
      {children}
    </GenUIRoot>
  );
}
