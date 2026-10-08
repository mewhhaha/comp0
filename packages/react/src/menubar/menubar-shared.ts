import { type Collection, type CollectionItem } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type MenubarContextValue = {
  /** Registers, updates, or (with a null element) unregisters one bar item. */
  register: (item: CollectionItem) => void;
  collection: Collection;
  /** Tracks a menu's open state and setter so the bar can coordinate menus. */
  reportMenu: (key: string, open: boolean, setOpen: ((open: boolean) => void) | null) => void;
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
