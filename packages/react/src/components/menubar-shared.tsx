import { createContext, useContext } from "react";
import { type CollectionItemRecord } from "./collection-shared.js";

export type MenubarContextValue = {
  register: (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  items: () => CollectionItemRecord[];
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

export const MenubarContext = createContext<MenubarContextValue | null>(null);

export function useMenubarContext() {
  return useContext(MenubarContext);
}
