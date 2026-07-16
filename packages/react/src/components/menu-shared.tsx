import {
  createContext,
  Fragment,
  useContext,
  type AnchorHTMLAttributes,
  type ElementType,
  type HTMLAttributes,
} from "react";
import { type PopoverPlacementProps } from "./overlay-shared.js";

export type MenuProps = Omit<HTMLAttributes<HTMLElement>, "onToggle"> & {
  as?: ElementType | typeof Fragment | undefined;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Receives the next open state rather than a native ToggleEvent. */
  onToggle?: ((open: boolean) => void) | undefined;
};

export type MenuTriggerProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-expanded"
> & {
  as?: ElementType | typeof Fragment | undefined;
} & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "download" | "href" | "rel" | "target">;

export type MenuPopoverProps = HTMLAttributes<HTMLDivElement> & PopoverPlacementProps;

export type MenuListProps = Omit<HTMLAttributes<HTMLDivElement>, "role">;

export type MenuItemProps = Omit<HTMLAttributes<HTMLDivElement>, "id"> & {
  value?: string | undefined;
  id?: string | undefined;
  disabled?: boolean | undefined;
  /** Overrides the text crawled from children for typeahead. */
  textValue?: string | undefined;
};

export type MenuSectionProps = HTMLAttributes<HTMLDivElement>;

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

export const MenuRootContext = createContext<MenuRootContextValue | null>(null);

export function useMenuRootContext() {
  return useContext(MenuRootContext);
}

export type ContextMenuContextValue = {
  /** The content id of the context menu's own popover, so nested submenu popovers stay untouched. */
  contentId: string;
  /** The pointer position recorded when the menu opened, in viewport pixels. */
  position: { x: number; y: number };
  /** Records the position, remembers the focus to restore, and opens. */
  openAt: (x: number, y: number) => void;
};

export const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export function useContextMenuContext() {
  return useContext(ContextMenuContext);
}
