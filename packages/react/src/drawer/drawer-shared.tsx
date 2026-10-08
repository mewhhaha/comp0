import { type OverlayContextValue } from "../internal/overlay/context.js";
import { createRequiredContext } from "../internal/context.js";

export type DrawerSide = "left" | "right" | "top" | "bottom";

export type DrawerContextValue = OverlayContextValue & {
  side: DrawerSide;
};

export const [DrawerContext, useDrawerContext] =
  createRequiredContext<DrawerContextValue>("Drawer");
