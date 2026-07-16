import { createContext, useContext } from "react";
import type { OverlayContextValue } from "./overlay-shared.js";

export type DrawerSide = "left" | "right" | "top" | "bottom";

export type DrawerContextValue = OverlayContextValue & {
  side: DrawerSide;
};

export const DrawerContext = createContext<DrawerContextValue | null>(null);

export function useDrawerContext() {
  return useContext(DrawerContext);
}
