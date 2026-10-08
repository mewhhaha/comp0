import { type Collection, type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

/** A bar item: its menu trigger plus the open state the bar coordinates. */
export type MenubarItem = CollectionItem & {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export type MenubarContextValue = {
  /** The document-order registry of the bar's menu triggers and their open state. */
  collection: Collection<MenubarItem>;
  /** True while any menu in the bar is open, so focus can carry openness. */
  isAnyOpen: () => boolean;
  /** Closes every open menu in the bar except the given item's own. */
  closeOthers: (key: string) => void;
  /** Re-applies the single roving tab stop after items mount or unmount. */
  syncTabStops: () => void;
  /**
   * Moves focus to the roving target of an arrow, Home, or End press and
   * opens the target's menu when asked; returns whether focus moved.
   */
  moveFocus: (currentKey: string, eventKey: string, options?: { open?: boolean }) => boolean;
};

export const [MenubarContext, useMenubarContext, useOptionalMenubarContext] =
  createRequiredContext<MenubarContextValue>("Menubar");
