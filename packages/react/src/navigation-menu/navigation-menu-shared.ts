import { type Collection, type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

/** A focus stop of the navigation: a top-level trigger or a link, in the row or inside a panel. */
export type NavigationStop = CollectionItem & {
  kind: "trigger" | "link";
  /** The item value of the open panel a link sits in; undefined for the top-level row. */
  panel: string | undefined;
  /** The item value a trigger opens. */
  value: string | undefined;
};

export type NavigationMenuContextValue = {
  value: string;
  open: (value: string) => void;
  close: () => void;
  scheduleOpen: (value: string) => void;
  cancelOpen: () => void;
  /** The document-order registry of every trigger and link. */
  stops: Collection<NavigationStop>;
};

export const [NavigationMenuContext, useNavigationMenuContext] =
  createRequiredContext<NavigationMenuContextValue>("NavigationMenu");

export type NavigationMenuItemContextValue = {
  value: string;
  open: boolean;
  triggerId: string;
  panelId: string;
};

export const [NavigationMenuItemContext, useNavigationMenuItemContext] =
  createRequiredContext<NavigationMenuItemContextValue>("NavigationMenuItem");

/** Provided by NavigationMenuPanel so links know which panel they belong to. */
export const [NavigationMenuPanelContext, , useOptionalNavigationMenuPanelContext] =
  createRequiredContext<{ value: string }>("NavigationMenuPanel");
