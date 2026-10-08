import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type NavigationMenuContextValue = {
  value: string;
  open: (value: string) => void;
  close: () => void;
  scheduleOpen: (value: string) => void;
  cancelOpen: () => void;
  /** The registry of top-level triggers, keyed by item value. */
  triggers: Collection;
};

export const [NavigationMenuContext, useNavigationMenuContext] =
  createRequiredContext<NavigationMenuContextValue>("NavigationMenu");

export type NavigationMenuItemContextValue = {
  value: string;
  open: boolean;
  triggerId: string;
  contentId: string;
};

export const [NavigationMenuItemContext, useNavigationMenuItemContext] =
  createRequiredContext<NavigationMenuItemContextValue>("NavigationMenuItem");
