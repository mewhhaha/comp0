"use client";

import { GenUIRoot } from "@comp0/genui/rsc/client";
import { type ReactNode } from "react";
import { ui } from "./ui.js";

export function AnswerRoot({ children }: { children: ReactNode }) {
  return <GenUIRoot ui={ui}>{children}</GenUIRoot>;
}
