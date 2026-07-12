import { createContext, useContext, type HTMLAttributes } from "react";
import { type CollectionItemRecord } from "./collection-shared.js";

/**
 * The menubar itself; give it an aria-label naming the application area it
 * commands, such as "Text editor".
 */
export type MenubarProps = HTMLAttributes<HTMLDivElement>;

export type MenubarContextValue = {
  /** True while any menu in the bar is open, so focus can carry openness. */
  anyOpen: boolean;
  /** The key of the single menubar item currently holding the tab stop. */
  tabStopKey: string;
  setTabStopKey: (key: string) => void;
  /** Reports an item's menu open state with a closer used by closeOthers. */
  reportMenu: (key: string, open: boolean, close: () => void) => void;
  /** Closes every open menu in the bar except the given item's own. */
  closeOthers: (key: string) => void;
  register: (
    key: string,
    textValue: string,
    element: HTMLElement | null,
    disabled?: boolean,
  ) => void;
  items: () => CollectionItemRecord[];
};

export const MenubarContext = createContext<MenubarContextValue | null>(null);

export function useMenubarContext() {
  return useContext(MenubarContext);
}
