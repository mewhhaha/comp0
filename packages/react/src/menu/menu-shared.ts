import { type Collection } from "@comp0/core";
import { createRequiredContext } from "../internal/context.js";

export type MenuInitialFocus = "first" | "last";

export type MenuRootContextValue = {
  open: boolean;
  isSubmenu: boolean;
  triggerId: string;
  contentId: string;
  setOpen: (open: boolean) => void;
  setListId: (id: string | undefined) => void;
  /** Closes this menu and every ancestor, focusing the topmost trigger. */
  closeAll: () => void;
  focusTrigger: () => void;
  focusInitial: () => void;
  /** Chooses which item the next open focuses; ArrowUp on a trigger requests "last". */
  requestInitialFocus: (position: MenuInitialFocus) => void;
  setInitialFocus: (focus: ((position: MenuInitialFocus) => void) | null) => void;
  setTriggerElement: (element: HTMLElement | null) => void;
  setSurfaceElement: (element: HTMLDivElement | null) => void;
};

export const [MenuRootContext, useMenuRootContext, useOptionalMenuRootContext] =
  createRequiredContext<MenuRootContextValue>("Menu");

export type MenuListContextValue = {
  /** The document-order registry every MenuItem and submenu trigger joins. */
  collection: Collection;
  /** Closes the whole menu after an item is activated. */
  close: () => void;
};

export const [MenuListContext, useMenuListContext, useOptionalMenuListContext] =
  createRequiredContext<MenuListContextValue>("MenuList");

export type ContextMenuContextValue = {
  /** The content id of the context menu's own popover, so nested submenu popovers stay untouched. */
  contentId: string;
  /** The pointer position recorded when the menu opened, in viewport pixels. */
  position: { x: number; y: number };
  /** Records the position, remembers the focus to restore, and opens. */
  openAt: (x: number, y: number) => void;
};

export const [ContextMenuContext, useContextMenuContext, useOptionalContextMenuContext] =
  createRequiredContext<ContextMenuContextValue>("ContextMenu");
